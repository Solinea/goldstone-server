"""Models for implementing directed resource graphs in Goldstone."""
# Copyright 2015 Solinea, Inc.
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
from django.db import models
from django.utils.encoding import force_str
from mptt.models import MPTTModel, TreeForeignKey
from polymorphic import PolymorphicModel
from django.db.models import CharField, IntegerField, Model, TextField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from goldstone.utils import utc_now


class PolyResource(PolymorphicModel):
    """The base type for resources in Goldstone."""

    id = UUIDField(version=1, auto=True, primary_key=True)
    name = CharField(max_length=64, unique=True)
    created = CreationDateTimeField(editable=False,
                                    blank=True,
                                    default=utc_now)
    updated = ModificationDateTimeField(editable=True, blank=True)

    def _hashable(self):
        """Return a JSON representation of this row."""
        from rest_framework.renderers import JSONRenderer
        from .serializers import PolyResourceSerializer

        return JSONRenderer().render(PolyResourceSerializer(self).data)


#
# These nodes are for the Resource Instance graph.
#

class Agent(PolyResource):
    port = IntegerField(
        editable=True,
        blank=True,
        default=5514)


class Hypervisor(PolyResource):
    vcpus = IntegerField(
        editable=True,
        blank=True,
        default=8)
    mem = IntegerField(
        editable=True,
        blank=True,
        default=8192)


class KeystoneDomain(PolyResource):
    """ reflection of a domain in keystone"""

    pass


class KeystoneProject(PolyResource):
    """ reflection of a project in keystone"""

    pass


class KeystoneUser(PolyResource):
    """ reflection of a user in keystone"""

    pass


class KeystoneRole(PolyResource):
    """ reflection of a project in keystone"""

    pass


class NovaRegion(PolyResource):
    """ reflection of a hypervisor in nova"""

    pass


class NovaHost(PolyResource):
    """ reflection of a hypervisor in nova"""

    pass


class NovaHypervisor(PolyResource):
    """ reflection of a hypervisor in nova"""

    pass


class NovaServer(PolyResource):
    """ reflection of a server (VM) in nova"""

    pass


#
# These are the types of edges between Resource Type nodes.
#
# These could be created dynamically from a list of strings, but this is
# simpler and allows us to easily customize an edge, if it becomes necessary.
#

class RTEdge(PolyResource):
    """The base class for all Resource Type edges.

    This allows us to recognize an object as some kind of edge, filter all
    edges in the graph, etc.

    """

    pass

class RTEdgeContains(RTEdge):
RT_EDGE_TYPES = ["Contains", "AppliesTo", "AssignedTo", "Manages"]
for entry in RT_EDGE_TYPES:
    entry = type(entry, (), {})
