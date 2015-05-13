"""Core views."""
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
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND, HTTP_200_OK

from goldstone.drfes.views import ElasticListAPIView, SimpleAggView, \
    DateHistogramAggView
from goldstone.utils import TopologyMixin

from .models import MetricData, ReportData, PolyResource
from .resources import resources, resource_types
from .serializers import MetricDataSerializer, ReportDataSerializer, \
    MetricNamesAggSerializer, ReportNamesAggSerializer, PassthruSerializer, \
    MetricAggSerializer


# Our API documentation extracts this docstring, hence the use of markup.
class ReportDataListView(ElasticListAPIView):
    """Return events from Logstash data.

    \n\nQuery string parameters:\n

    <b>name__prefix</b>: The desired service name prefix. E.g.,
                         nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = ReportDataSerializer

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        model = ReportData


# Our API documentation extracts this docstring, hence the use of markup.
class ReportNamesAggView(SimpleAggView):
    """Return report name aggregations.

    This currently supports a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}.

    \n\nQuery string parameters:\n

    <b>host</b>: A host.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

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


# Our API documentation extracts this docstring, hence the use of markup.
class MetricDataListView(ElasticListAPIView):
    """Return events from Logstash data.

    \n\nQuery string parameters:\n

    <b>name__prefix</b>: The desired service name prefix. E.g.,
                         nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = MetricDataSerializer

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        model = MetricData


# Our API documentation extracts this docstring, hence the use of markup.
class MetricNamesAggView(SimpleAggView):
    """Return report name aggregations.

    This Currently supports a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}.

    \n\nQuery string parameters:\n

    <b>host</b>: A host.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = MetricNamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:                   # pylint: disable=C0111,C1001,W0232
        model = MetricData


