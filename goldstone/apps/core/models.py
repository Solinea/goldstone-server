# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from uuid import uuid4
import arrow
from django.db import models
from django.db.models import CharField, BooleanField, Model, DateTimeField, \
    TextField, DecimalField, IntegerField
from django_extensions.db.fields import UUIDField, ModificationDateTimeField, \
    CreationDateTimeField
from polymorphic import PolymorphicModel
from elasticutils.contrib.django import S, MappingType, Indexable
from django.conf import settings
import logging
from pyes import BoolQuery, TermQuery, PrefixQuery
from goldstone.models import ESData

__author__ = 'stanford'

logger = logging.getLogger(__name__)


#
# polymorphic model abstractions
#
class Entity(PolymorphicModel):
    uuid = UUIDField(unique=True)
    name = CharField(max_length=255, unique=True)
    created = CreationDateTimeField()
    updated = ModificationDateTimeField()

    def __unicode__(self):
        return json.dumps({
            "uuid": "" if self.uuid is None else self.uuid,
            "name": self.name,
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })


#
# Event Stream Events
#
class EventType(MappingType, Indexable):

    @classmethod
    def get_model(cls):
        return Event

    @classmethod
    def get_mapping(cls):
        """Returns an Elasticsearch mapping for this MappingType.  These are
        a bit contrived since the template dynamically creates the mapping
        type.  It is helpful to support the ordering requests in the view.
        The view will look at the type of a field and if it is a string, will
        use the associated .raw field for ordering."""
        return {
            'properties': {
                'id': {'type': 'string'},
                'event_type': {'type': 'string'},
                'source_id': {'type': 'string'},
                'source_name': {'type': 'string'},
                'message': {'type': 'string'},
                'created': {'type': 'date'}
            }
        }

    @classmethod
    def extract_document(cls, obj_id, obj):
        """Converts this instance into an Elasticsearch document"""
        if obj is None:
            # todo this will go to the model manager which would natively
            # todo look at the SQL db.  we either need to fix this or fix the
            # todo model manager implementation of get.
            obj = cls.get_model().objects.get(pk=obj_id)

        return {
            'id': str(obj.id),
            'event_type': obj.event_type,
            'source_id': str(obj.source_id),
            'source_name': obj.source_name,
            'message': obj.message,
            'created': obj.created.isoformat()
        }

    def get_object(self):
        return Event._reconstitute(
            id=self._id,
            event_type=self._results_dict['event_type'],
            message=self._results_dict['message'],
            source_id=self._results_dict['source_id'],
            source_name=self._results_dict['source_name'],
            created=arrow.get(self._results_dict['created']).datetime
        )


class Event(Model):
    id = CharField(max_length=36, primary_key=True)
    event_type = CharField(max_length=64)
    source_id = CharField(max_length=36, blank=True)
    source_name = CharField(max_length=64, blank=True)
    message = CharField(max_length=1024)
    created = DateTimeField(auto_now=False)

    _mt = EventType()

    def __init__(self, *args, **kwargs):
        super(Event, self).__init__(*args, **kwargs)
        self.id = str(uuid4())
        if 'created' in kwargs:
            self.created = arrow.get(kwargs['created']).datetime
        else:
            self.created = arrow.utcnow().datetime
        if 'source_id' not in kwargs:
            self.source_id = ""
        if 'source_name' not in kwargs:
            self.source_name = ""


    @classmethod
    def _reconstitute(cls, **kwargs):
        """
        provides a way for the mapping type to create an object from ES data
        """
        obj = cls(**kwargs)
        obj.id = kwargs['id']
        obj.created = arrow.get(kwargs['created']).datetime
        return obj

    def save(self, force_insert=False, force_update=False):
        """
        An override to save the object to ES via elasticutils
        """

        self._mt.index(self._mt.extract_document(self.id, self),
                       id_=str(self.id))

    def delete(self, using=None):
        if using is not None:
            raise ValueError("using is not implemented for this model")

        self._mt.unindex(str(self.id))


