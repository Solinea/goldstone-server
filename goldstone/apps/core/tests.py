# Copyright '2014' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.test import SimpleTestCase
from models import *
from datetime import datetime
__author__ = 'stanford'


class ModelTests(SimpleTestCase):

    def setUp(self):
        Entity.objects.get_or_create(name="entity 1")
        Entity.objects.get_or_create(name="entity 2")
        Project.objects.get_or_create(name="project 1")
        Project.objects.get_or_create(name="project 2")
        Resource.objects.get_or_create(name="resource 1")
        Resource.objects.get_or_create(name="resource 2",
                                       last_seen=datetime.now())
        Node.objects.get_or_create(name="node 1")
        Node.objects.get_or_create(name="node 2")
        Service.objects.get_or_create(name="service 1")
        Service.objects.get_or_create(name="service 2")

    def test_entity_relation(self):
        e1 = Entity.objects.get(name="entity 1")
        e2 = Entity.objects.get(name="entity 2")
        e1.add_relationship(e2, "has")

        e1_rels = e1.get_relationships("has")
        self.assertEqual(e1_rels.count(), 1)
        self.assertEqual(e1_rels[0], e2)

        e1_rel_tos = e1.get_related_to("has")
        self.assertEqual(e1_rel_tos.count(), 0)

        e2_rel_tos = e2.get_related_to("has")
        self.assertEqual(e2_rel_tos.count(), 1)
        self.assertEqual(e2_rel_tos[0], e1)

        e1.remove_relationship(e2, "has")

    def test_polymorphism(self):
        entities = Entity.objects.all()
        self.assertEqual(entities.count(), 10)

        projects = Project.objects.all()
        self.assertEqual(projects.count(), 2)

        resources = Resource.objects.all()
        self.assertEqual(resources.count(), 4)

        services = Service.objects.all()
        self.assertEqual(services.count(), 2)

        nodes = Node.objects.all()
        self.assertEqual(nodes.count(), 2)

    def test_unicode(self):
        e1 = Entity.objects.get(name="entity 1")
        u = e1.__unicode__()
        self.assertDictContainsSubset({"name": "entity 1"}, json.loads(u))
        self.assertIn('uuid', json.loads(u))

        p1 = Project.objects.get(name="project 1")
        u = p1.__unicode__()
        self.assertDictContainsSubset({"name": "project 1"}, json.loads(u))
        self.assertIn('version', json.loads(u))

        r1 = Resource.objects.get(name="resource 1")
        u = r1.__unicode__()
        self.assertDictContainsSubset({"name": "resource 1"}, json.loads(u))
        self.assertIn('last_seen', json.loads(u))
        self.assertEqual(u'', json.loads(u)['last_seen'])
        self.assertIn('last_seen_method', json.loads(u))
        self.assertIn('admin_disabled', json.loads(u))
        r2 = Resource.objects.get(name="resource 2")
        u = r2.__unicode__()
        self.assertIn('last_seen', json.loads(u))
        self.assertNotEqual(u'', json.loads(u)['last_seen'])
