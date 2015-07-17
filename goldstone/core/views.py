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
from django.conf import settings
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND, HTTP_200_OK

from goldstone.drfes.views import ElasticListAPIView, SimpleAggView, \
    DateHistogramAggView
from goldstone.utils import TopologyMixin

from goldstone.core.resource import types
from goldstone.core import resource
from .models import MetricData, ReportData, PolyResource, EventData, \
    ApiPerfData
from .serializers import MetricDataSerializer, ReportDataSerializer, \
    MetricNamesAggSerializer, ReportNamesAggSerializer, PassthruSerializer, \
    MetricAggSerializer, EventSerializer, ApiPerfSerializer, \
    EventSummarizeSerializer, ApiPerfSummarizeSerializer
from .utils import parse, query_filter_map

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE


# Our API documentation extracts this docstring, hence the use of markup.
class ReportDataListView(ElasticListAPIView):
    """Return events from Logstash data.

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: name__prefix
             description: The desired service name prefix. E.g.,
                          nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
             paramType: query

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

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: host
             description: A host.
             paramType: query

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

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: name__prefix
             description: The desired service name prefix. E.g.,
                          nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
             paramType: query

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

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: host
             description: A host.
             paramType: query

    """

    serializer_class = MetricNamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:                   # pylint: disable=C0111,C1001,W0232
        model = MetricData


# Our API documentation extracts this docstring, hence the use of markup.
class MetricAggView(DateHistogramAggView):
    """Return metric aggregations.

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: host
             description: A host.
             paramType: query

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

    A resource has this structure:\n

    {"rsrcType": "cloud|region|zone|service|volume|etc.",\n
     "label": "string",\n
     "info": {"key": "value" [, "key": "value", ...]}, (optional)\n
     "lifeStage": "new|existing|absent", (optional)\n
     "enabled": True|False, (optional)\n
     "children": [rsrcType] (optional)
    }

     """

    serializer_class = PassthruSerializer

    def get_object(self):
        return self.build_topology_tree()

    @staticmethod
    def get_regions():
        return []

    @staticmethod
    def _rescope_module_tree(tree, module_name):
        """Return a tree that is ready to merge with the global tree.

        This uses an rsrc_type of module, and a label of the module name.  If
        cloud rsrc_type is the root, throws it away.  Result is wrapped in a
        list.

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
    edges.

    This is a work-in-progress, and should not yet be used by client code.

    """

    serializer_class = PassthruSerializer

    def get(self, request, *args, **kwargs):
        """The response payload is:

        {"nodes": [<b>node</b>, <b>node</b>, ...],
         "edges": [<b>edge</b>, <b>edge</b>, ...]}\n\n

        <b>node</b> is {"display_attributes": {"integration_name": str,
                                               "name": str},
                        "unique_id": str,
                        "present": bool (True if >= 1 instance exists)
                        }\n\n

        <b>edge</b> is {"from": str, "to": str, "type": str}

        """

        # Gather the nodes.
        nodes = [{"display_attributes": entry.display_attributes(),
                  "unique_id": entry.unique_class_id(),
                  "present": bool(resource.instances.nodes_of_type(entry))}
                 for entry in types.graph]

        # Gather the edges.
        edges = [{"from": str(entry[0]),
                  "to": str(entry[1]),
                  "type": entry[2][TYPE]}
                 for entry in types.graph.edges_iter(data=True)]

        return Response({"nodes": nodes, "edges": edges})


# Our API documentation extracts this docstring, hence the use of markup.
class ResourceTypeRetrieve(RetrieveAPIView):
    """Return the resource graph instances of a specific resource type.

    This is a work-in-progress, and should not yet be used by client code.

    """

    serializer_class = PassthruSerializer

    def get(self, request, unique_id, *args, **kwargs):
        """Return the nodes having a particular resource type.

        The response payload is a list of resource graph nodes:

        {"nodes": [<b>node</b>, <b>node</b>, ...]}\n\n

        <b>node</b> is {"uuid": str, "native_id": str, "name": str,
                        "attributes": dict}

        <b>uuid</b> is the UUID we gave this node within Goldstone.\n\n

        <b>native_id</b> is the OpenStack id of this node. It may be empty.\n\n

        <b>native_name</b> is the node's cloud name.\n\n

        <b>attributes</b> is the node's information extracted from the
        OpenStack cloud.

        ---

        parameters:
            - name: unique_id
              description: A resource type's unique id.
              paramType: query

        """

        # Get the type that matches the supplied id.
        target_type = types.get_type(unique_id)

        result = []

        if target_type is not None:
            # The desired resource type was found. Each instance's information
            # comes from its resource graph node, and its PolyResource table
            # row.
            for node in resource.instances.nodes_of_type(target_type):
                row = PolyResource.objects.get(uuid=node.uuid)
                result.append({"uuid": node.uuid,
                               "native_id": row.native_id,
                               "native_name": row.native_name,
                               "attributes": node.attributes})

        # The response's status depends on whether we found any instances.
        return Response({"nodes": result},
                        status=HTTP_200_OK if result else HTTP_404_NOT_FOUND)


