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
from django.db.models import CharField, ForeignKey, BooleanField, Model, \
    ManyToManyField, DateTimeField, TextField
from django_extensions.db.fields import UUIDField, ModificationDateTimeField, \
    CreationDateTimeField
from polymorphic import PolymorphicModel
from elasticutils import Indexable, MappingType, S
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
    def get_index(cls):
        if 'event' in settings.ES_INDEXES:
            return settings.ES_INDEXES['event']
        else:
            return settings.ES_INDEXES['default']

    @classmethod
    def get_mapping_type_name(cls):
        return 'event_type'

    @classmethod
    def get_mapping(cls):
        """Returns an Elasticsearch mapping for this MappingType"""
        return {
            'properties': {
                # The id is a uuid
                'id': {'type': 'string', 'index': 'not_analyzed'},
                'event_type': {'type': 'string', 'index': 'not_analyzed'},
                'source_id': {'type': 'string', 'index': 'not_analyzed'},
                # The message has free-form text in it, so analyze it with
                # snowball.
                'message': {'type': 'string', 'analyzer': 'snowball'},
                'created': {'type': 'date', 'index': 'not_analyzed'},
                'updated': {'type': 'date', 'index': 'not_analyzed'}
            }
        }

    def extract_document(self, obj_id, obj):
        """Converts this instance into an Elasticsearch document"""

        return {
            'id': str(obj.id),
            'event_type': obj.event_type,
            'source_id': str(obj.source_id),
            'message': obj.message,
            'created': obj.created,
            'updated': obj.updated
        }


class Event(object):
    id = str(uuid4())
    event_type = None
    source_id = ""
    message = None
    created = arrow.utcnow()
    updated = created

    _mt = EventType()

    # todo integrate pagination/slicing
    # todo return results as Events rather than EventType mappings
    @classmethod
    def search(cls, *args, **kwargs):
        '''
        This passes through to an executed search via elastic utils and returns
        the objects.  Currently the objects are EventType mapping types.

        WARNING!!! it is not sliced at this time, so your search params
        (kwargs) should return a reasonable number of results.

        '''
        if 'id' in kwargs:
            kwargs['_id'] = kwargs['id']
            del kwargs['id']

        logger.info("calling search with id = %s", kwargs['_id'])
        logger.info("calling search with kwargs = %s", json.dumps(kwargs))
        result = S(EventType).query(*args, **kwargs).execute().objects
        logger.info("result = %s", str(result))
        return result

    def __init__(self, event_type, message, source_id=""):
        self.event_type = event_type
        self.message = message
        self.source_id = str(source_id)

    def __repr__(self):
        return json.dumps({
            "id": str(self.id),
            "event_type": self.event_type,
            "source_id": "" if self.source_id is None else str(self.src_id),
            "message": self.message,
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })

    def save(self):
        self._mt.index(self.__dict__, id_=self.id)

    def delete(self):
        self._mt.unindex(self.id)


class Resource(Entity):
    METHOD_CHOICES = (
        ('LOGS', 'Log Stream Activity'),
        ('API', 'Application API Call'),
    )
    last_seen = DateTimeField(null=True, blank=True)
    last_seen_method = CharField(max_length=32, choices=METHOD_CHOICES,
                                 null=True, blank=True)
    admin_disabled = BooleanField(default=False)

    def __unicode__(self):
        entity = json.loads(super(Resource, self).__unicode__())
        entity = dict(entity.items() + {
            "last_seen": self.last_seen.isoformat() if
            self.last_seen is not None else "",
            "last_seen_method": self.last_seen_method,
            "admin_disabled": self.admin_disabled}.items())

        return json.dumps(entity)


class Node(Resource):
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
