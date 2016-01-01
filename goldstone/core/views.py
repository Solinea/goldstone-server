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
import logging

from django.conf import settings
from rest_framework.decorators import detail_route
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND, HTTP_200_OK
from rest_framework.viewsets import ModelViewSet
from goldstone.compliance.pagination import Pagination
from goldstone.core.models import SavedSearch
from goldstone.core.serializers import SavedSearchSerializer
from goldstone.drfes.filters import ElasticFilter

from goldstone.drfes.views import ElasticListAPIView, SimpleAggView, \
    DateHistogramAggView

from goldstone.core import resource
from .models import MetricData, ReportData, PolyResource, EventData, \
    ApiPerfData, SavedSearch
from .serializers import MetricDataSerializer, ReportDataSerializer, \
    NamesAggSerializer, PassthruSerializer, MetricAggSerializer, \
    EventSerializer, ApiPerfSerializer, EventSummarizeSerializer, \
    ApiPerfSummarizeSerializer
from .utils import parse, query_filter_map

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE
TOPOLOGICALLY_OWNS = settings.R_EDGE.TOPOLOGICALLY_OWNS

logger = logging.getLogger(__name__)


# Our API documentation extracts this docstring.
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


# Our API documentation extracts this docstring.
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

    serializer_class = NamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        model = ReportData

    def get_queryset(self):
        from elasticsearch_dsl.query import Q, Prefix

        queryset = super(ReportNamesAggView, self).get_queryset()
        return queryset.query(~Q(Prefix(name='os.service')))


# Our API documentation extracts this docstring.
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


# Our API documentation extracts this docstring.
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

    serializer_class = NamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:                   # pylint: disable=C0111,C1001,W0232
        model = MetricData


# Our API documentation extracts this docstring.
class MetricAggView(DateHistogramAggView):
    """Return metric aggregations.

    ---

    GET:
        parameters:
           - name: name
             description: The name of the metric you want returned
             paramType: query
             required: true
           - name: interval
             description: The desired time interval, as n(s|m|h|w). E.g., 1d
                          or 3m
             required: true
             paramType: query
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: node
             description: If supplied, return the metrics for a single node.
                          Otherwise, return an aggregation
             paramType: query

    """

    serializer_class = MetricAggSerializer

    STATS_AGG_NAME = 'stats'
    UNIT_AGG_NAME = 'units'

    class Meta:       # pylint: disable=C1001,W0232
        """Meta."""
        model = MetricData

    def get(self, request):
        """Handle get request. Override default to add nested aggregations."""

        search = self._get_search(request)

        search.aggs.bucket(self.UNIT_AGG_NAME, self.Meta.model.units_agg())

        search.aggs[self.AGG_NAME].bucket(self.STATS_AGG_NAME,
                                          self.Meta.model.stats_agg())

        serializer = self.serializer_class(search.execute().aggregations)

        return Response(serializer.data)


# Our API documentation extracts this docstring.
class TopologyView(RetrieveAPIView):
    """Return the cloud's topology.

    In the present codebase, there is only one OpenStack cloud.

    """

    serializer_class = PassthruSerializer

    def _tree(self, node):
        """Return the topology of the cloud starting at a node.

        :param node: A resource graph node
        :type node: GraphNode
        :return: The topology of this down "downward," including all of its
                 children
        :rtype: dict

        """
        from networkx import has_path
        from goldstone.core.models import Region

        # Get all the topological children by looking for a TOPOLOGICALLY_OWNS
        # edge between this node and its children.
        children = \
            [self._tree(x)
             for x in resource.instances.graph.successors(node)
             if any(y[TYPE] == TOPOLOGICALLY_OWNS
                    for y in
                    resource.instances.graph.get_edge_data(node, x)
                    .values())]

        # Now we concoct the return value. If no children, return None rather
        # than an empty list.
        if not children:
            children = None

        # Create the resource list URL formatting dictionary.
        #
        # Find this node's region, and its predecessor's Integration name.
        regionnodes = resource.instances.nodes_of_type(Region)
        for region in regionnodes:
            if has_path(resource.instances.graph, region, node):
                region = region.attributes["id"]
                break
        else:
            region = None

        # Find a predecessor's Integration name. Any one will do.
        predecessor_nodes = resource.instances.graph.predecessors(node)
        parent_integration = \
            predecessor_nodes[0].resourcetype.integration().lower() \
            if predecessor_nodes else None

        url_values = {"region": region,
                      "parent_integration": parent_integration,
                      "zone": node.attributes.get("zone"),
                      }

        result = {"uuid": node.uuid,
                  "integration": node.resourcetype.integration(),
                  "resourcetype":
                  node.resourcetype.objects.get(uuid=node.uuid).resourcetype(),
                  "label":
                  node.resourcetype.objects.get(uuid=node.uuid).label(),
                  "resource_list_url":
                  node.resourcetype.resource_list_url().format(**url_values),
                  "children": children}

        # The interface value will be "private", "public", or "admin", if it
        # exists.
        if "interface" in node.attributes:
            result["interface"] = node.attributes["interface"]

        # The URL will help further identify this node, if it exists.
        if "url" in node.attributes:
            result["url"] = node.attributes["url"]

        return result

    def get_object(self):
        """Return the cloud's toplogy.

        :rtype: dict

        """
        from .models import Region

        # We do this in multiple steps in order to be more robust in the face
        # of bad cloud data.
        regionnodes = set([resource.instances.get_uuid(x.uuid)
                           for x in Region.objects.all()])
        if not regionnodes:
            return {"label": "No data found"}
        elif len(regionnodes) > 1:
            # We don't handle multiple regions correctly yet, so log this and
            # trim the list.
            logger.error("More than one region found: %s", regionnodes)
            regionnodes = list(regionnodes)[:1]

        # Find the children of each region.
        children = [self._tree(x) for x in regionnodes if x]

        # Return a "cloud" response. The children are the regions cloud's
        # regions.
        return {"label": "cloud", "uuid": None, "children": children}