# Our API documentation extracts this docstring, hence the use of markup.
class MetricAggView(DateHistogramAggView):
    """Return metric aggregations.

    \n\nQuery string parameters:\n

    <b>host</b>: A host.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = MetricAggSerializer
    reserved_params = ['interval']
    STATS_AGG_NAME = 'stats'
    UNIT_AGG_NAME = 'units'

    class Meta:       # pylint: disable=C1001,W0232
        """Meta."""
        model = MetricData

    def get(self, request):
        """Handle get request. Override default to add nested aggregations."""
        search = self._get_search(request)
        search.aggs.bucket(self.UNIT_AGG_NAME, self.Meta.model.units_agg())
        search.aggs[self.AGG_NAME]. \
            bucket(self.STATS_AGG_NAME, self.Meta.model.stats_agg())
        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)


# Our API documentation extracts this docstring, hence the use of markup.
class NavTreeView(RetrieveAPIView, TopologyMixin):
    """Return data for the old-style discovery tree rendering.\n\n

    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.\n\n

    A resource has the following structure:\n

    {"rsrcType": "cloud|region|zone|service|volume|etc.",\n
     "label": "string",\n
     "info": {"key": "value" [, "key": "value", ...]}, (optional)\n
     "lifeStage": "new|existing|absent", (optional)\n
     "enabled": True|False, (optional)\n
     "children": [rsrcType] (optional)\n
    }

     """

    serializer_class = PassthruSerializer

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
        from goldstone.keystone.utils import DiscoverTree \
            as KeystoneDiscoverTree
        from goldstone.glance.utils import DiscoverTree as GlanceDiscoverTree
        from goldstone.cinder.utils import DiscoverTree as CinderDiscoverTree
        from goldstone.nova.utils import DiscoverTree as NovaDiscoverTree

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


# Our API documentation extracts this docstring, hence the use of markup.
class ResourceTypeList(ListAPIView):
    """Return the Resource Type graph, as a collection of nodes and directed
    edges."""

    serializer_class = PassthruSerializer

    def get(self, request, *args, **kwargs):
        """The response payload is:

        {"nodes": [<b>node</b>, <b>node</b>, ...],
         "edges": [<b>edge</b>, <b>edge</b>, ...]}\n\n

        <b>node</b> is {"display_attributes": {"service_name": str,
                                               "name": str},
                        "unique_id": str,
                        "present": bool (True if >= 1 instance exists)
                        }\n\n

        <b>edge</b> is {"from": str, "to": str, "type": str}

        """
        from django.conf import settings

        TYPE = settings.R_ATTRIBUTE.TYPE

        # Gather the nodes.
        nodes = [{"display_attributes": entry.display_attributes(),
                  "unique_id": entry.unique_id(),
                  "present": bool(resources.nodes_of_type(entry))}
                 for entry in resource_types.graph]

        # Gather the edges.
        edges = [{"from": str(entry[0]),
                  "to": str(entry[1]),
                  "type": entry[2][TYPE]}
                 for entry in resource_types.graph.edges_iter(data=True)]

        return Response({"nodes": nodes, "edges": edges})


# Our API documentation extracts this docstring, hence the use of markup.
class ResourceTypeRetrieve(RetrieveAPIView):
    """Return the resource graph instances of a specific resource type."""

    serializer_class = PassthruSerializer

    def get(self, request, unique_id, *args, **kwargs):
        """<b>unique_id</b> is a resource type's unique id.\n\n

        The response payload is a list of resource graph nodes:

        {"nodes": [<b>node</b>, <b>node</b>, ...]}\n\n

        <b>node</b> is {"uuid": str, "cloud_id": str, "name": str,
                        "attributes": dict}

        <b>uuid</b> is the UUID we gave this node within Goldstone.\n\n

        <b>cloud_id</b> is the OpenStack id of this node. It may be empty.\n\n

        <b>name</b> is the node's cloud name.\n\n

        <b>attributes</b> is the node's information extracted from the
        OpenStack cloud.

        """

        # Get the type that matches the supplied id.
        target_type = resource_types.get_type(unique_id)

        result = []

        if target_type is not None:
            # The desired resource type was found. Each instance's information
            # comes from its resource graph node, and its PolyResource table
            # row.
            for node in resources.nodes_of_type(target_type):
                row = PolyResource.objects.get(uuid=node.uuid)
                result.append({"uuid": node.uuid,
                               "cloud_id": row.cloud_id,
                               "name": row.name,
                               "attributes": node.attributes})

        # The response's status depends on whether we found any instances.
        return Response({"nodes": result},
                        status=HTTP_200_OK if result else HTTP_404_NOT_FOUND)


# Our API documentation extracts this docstring, hence the use of markup.
class ResourcesList(ListAPIView):
    """Return the Resource graph, as a collection of nodes and directed
    edges."""

    serializer_class = PassthruSerializer

    def get(self, request, *args, **kwargs):
        """The response payload is:

        {"nodes": [<b>node</b>, <b>node</b>, ...],
         "edges": [<b>edge</b>, <b>edge</b>, ...]}\n\n

        <b>node</b> is {"resourcetype": {"unique_id": str, "name": str},
                        "uuid": str,
                        "cloud_id": str,
                        "name": str,
                        }\n\n

        <b>edge</b> is {"from": str, "to": str, "type": str}

        """
        from django.conf import settings

        TYPE = settings.R_ATTRIBUTE.TYPE

        # Get filtering query parameters, if specified
        # TODO: Define and fold in query filtering.
        user_filter = request.query_params.get("user")
        project_filter = request.query_params.get("project")

        # Gather the nodes.
        nodes = []

        # For every node in the resource graph...
        for node in resources.graph.nodes():
            # Gather the information we need
            rt_attributes = node.resourcetype.display_attributes()
            rt_unique_id = node.resourcetype.unique_id()
            rt_row = PolyResource.objects.get(uuid=node.uuid)

            # Append this node to the nodes list.
            nodes.append({"resourcetype":
                          {"unique_id": rt_unique_id,
                           "name": rt_attributes["name"]},
                          "uuid": node.uuid,
                          "cloud_id": rt_row.cloud_id,
                          "name": rt_row.name
                          })

        # Gather the edges.
        edges = [{"from": str(entry[0]),
                  "to": str(entry[1]),
                  "type": entry[2][TYPE]}
                 for entry in resources.graph.edges_iter(data=True)]

        return Response({"nodes": nodes, "edges": edges})


# Our API documentation extracts this docstring, hence the use of markup.
class ResourcesRetrieve(RetrieveAPIView):
    """Return a specific resource graph node's detail."""

    serializer_class = PassthruSerializer

    def get(self, request, uuid, *args, **kwargs):
        """<b>uuid</b> is a resource's UUID.\n\n

        The response payload is:

        {"cloud_id": str, "name": str, "attributes": dict}

        <b>cloud_id</b> is the OpenStack id of this node. It may be empty.\n\n

        <b>name</b> is the cloud name of this node.\n\n

        <b>attributes</b> is the node's information extracted from the
        OpenStack cloud.

        """
        from django.core.exceptions import ObjectDoesNotExist

        # Get filtering query parameters, if specified
        # TODO: Fold in user and project filtering.
        user_filter = request.query_params.get("user")
        project_filter = request.query_params.get("project")

        # Get this resource's graph node and table row.
        node = resources.get_uuid(uuid)

        try:
            row = PolyResource.objects.get(uuid=uuid)
        except ObjectDoesNotExist:
            row = None

        if node and row:
            return Response({"cloud_id": row.cloud_id,
                             "name": row.name,
                             "attributes": node.attributes})

        else:
            return Response({}, status=HTTP_404_NOT_FOUND)