# Our API documentation extracts this docstring, hence the use of markup.
class ResourcesList(ListAPIView):
    """Return the Resource graph, as a collection of nodes and directed
    edges.

    This is a work-in-progress, and should not yet be used by client code.\n\n

    """

    serializer_class = PassthruSerializer

    def get(self, request, *args, **kwargs):
        """Return the resource graph's nodes and edges.

        The response payload is:

        {"nodes": [<b>node</b>, <b>node</b>, ...],
         "edges": [<b>edge</b>, <b>edge</b>, ...]}\n\n

        <b>node</b> is {"resourcetype": {"unique_id": str, "name": str},
                        "uuid": str,
                        "native_id": str,
                        "native_name": str,
                        }\n\n

        <b>edge</b> is {"from": str, "to": str, "type": str}\n\n

        Filtering may be requested through a query string. In "?key=value",
        value may start with a "^" to filter against a key's beginning,
        otherwise it's used anywhere within the key. " OR " is a logical
        or. All names and ids are case-sensitive.\n\n

        For example, a native_name argument of
        <b>%5EA%20score%20OR%20B%20score&integration=nova%20OR%20keystone</b>
        results in a native_name filter of <b>^A score|^B score</b> and
        an integration filter of <b>nova|keystone</b>.\n\n

        Edges are included in the response if and only if they are from or to
        a node in the response.

        ---

        parameters:
            - name: native_name
              description: A cloud name regex to filter against.
              paramType: query
            - name: native_id
              description: A cloud id regex to filter against.
              paramType: query
            - name: integration_name
              description: An integration name regex to filter against.
              paramType: query

        """

        # Get the filtering parameters, and gather their mapping information
        # now.
        parsed_query_string = parse(request.META["QUERY_STRING"])
        filters = [(query_filter_map(k), v)
                   for k, v in parsed_query_string.items()]

        nodes = []
        node_uuids = []

        # For every node in the resource graph...
        for node in resource.instances.graph.nodes():
            # Get this node's matching table row.
            row = PolyResource.objects.get(uuid=node.uuid)

            # Apply the user's filters to determine if this node should be
            # included in the response.
            proceed = True
            for (filterfn, db_or_node), regex in filters:
                if db_or_node == "db":
                    # This filter is against infomration in the table row.
                    proceed = proceed and filterfn(row, regex)
                else:
                    # This filter is against infomration in the graph node.
                    proceed = proceed and filterfn(node, regex)

            if proceed:
                # Include this node!
                nodes.append({"resourcetype":
                              {"unique_id":
                               node.resourcetype.unique_class_id(),
                               "name":
                               node.resourcetype.display_attributes()["name"]},
                              "uuid": node.uuid,
                              "native_id": row.native_id,
                              "native_name": row.native_name
                              })
                node_uuids.append(node.uuid)

        # Gather the edges that are to or from the gathered nodes.
        edges = \
            [{"from": str(entry[0]),
              "to": str(entry[1]),
              "type": entry[2][TYPE]}
             for entry in resource.instances.graph.edges_iter(data=True)
             if entry[0].uuid in node_uuids or entry[1].uuid in node_uuids]

        return Response({"nodes": nodes, "edges": edges})


# Our API documentation extracts this docstring, hence the use of markup.
class ResourcesRetrieve(RetrieveAPIView):
    """Return a specific resource graph node's detail.

    This is a work-in-progress, and should not yet be used by client code.

    """

    serializer_class = PassthruSerializer

    def get(self, request, uuid, *args, **kwargs):
        """The response payload is:

        {"native_id": str, "native_name": str, "attributes": dict}\n\n

        <b>native_id</b> is the OpenStack id of this node. It may be empty.\n\n

        <b>native_name</b> is the cloud name of this node.\n\n

        <b>attributes</b> is the node's information extracted from the
        OpenStack cloud.

        ---

        parameters:
            - name: uuid
              description: A resource type's unique id.
              paramType: query

        """
        from django.core.exceptions import ObjectDoesNotExist

        # Get this resource's graph node and table row.
        node = resource.instances.get_uuid(uuid)

        try:
            row = PolyResource.objects.get(uuid=uuid)
        except ObjectDoesNotExist:
            row = None

        if node and row:
            return Response({"native_id": row.native_id,
                             "native_name": row.native_name,
                             "attributes": node.attributes})

        else:
            return Response({}, status=HTTP_404_NOT_FOUND)


