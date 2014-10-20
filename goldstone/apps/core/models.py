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
from django.db.models import CharField, BooleanField, Model, DateTimeField, \
    TextField
from django_extensions.db.fields import UUIDField, ModificationDateTimeField, \
    CreationDateTimeField
from polymorphic import PolymorphicModel
from elasticutils.contrib.django import S, MappingType, Indexable
from django.conf import settings
import logging

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


class EventType(MappingType, Indexable):

    @classmethod
    def get_model(cls):
        return Event

    @classmethod
    def get_mapping(cls):
        """Returns an Elasticsearch mapping for this MappingType"""
        return {
            'properties': {
                'id': {'type': 'string', 'index': 'not_analyzed'},
                'event_type': {'type': 'string', 'index': 'not_analyzed'},
                'source_id': {'type': 'string', 'index': 'not_analyzed'},
                'message': {'type': 'string', 'analyzer': 'snowball'},
                'created': {'type': 'date', 'index': 'not_analyzed'}
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
            'message': obj.message,
            'created': obj.created.isoformat()
        }

    def get_object(self):
        return Event._reconstitute(
            id=self._id,
            event_type=self._results_dict['event_type'],
            message=self._results_dict['message'],
            source_id=self._results_dict['source_id'],
            created=arrow.get(self._results_dict['created']).datetime
        )


class Event(Model):
    id = CharField(max_length=36, primary_key=True)
    event_type = CharField(max_length=64)
    source_id = CharField(max_length=36, blank=True)
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

    @classmethod
    def _reconstitute(cls, **kwargs):
        """
        provides a way for the mapping type to create an object from ES data
        """
        obj = cls(**kwargs)
        obj.id = kwargs['id']
        obj.created = arrow.get(kwargs['created']).datetime
        return obj

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """
        An override to save the object to ES via elasticutils
        """

        if using is not None:
            raise ValueError("using is not implemented for this model")
        if update_fields is not None:
            raise ValueError("update_fields is not implemented for this model")

        self._mt.index(self._mt.extract_document(self.id, self),
                       id_=str(self.id))

    def delete(self, using=None):
        if using is not None:
            raise ValueError("using is not implemented for this model")

        self._mt.unindex(str(self.id))


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