# Our API documentation extracts this docstring.
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

        <b>node</b> is {"integration": str,
                        "name": str,
                        "unique_id": str,
                        "present": bool (True if >= 1 instance exists)
                        }\n\n

        <b>edge</b> is {"from": str, "to": str, "type": str}

        """

        # Gather the nodes.
        nodes = [{"integration": entry.integration(),
                  "resourcetype": entry().resourcetype(),
                  "label": entry().label(),
                  "unique_id": entry.unique_class_id(),
                  "present": bool(resource.instances.nodes_of_type(entry))}
                 for entry in resource.types.graph.nodes()]

        # Gather the edges.
        edges = [{"from": str(entry[0]),
                  "to": str(entry[1]),
                  "type": entry[2][TYPE]}
                 for entry in resource.types.graph.edges_iter(data=True)]

        return Response({"nodes": nodes, "edges": edges})


# Our API documentation extracts this docstring.
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
        target_type = resource.types.get_type(unique_id)

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


# Our API documentation extracts this docstring.
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
                nodes.append(
                    {"resourcetype":
                     {"unique_id":
                      node.resourcetype.unique_class_id(),
                      "label": node.resourcetype().label(),
                      "resourcetype": node.resourcetype().resourcetype()},
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


# Our API documentation extracts this docstring.
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

# Our API documentation extracts this docstring.
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

    # Do not add these query parameters to the Elasticsearch query.
    reserved_params = ["interval", "timestamp__range"]

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


# Our API documentation extracts this docstring.
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

# Our API documentation extracts this docstring.
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

    # Do not add these query parameters to the Elasticsearch query.
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


# Our API documentation extracts this docstring.
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

##################
# Defined Search #
##################


class SavedSearchFilter(ElasticFilter):

    @staticmethod
    def _add_query(param, value, view, queryset, operation='match'):
        """Return a query, preferring the raw field if available.

        :param param: the field name in ES
        :param value: the field value
        :param view: the calling view
        :param queryset: the base queryset
        :param operation: the query operation
        :return: the update Search object
        :rtype Search

        """
        return queryset.query(operation, **{param: value})


# N.B. Goldstone's swagger-ui API documentation uses the docstrings to populate
# the application's API page.
class SavedSearchViewSet(ModelViewSet):
    """Provide the /defined_search/ endpoints."""

    pagination_class = Pagination
    permission_classes = (IsAuthenticated, )
    serializer_class = SavedSearchSerializer

    # Tell DRF that the lookup field is this string, and not "pk".
    lookup_field = "uuid"

    filter_fields = ('owner', 'name', 'protected', 'index_prefix', 'doc_type')
    ordering_fields = ('owner', 'name', 'protected', 'index_prefix',
                       'doc_type', 'last_start', 'last_end', 'created',
                       'updated', 'target_interval')

    class Meta:                     # pylint: disable=W0232,C1001
        model = SavedSearch

    def get_queryset(self):
        return SavedSearch.objects.all()

    @detail_route()
    def results(self, request, uuid=None):       # pylint: disable=W0613,R0201
        """Return a defined search's results."""
        from elasticsearch import Elasticsearch
        from elasticsearch_dsl import Q
        from goldstone.drfes.filters import ElasticFilter
        from goldstone.drfes.pagination import ElasticPageNumberPagination
        from goldstone.drfes.serializers import ReadOnlyElasticSerializer

        # Get the model for the requested uuid
        # query = ast.literal_eval(SavedSearch.objects.get(uuid=uuid).query)
        obj = SavedSearch.objects.get(uuid=uuid)

        # To use as much Goldstone code as possible, we now override the class
        # to create a "drfes environment" for filtering, pagination, and
        # serialization. We then create an elasticsearch_dsl Search object from
        # the Elasticsearch query. DailyIndexDocType uses a "logstash-" index
        # prefix.
        self.pagination_class = ElasticPageNumberPagination
        self.serializer_class = ReadOnlyElasticSerializer
        self.filter_backends = (SavedSearchFilter, )

        # Tell ElasticFilter to not add these query parameters to the
        # Elasticsearch query.
        self.reserved_params = []                    # pylint: disable=W0201

        queryset = obj.search()
        queryset = self.filter_queryset(queryset)

        # Perform the search and paginate the response.
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
