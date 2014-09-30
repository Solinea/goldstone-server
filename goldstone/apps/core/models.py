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
# Many to Many relationships
#


# entites can be related to other entities
class Entity2EntityRel(Model):
    from_entity = ForeignKey('Entity', to_field='uuid',
                             related_name="from_entity")
    to_entity = ForeignKey('Entity', to_field='uuid',
                           related_name="to_entity")
    relation = CharField(max_length=64)

    def __unicode__(self):
        return json.dumps({
            "from_entity": str(self.from_entity),
            "relation": str(self.relation),
            "to_entity": str(self.to_event)
        })


# entities can be related to events
class Entity2EventRel(Model):
    from_entity = ForeignKey('Entity', to_field='uuid',
                             related_name="from_entity_ev")
    to_event = ForeignKey('Event', to_field='uuid',
                          related_name="to_event_en")
    relation = CharField(max_length=64)

    def __unicode__(self):
        return json.dumps({
            "from_entity": str(self.from_entity),
            "relation": str(self.relation),
            "to_event": str(self.to_event)
        })


# events can be related to events
class Event2EventRel(Model):
    from_event = ForeignKey('Event', to_field='uuid',
                            related_name="from_event")
    to_event = ForeignKey('Event', to_field='uuid',
                          related_name="to_event")
    relation = CharField(max_length=64)

    def __unicode__(self):
        return json.dumps({
            "from_event": str(self.from_event),
            "relation": str(self.relation),
            "to_event": str(self.to_event)
        })


#
# polymorphic model abstractions
#

class Entity(PolymorphicModel):
    uuid = UUIDField(unique=True)
    name = CharField(max_length=255, unique=True)
    created = CreationDateTimeField()
    updated = ModificationDateTimeField()
    entity_rels = ManyToManyField(
        'Entity',
        through='Entity2EntityRel',
        related_name="related_entity_set",
        symmetrical=False)
    event_rels = ManyToManyField(
        'Event',
        through='Entity2EventRel',
        related_name="+",
        symmetrical=False)

    def add_entity_rel(self, entity, relation_name):
        relationship, created = Entity2EntityRel.objects.get_or_create(
            from_entity=self,
            to_entity=entity,
            relation=relation_name)
        return relationship

    def remove_entity_rel(self, entity, relation_name):
        Entity2EntityRel.objects.filter(
            from_entity=self,
            to_entity=entity,
            relation=relation_name).delete()
        return

    # return entities related to me
    def get_entity_rels(self, relation_name):
        return self.entity_rels.filter(
            to_entity__relation=relation_name,
            to_entity__from_entity=self)

    # return items that have a relation to me
    def get_related_entities(self, relation_name):
        return self.related_entity_set.filter(
            from_entity__relation=relation_name,
            from_entity__to_entity=self)

    def add_event_rel(self, event, relation_name):
        relationship, created = Entity2EventRel.objects.get_or_create(
            from_entity=self,
            to_event=event,
            relation=relation_name)
        return relationship

    def remove_event_rel(self, event, relation_name):
        Entity2EventRel.objects.filter(
            from_entity=self,
            to_event=event,
            relation=relation_name).delete()
        return

    # return events related to me
    def get_event_rels(self, relation_name):
        return self.event_rels.filter(
            to_event_en__relation=relation_name,
            to_event_en__from_entity=self)

    def __unicode__(self):
        return json.dumps({
            "uuid": "" if self.uuid is None else self.uuid,
            "name": self.name,
            "created": self.created.isoformat(),
            "updated": self.updated.isoformat()
        })


class Event(PolymorphicModel):
    uuid = UUIDField(unique=True)
    event_type = CharField(max_length=255)
    created = CreationDateTimeField()
    updated = ModificationDateTimeField()
    message = TextField(max_length=1024)
    event_rels = ManyToManyField(
        'Event',
        through='Event2EventRel',
        related_name="related_event2event_set",
        symmetrical=False)
    entity_rels = ManyToManyField(
        'Entity',
        through='Entity2EventRel',
        related_name="+",
        symmetrical=False)

    def add_event_rel(self, e, relation_name):
        relationship, created = Event2EventRel.objects.get_or_create(
            from_event=self,
            to_event=e,
            relation=relation_name)
        return relationship

    def remove_event_rel(self, e, relation_name):
        Event2EventRel.objects.filter(
            from_event=self,
            to_event=e,
            relation=relation_name).delete()
        return

    def get_event_rels(self, relation_name):
        return self.event_rels.filter(
            to_event__relation=relation_name,
            to_event__from_event=self)

    def get_related_events(self, relation_name):
        return self.related_event2event_set.filter(
            from_event__relation=relation_name,
            from_event__to_event=self)

    # return events related to me
    def get_entity_rels(self, relation_name):
        return self.entity_rels.filter(
            from_entity_ev__relation=relation_name,
            from_entity_ev__to_event=self)

    def __unicode__(self):
        return json.dumps({
            "uuid": "" if self.uuid is None else self.uuid,
            "event_type": self.event_type,
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
