"""Test models for core unit tests.

All classes derived from goldstone.core.models.PolyResource will be added to
the Goldstone resource type graph.

"""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf import settings
from goldstone.core.models import PolyResource
import sys

# Aliases to make the Resource Graph definitions less verbose.
MAX = settings.R_ATTRIBUTE.MAX
MIN = settings.R_ATTRIBUTE.MIN
TO = settings.R_ATTRIBUTE.TO
TYPE = settings.R_ATTRIBUTE.TYPE
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN
EDGE_ATTRIBUTES = settings.R_ATTRIBUTE.EDGE_ATTRIBUTES

INSTANCE_OF = settings.R_EDGE.INSTANCE_OF
OWNS = settings.R_EDGE.OWNS


class ButterfingerBar(PolyResource):
    """A Butterfinger."""

    pass

class SnickersBar(PolyResource):
    """A Snickers."""

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: ButterfingerBar,
                 MATCHING_FN:
                 lambda f, t: f.get("name") == t.get("name"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]


class FooBar(PolyResource):
    """The FooBar add-on resource type."""

    # Identify this class as the FooBar root.
    root = True

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: SnickersBar,
                 MATCHING_FN:
                 lambda f, t: f.get("name") == t.get("name"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]
