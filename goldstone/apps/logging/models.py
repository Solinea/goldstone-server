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


from django.db import models
import logging
from django.db.models import IntegerField
from polymorphic import PolymorphicManager, PolymorphicQuerySet
from polymorphic.query import Polymorphic_QuerySet_objects_per_request
from goldstone.apps.core.models import Node
from goldstone.apps.logging.es_models import LoggingNodeStats



__author__ = 'stanford'

logger = logging.getLogger(__name__)


class BlingedPolymorphicQuerySet(PolymorphicQuerySet):

    def iterator(self):
        """
        This function is used by Django for all object retrieval.
        By overriding it, we modify the objects that this queryset returns
        when it is evaluated (or its get method or other object-returning
        methods are called).

        Here we do the same as:

            base_result_objects=list(super(PolymorphicQuerySet, self).iterator())
            real_results=self._get_real_instances(base_result_objects)
            for o in real_results: yield o

        but it requests the objects in chunks from the database,
        with Polymorphic_QuerySet_objects_per_request per chunk
        """
        base_iter = super(PolymorphicQuerySet, self).iterator()

        # disabled => work just like a normal queryset
        if self.polymorphic_disabled:
            for o in base_iter:
                node_stats = LoggingNodeStats(o.name)
                o.error_count = node_stats.error
                o.warning_count = node_stats.warning
                o.info_count = node_stats.info
                o.audit_count = node_stats.audit
                o.debug_count = node_stats.debug

                yield o
            raise StopIteration

        while True:
            base_result_objects = []
            reached_end = False

            for i in range(Polymorphic_QuerySet_objects_per_request):
                try:
                    o = next(base_iter)
                    base_result_objects.append(o)
                except StopIteration:
                    reached_end = True
                    break

            real_results = self._get_real_instances(base_result_objects)

            for o in real_results:
                node_stats = LoggingNodeStats(o.name)
                o.error_count = node_stats.error
                o.warning_count = node_stats.warning
                o.info_count = node_stats.info
                o.audit_count = node_stats.audit
                o.debug_count = node_stats.debug
                yield o

            if reached_end:
                raise StopIteration


class LoggingNodeManager(PolymorphicManager):
    """
    A custom manager that merges in ES log data for a node.
    """
    queryset_class = BlingedPolymorphicQuerySet


class LoggingNode(Node):
    """
    This is an class that uses a core Node as the basis, then
    augments it with log related data such as counts by level for a time
    period.
    """
    error_count = 0
    warning_count = 0
    info_count = 0
    audit_count = 0
    debug_count = 0
    objects = LoggingNodeManager()

    class Meta:
        proxy = True
