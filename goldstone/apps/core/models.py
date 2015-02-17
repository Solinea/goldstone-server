"""Core models."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from uuid import uuid4
import arrow
from django.core.exceptions import ValidationError
from django.db.models import CharField, Model, DateTimeField, \
    TextField, DecimalField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from elasticutils.contrib.django import MappingType, Indexable
import logging
from django.conf import settings
from goldstone.utils import utc_now

logger = logging.getLogger(__name__)


#
# Event Stream Events
#
class EventType(MappingType, Indexable):

    @classmethod
    def search(cls):
        return super(EventType, cls).search().es(urls=settings.ES_URLS,
                                                 timeout=2,
                                                 max_retries=1,
                                                 sniff_on_start=False)

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
        return Event.reconstitute(
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
    es_objects = EventType.search()

    def __init__(self, *args, **kwargs):
        """Initialize the object."""

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
    def reconstitute(cls, **kwargs):
        """Allow the mapping type to create an object from ES data."""

        obj = cls(**kwargs)
        obj.id = kwargs['id']
        obj.created = arrow.get(kwargs['created']).datetime

        return obj

    @classmethod
    def get(cls, **kwargs):

        try:
            return cls.es_objects.filter(**kwargs)[0].get_object()
        except Exception:       # pylint: disable=W0703
            return None

    def save(self, force_insert=False, force_update=False):
        """Overridded to save the object to ES via elasticutils."""

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
    def search(cls):
        return super(MetricType, cls).search().es(urls=settings.ES_URLS,
                                                  timeout=2,
                                                  max_retries=1,
                                                  sniff_on_start=False)

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

        return Metric.reconstitute(
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
    es_objects = MetricType.search()

    @classmethod
    def reconstitute(cls, **kwargs):
        """Allow the mapping type to create an object from ES data."""
        return cls(**kwargs)

    @classmethod
    def get(cls, **kwargs):
        try:
            return cls.es_objects.filter(**kwargs)[0].get_object()
        except Exception:       # pylint: disable=W0703
            return None

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
    def search(cls):
        return super(ReportType, cls).search().es(urls=settings.ES_URLS,
                                                  timeout=2,
                                                  max_retries=1,
                                                  sniff_on_start=False)

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

        return Report.reconstitute(
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
    es_objects = ReportType.search()

    @classmethod
    def reconstitute(cls, **kwargs):
        """Allows the mapping type to create an object from ES data."""

        # reports could be stringified JSON, so let's find out
        if "value" in kwargs and type(kwargs["value"]) is list:
            new_val = []

            for item in kwargs["value"]:
                try:
                    new_val.append(json.loads(item))
                except Exception:       # pylint: disable=W0703
                    new_val.append(item)

            kwargs['value'] = new_val

        else:
            logger.debug("no value present in kwargs, or value not a list")

        return cls(**kwargs)

    @classmethod
    def get(cls, **kwargs):

        try:
            return cls.es_objects.filter(**kwargs)[0].get_object()
        except Exception:       # pylint: disable=W0703
            return None

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


def validate_str_bool(value):
    if value not in [x[0] for x in Node.MANAGED_CHOICES]:
        raise ValidationError(u'%s is not "true" or "false"' % value)


def validate_method_choices(value):
    if value not in [x[0] for x in Node.METHOD_CHOICES]:
        raise ValidationError(u'%s is not a valid method' % value)


class Node(Model):

    # there is some strange filtering behavior for booleans, so we'll store
    # admin_disabled as a string representation of a boolean.  There is a
    # discussion here:
    # https://github.com/tomchristie/django-rest-framework/issues/2122
    MANAGED_CHOICES = (
        ('true', 'true'),
        ('false', 'false')
    )

    METHOD_CHOICES = (
        ('PING', 'Successful Host Ping'),
        ('LOGS', 'Log Stream Activity'),
        ('API', 'Application API Call'),
        ('AGENT', 'Application Agent'),
        ('UNKNOWN', 'Not Provided'),
    )

    id = UUIDField(version=1, auto=True, primary_key=True)
    name = CharField(max_length=64, unique=True)
    created = CreationDateTimeField(editable=False, blank=True,
                                    default=utc_now)

    # updated = ModificationDateTimeField(editable=False, blank=True,
    #                                     default=utc_now)
    updated = ModificationDateTimeField(editable=True, blank=True)

    update_method = CharField(max_length=32, choices=METHOD_CHOICES,
                              null=True, blank=True, default="UNKNOWN",
                              validators=[validate_method_choices])
    managed = CharField(max_length=5, choices=MANAGED_CHOICES,
                        default="true", validators=[validate_str_bool])

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """Overrides the default save to validate model before transaction.

        :param force_insert:
        :param force_update:
        :param using:
        :param update_fields:

        """

        self.full_clean()
        return super(Node, self).save(force_insert, force_update, using,
                                      update_fields)