#
# Goldstone Agent Metrics and Reports
#
class MetricType(MappingType, Indexable):

    @classmethod
    def get_model(cls):
        return Metric

    @classmethod
    def get_mapping(cls):
        """Returns an Elasticsearch mapping for this MappingType"""
        return {
            'properties': {
                'timestamp': {'type': 'date'},
                'name': {'type': 'string'},
                'metric_type': {'type': 'string'},
                'value': {'type': 'double'},
                'unit': {'type': 'string'},
                'node': {'type': 'string'}
            }
        }

    def get_object(self):
        return Metric._reconstitute(
            timestamp=self._results_dict['timestamp'],
            name=self._results_dict['name'],
            metric_type=self._results_dict['metric_type'],
            value=self._results_dict['value'],
            unit=self._results_dict['unit'],
            node=self._results_dict['node']
        )


class Metric(Model):
    id = CharField(max_length=36, primary_key=True)
    timestamp = DateTimeField(auto_now=False)
    name = CharField(max_length=128)
    metric_type = CharField(max_length=36)
    value = DecimalField(max_digits=30, decimal_places=8)
    unit = CharField(max_length=36)
    node = CharField(max_length=36)

    _mt = MetricType()

    @classmethod
    def _reconstitute(cls, **kwargs):
        """
        provides a way for the mapping type to create an object from ES data
        """
        obj = cls(**kwargs)
        return obj

    def save(self, force_insert=False, force_update=False):
        """
        An override to save the object to ES via elasticutils.  This will be
        a noop for now.  Saving occurs from the logstash processing directly
        to ES.
        """
        raise NotImplementedError("save is not implemented for this model")

    def delete(self, using=None):
        raise NotImplementedError("delete is not implemented for this model")


class ReportType(MappingType, Indexable):

    @classmethod
    def get_model(cls):
        return Report

    @classmethod
    def get_mapping(cls):
        """Returns an Elasticsearch mapping for this MappingType"""
        return {
            'properties': {
                'timestamp': {'type': 'date'},
                'name': {'type': 'string'},
                'value': {'type': 'string'},
                'node': {'type': 'string'}
            }
        }

    def get_object(self):
        return Report._reconstitute(
            timestamp=self._results_dict['timestamp'],
            name=self._results_dict['name'],
            value=self._results_dict['value'],
            node=self._results_dict['node']
        )


class Report(Model):
    id = CharField(max_length=36, primary_key=True)
    timestamp = DateTimeField(auto_now=False)
    name = CharField(max_length=128)
    value = TextField(max_length=65535)
    node = CharField(max_length=36)

    _mt = ReportType()

    @classmethod
    def _reconstitute(cls, **kwargs):
        """
        provides a way for the mapping type to create an object from ES data
        """
        # reports could be stringified JSON, so let's find out
        if "value" in kwargs and type(kwargs["value"]) is list:
            new_val = []
            for item in kwargs["value"]:
                try:
                    new_val.append(json.loads(item))
                except:
                    new_val.append(item)
            kwargs['value'] = new_val

        else:
            logger.debug("no value present in kwargs, or value not a list")
        obj = cls(**kwargs)
        return obj

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """
        An override to save the object to ES via elasticutils.  This will be
        a noop for now.  Saving occurs from the logstash processing directly
        to ES.
        """
        raise NotImplementedError("save is not implemented for this model")

    def delete(self, using=None):
        raise NotImplementedError("delete is not implemented for this model")


class Node(Entity):
    """
    Generic representation of a node that has a log stream, provides services,
    etc.  The main purposes of the node is to support the availability checks,
    and to provide a relational view of the entities in the cloud.
    """
    METHOD_CHOICES = (
        ('PING', 'Successful Host Ping'),
        ('LOGS', 'Log Stream Activity'),
        ('API', 'Application API Call'),
    )

    last_seen_method = CharField(max_length=32, choices=METHOD_CHOICES,
                                 null=True, blank=True)
    admin_disabled = BooleanField(default=False)

    def __unicode__(self):
        entity = json.loads(super(Node, self).__unicode__())
        entity = dict(entity.items() + {
            "last_seen_method": self.last_seen_method,
            "admin_disabled": self.admin_disabled}.items())

        return json.dumps(entity)

