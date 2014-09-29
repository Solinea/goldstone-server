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
from django.db.models import CharField, ForeignKey, BooleanField, Model, \
    ManyToManyField, DateTimeField, TextField
from django_extensions.db.fields import UUIDField, ModificationDateTimeField, \
    CreationDateTimeField
from polymorphic import PolymorphicModel

__author__ = 'stanford'

#
# polymorphic model abstractions
#
class Entity(PolymorphicModel):
    uuid = UUIDField(unique=True)
    name = CharField(max_length=255, unique=True)
    created = CreationDateTimeField()
    updated = ModificationDateTimeField()
    entity_rels = ManyToManyField('self',
                                  through='Entity2EntityRelationship',
                                  related_name='related_to',
                                  symmetrical=False)

    def add_relationship(self, e, relation_name):
        relationship, created = Entity2EntityRelationship.\
            objects.get_or_create(
                from_entity=self,
                to_entity=e,
                relation=relation_name)
        return relationship

    def remove_relationship(self, e, relation_name):
        Entity2EntityRelationship.objects.filter(
            from_entity=self,
            to_entity=e,
            relation=relation_name).delete()
        return

    def get_relationships(self, relation_name):
        return self.entity_rels.filter(
            to_entity__relation=relation_name,
            to_entity__from_entity=self)

    def get_related_to(self, relation_name):
        return self.related_to.filter(
            from_entity__relation=relation_name,
            from_entity__to_entity=self)

    def __unicode__(self):
        return json.dumps({
            "uuid": "" if self.uuid is None else self.uuid,
            "name": self.name,
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })


class Entity2EntityRelationship(Model):
    # TODO enumerate the known relation types?
    from_entity = ForeignKey(Entity, to_field='uuid',
                             related_name='from_entity')
    to_entity = ForeignKey(Entity, to_field='uuid',
                           related_name='to_entity')
    relation = CharField(max_length=32)


class Event(PolymorphicModel):
    uuid = UUIDField(unique=True)
    event_type = CharField(max_length=255)
    created = CreationDateTimeField()
    updated = ModificationDateTimeField()
    message = TextField(max_length=1024)
    entity_rels = ManyToManyField('self',
                                  through='Event2EntityRelationship',
                                  related_name='related_entities',
                                  symmetrical=False)
    event_rels = ManyToManyField('self',
                                 through='Event2EventRelationship',
                                 related_name='related_events',
                                 symmetrical=False)

    def add_entity_rel(self, e, relation_name):
        relationship, created = Event2EntityRelationship.objects.get_or_create(
            from_event=self,
            to_entity=e,
            relation=relation_name)
        return relationship

    def remove_entity_rel(self, e, relation_name):
        Event2EntityRelationship.objects.filter(
            from_event=self,
            to_entity=e,
            relation=relation_name).delete()
        return

    def get_entity_rels(self, relation_name):
        return self.event_rels.filter(
            to_entity__relation=relation_name,
            to_entity__from_event=self)

    def get_related_entities(self, relation_name):
        return self.related_entities.filter(
            from_event__relation=relation_name,
            from_event__to_entity=self)

    def add_event_rel(self, e, relation_name):
        relationship, created = Event2EventRelationship.objects.get_or_create(
            from_event=self,
            to_event=e,
            relation=relation_name)
        return relationship

    def remove_event_rel(self, e, relation_name):
        Event2EventRelationship.objects.filter(
            from_event=self,
            to_event=e,
            relation=relation_name).delete()
        return

    def get_event_rels(self, relation_name):
        return self.event_rels.filter(
            to_event__relation=relation_name,
            to_event__from_event=self)

    def get_related_events(self, relation_name):
        return self.related_events.filter(
            from_event__relation=relation_name,
            from_event__to_vent=self)

    def __unicode__(self):
        return json.dumps({
            "uuid": "" if self.uuid is None else self.uuid,
            "event_type": self.event_type,
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })


class EventRelationship(Model):
    from_event = ForeignKey(Event, to_field='uuid',
                            related_name='from_event')
    relation = CharField(max_length=64)


class Event2EntityRelationship(Model):
    to_entity = ForeignKey(Entity, to_field='uuid',
                           related_name='to_entity')

    def __unicode__(self):
        return json.dumps({
            "from_event": str(self.from_event),
            "event_type": str(self.event_type),
            "to_entity": str(self.from_event),
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })


class Event2EventRelationship(Model):
    to_event = ForeignKey(Event, to_field='uuid',
                          related_name='to_event')

    def __unicode__(self):
        return json.dumps({
            "from_event": str(self.from_event),
            "event_type": str(self.event_type),
            "to_event": str(self.from_event),
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })


class Project(Entity):
    """
    Represents and OpenStack project such as Nova, Cinder, or Glance.  These
    will initially be defined in configuration, but perhaps discovered in a
    later version of goldstone.
    """
    version = CharField(max_length=64)

    def __unicode__(self):
        entity = json.loads(super(Project, self).__unicode__())
        entity = dict(entity.items() + {"version": self.version}.items())
        return json.dumps(entity)


class Service(Entity):
    """
    Generic service representations.  Obvious use cases are nova service-list,
    etc.  There will most likely be other not so obvious uses as we evolve.
    """


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

