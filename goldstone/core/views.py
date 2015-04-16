"""Core views."""
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
from goldstone.apps.drfes.serializers import DateHistogramAggSerializer
from goldstone.apps.drfes.views import ElasticListAPIView, SimpleAggView, \
    DateHistogramAggView
from rest_framework.generics import RetrieveAPIView
from goldstone.utils import TopologyMixin


from .models import MetricData, ReportData
from .serializers import MetricDataSerializer, ReportDataSerializer, \
    MetricNamesAggSerializer, ReportNamesAggSerializer, NavTreeSerializer


class MetricDataListView(ElasticListAPIView):
    """A view that handles requests for events from Logstash data."""

    serializer_class = MetricDataSerializer

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        model = MetricData


class ReportDataListView(ElasticListAPIView):
    """A view that handles requests for events from Logstash data."""

    serializer_class = ReportDataSerializer

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        model = ReportData


class ReportNamesAggView(SimpleAggView):
    """A view that handles requests for Report name aggregations.

    Currently it support a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}.

    """

    serializer_class = ReportNamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        model = ReportData

    def get_queryset(self):
        from elasticsearch_dsl.query import Q, Prefix

        queryset = super(ReportNamesAggView, self).get_queryset()
        return queryset.query(~Q(Prefix(name='os.service')))


class MetricNamesAggView(SimpleAggView):
    """A view that handles requests for Report name aggregations.

    Currently it support a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}.

    """

    serializer_class = MetricNamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:                   # pylint: disable=C0111,C1001,W0232
        model = MetricData


class MetricAggView(DateHistogramAggView):
    """A view that handles requests for Metric aggregations."""

    class Meta:
        """Meta"""
        model = MetricData


class NavTreeView(RetrieveAPIView, TopologyMixin):
    """Returns data for the old-style discovery tree rendering.

    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.

    A resource has the following structure:

    {
        "rsrcType": "cloud|region|zone|service|volume|etc.",
        "label": "string",
        "info": {"key": "value" [, "key": "value", ...]}, (optional)
        "lifeStage": "new|existing|absent", (optional)
        "enabled": True|False, (optional)
        "children": [rsrcType] (optional)
     }
     """

    serializer_class = NavTreeSerializer

    def get_object(self):
        return self.build_topology_tree()

    @staticmethod
    def get_regions():
        return []

    def _rescope_module_tree(self, tree, module_name):
        """
        Returns a tree that is ready to merge with the global tree.  Uses
        a rsrc_type of module, and a label of the module name.  If cloud
        rsrc_type is the root, throws it away.  Result is wrapped in a list.
        """
        if tree['rsrcType'] == 'cloud':
            result = []
            for child in tree['children']:
                child['region'] = child['label']
                child['rsrcType'] = 'module'
                child['label'] = module_name
                result.append(child)
            return result
        else:
            tree['region'] = tree['label']
            tree['rsrcType'] = 'module'
            tree['label'] = module_name
            return [tree]

    def build_topology_tree(self):
        """Return the topology tree that is displayed by this view."""

        from goldstone.apps.keystone.utils import DiscoverTree \
            as KeystoneDiscoverTree
        from goldstone.apps.glance.utils import DiscoverTree \
            as GlanceDiscoverTree
        from goldstone.cinder.utils import DiscoverTree as CinderDiscoverTree
        from goldstone.apps.nova.utils import DiscoverTree \
            as NovaDiscoverTree

        # Too many short names here. Disable C0103 for now, just here!
        # pylint: disable=C0103
        # Too many variables here!
        # pylint: disable=R0914

        keystone_topo = KeystoneDiscoverTree()
        glance_topo = GlanceDiscoverTree()
        cinder_topo = CinderDiscoverTree()
        nova_topo = NovaDiscoverTree()

        topo_list = [nova_topo, keystone_topo, glance_topo, cinder_topo]

        # Get regions from everyone and remove the dups.
        rll = [topo.get_regions() for topo in topo_list]
        rl = [reg for rl in rll for reg in rl]

        rl = [dict(t) for t in set([tuple(d.items()) for d in rl])]

        # we're going to bind everyone to the region tree. order is most likely
        # going to be important for some modules, so eventually we'll have
        # to be able to find a way to order or otherwise express module
        # dependencies.  It will also be helpful to build from the bottom up.

        # TODO devise mechanism for expressing module dependencies

        # bind cinder zones to global at region
        cl = [cinder_topo.build_topology_tree()]

        # convert top level items to cinder modules
        new_cl = []

        c = {}                # In case cl is empty. Plus, keeps pylint happy.
        for c in cl:
            if c['rsrcType'] != 'error':
                c['rsrcType'] = 'module'
                c['region'] = c['label']
                c['label'] = 'cinder'
                new_cl.append(c)

        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}

        rl = self._attach_resource(ad, new_cl, rl)

        nl = [nova_topo.build_topology_tree()]

        # convert top level items to nova module
        new_nl = []
        for n in nl:
            if c['rsrcType'] != 'error':
                n['rsrcType'] = 'module'
                n['region'] = n['label']
                n['label'] = 'nova'
                new_nl.append(n)

        rl = self._attach_resource(ad, new_nl, rl)

        # bind glance region to region, but rename glance
        gl = self._rescope_module_tree(
            glance_topo.build_topology_tree(), "glance")
        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}
        rl = self._attach_resource(ad, gl, rl)

        # bind keystone region to region, but rename keystone
        kl = self._rescope_module_tree(
            keystone_topo.build_topology_tree(), "keystone")
        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}
        rl = self._attach_resource(ad, kl, rl)

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        elif len(rl) == 1:
            return rl[0]
        else:
            return {"rsrcType": "error", "label": "No data found"}