#########################
# API Performance views #
#########################

# Our API documentation extracts this docstring, hence the use of markup.
class ApiPerfSummarizeView(DateHistogramAggView):
    """Return an aggregation summary of API performance.

    ---

    GET:
        parameters:
           - name: component
             description: The OpenStack service to query.
             enum: [nova, neutron, keystone, glance, cinder]
             paramType: query
           - name: interval
             description: The desired time interval, as n(s|m|h|w). E.g., 1d
                          or 3m.
             required: true
             paramType: query
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query

    """

    serializer_class = ApiPerfSummarizeSerializer
    reserved_params = ["interval", "component", "timestamp__range"]

    RANGE_AGG_NAME = 'response_status'
    STATS_AGG_NAME = 'stats'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        model = ApiPerfData

    def get(self, request):
        """Return a response to a GET request."""

        search = self._get_search(request)
        search.aggs[self.AGG_NAME]. \
            metric(self.STATS_AGG_NAME, self.Meta.model.stats_agg()). \
            bucket(self.RANGE_AGG_NAME, self.Meta.model.range_agg())

        serializer = self.serializer_class(search.execute().aggregations)

        return Response(serializer.data)


# Our API documentation extracts this docstring, hence the use of markup.
class ApiPerfSearchView(ElasticListAPIView):
    """Return API performance records from Logstash data.

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: _id__prefix
             description: The string each id must start with.
             paramType: query
           - name: _id__match
             description: The string each id must exactly match.
             paramType: query
           - name: _type__prefix
             description: The string each entry's type must start with.
             paramType: query
           - name: _type__match
             description: The string each entry's type must exactly match.
             paramType: query
           - name: page
             description: The desired result page number
             type: integer
             paramType: query
           - name: page_size
             description: The number of results on each page
             type: integer
             paramType: query

    """

    serializer_class = ApiPerfSerializer

    class Meta:     # pylint: disable=C1001,W0232,C0111
        model = ApiPerfData


###############
# Event views #
###############

# Our API documentation extracts this docstring, hence the use of markup.
class EventSummarizeView(DateHistogramAggView):
    """Return an aggregation summary of events from Logstash data.

    ---

    GET:
        parameters:
           - name: interval
             description: The desired time interval, as n(s|m|h|w). E.g., 1d
                          or 3m.
             required: true
             paramType: query
           - name: per_type
             description: Include per-type information in the results.
             type: boolean
             defaultValue: true
             paramType: query
           - name: timestamp__range
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query

    """

    AGG_FIELD = 'timestamp'
    AGG_NAME = 'per_interval'
    serializer_class = EventSummarizeSerializer
    reserved_params = ['interval', 'per_type']

    class Meta:             # pylint: disable=C1001,W0232,C0111
        model = EventData

    def get(self, request):
        """Return a response to a GET request."""
        import ast

        # Start with a basic histogram search, having a top-level aggregation
        # for time intervals.
        search = self._get_search(request)

        # See if the request wants per-type information.
        per_type = ast.literal_eval(
            self.request.query_params.get('per_type', 'True').capitalize())

        if per_type:
            # Add a top-level aggregation for types.
            search.aggs.bucket('per_type',
                               "terms",
                               field="_type",
                               min_doc_count=0)

            # Add a second-level aggregation for types, under time intervals.
            search.aggs['per_interval'].bucket('per_type',
                                               'terms',
                                               field='_type',
                                               min_doc_count=0)

        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)


# Our API documentation extracts this docstring, hence the use of markup.
class EventSearchView(ElasticListAPIView):
    """Return events from Logstash data.

    ---

    GET:
        parameters:
           - name: timestamp__range
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: _id__prefix
             description: The string each id must start with.
             paramType: query
           - name: _id__match
             description: The string each id must exactly match.
             paramType: query
           - name: _type__prefix
             description: The string each entry's type must start with.
             paramType: query
           - name: _type__match
             description: The string each entry's type must exactly match.
             paramType: query
           - name: page
             description: The desired result page number
             type: integer
             paramType: query
           - name: page_size
             description: The number of results on each page
             type: integer
             paramType: query

    """

    serializer_class = EventSerializer

    class Meta:     # pylint: disable=C1001,W0232,C0111
        model = EventData
