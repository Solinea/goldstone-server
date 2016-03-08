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
from rest_framework import filters
import django_filters
from rest_framework.decorators import detail_route
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND, HTTP_200_OK, \
    HTTP_400_BAD_REQUEST
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from goldstone.core.models import SavedSearch, Alert, PolyResource, \
    AlertDefinition, Producer, EmailProducer
from goldstone.core.serializers import SavedSearchSerializer, \
    AlertDefinitionSerializer, AlertSerializer, ProducerSerializer, \
    EmailProducerSerializer
from goldstone.drfes.filters import ElasticFilter
from goldstone.drfes.serializers import ElasticResponseSerializer

from goldstone.core import resource
from .serializers import PassthruSerializer
from .utils import parse, query_filter_map

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE
TOPOLOGICALLY_OWNS = settings.R_EDGE.TOPOLOGICALLY_OWNS

logger = logging.getLogger(__name__)


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


##################
# Saved Search   #
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

    permission_classes = (IsAuthenticated, )
    serializer_class = SavedSearchSerializer
    query_model = SavedSearch

    # Tell DRF that the lookup field is this string, and not "pk".
    lookup_field = "uuid"

    filter_fields = ('owner', 'name', 'protected', 'index_prefix', 'doc_type')
    search_fields = ('owner', 'name', 'protected', 'index_prefix', 'doc_type')
    ordering_fields = ('owner', 'name', 'protected', 'index_prefix',
                       'doc_type', 'last_start', 'last_end', 'created',
                       'updated', 'target_interval', 'description')

    def get_queryset(self):
        return self.query_model.objects.filter(hidden=False)

    @detail_route()
    def results(self, request, uuid=None):       # pylint: disable=W0613,R0201
        """Return a defined search's results."""
        from goldstone.drfes.pagination import ElasticPageNumberPagination
        from ast import literal_eval

        # Get the model for the requested uuid
        obj = self.query_model.objects.get(uuid=uuid)

        # To use as much Goldstone code as possible, we now override the class
        # to create a "drfes environment" for filtering, pagination, and
        # serialization. We then create an elasticsearch_dsl Search object from
        # the Elasticsearch query. DailyIndexDocType uses a "logstash-" index
        # prefix.
        self.pagination_class = ElasticPageNumberPagination
        self.serializer_class = ElasticResponseSerializer
        self.filter_backends = (SavedSearchFilter, )

        # Tell ElasticFilter to not add these query parameters to the
        # Elasticsearch query.
        self.reserved_params = ['interval']            # pylint: disable=W0201

        queryset = obj.search()
        queryset = self.filter_queryset(queryset)

        # if an interval parameter was provided, assume that it is meant to
        # be a change to the saved search data_histogram aggregation interval
        # if present.
        if 'interval' in self.request.query_params:
            try:
                queryset.aggs.aggs['per_interval'].interval = \
                    self.request.query_params['interval']
            except:
                return HTTP_400_BAD_REQUEST("interval parameter not supported "
                                            "for this request")

        # if there is a timestamp range parameter supplied, we'll construct
        # an extended_bounds.min parameter from the gt/gte parameter and add
        # it to the date_histogram aggregation. this will ensure that the
        # buckets go back to the start time.
        time_range_param = obj.timestamp_field + "__range"
        if time_range_param in request.query_params:
            json = literal_eval(request.query_params[time_range_param])
            if 'gt' in json:
                queryset.aggs.aggs['per_interval'].extended_bounds = {
                    'min': json['gt']
                }
            elif 'gte' in json:
                queryset.aggs.aggs['per_interval'].extended_bounds = {
                    'min': json['gte']
                }

        # Perform the search and paginate the response.
        page = self.paginate_queryset(queryset)

        serializer = self.get_serializer(page)
        return self.get_paginated_response(serializer.data)


class AlertDefinitionViewSet(ReadOnlyModelViewSet):
    """Provide the /core/alert_definition/ endpoints."""

    permission_classes = (IsAuthenticated, )
    serializer_class = AlertDefinitionSerializer
    query_model = AlertDefinition

    # Tell DRF that the lookup field is this string, and not "pk".
    lookup_field = "uuid"

    search_fields = ('name', 'description', 'short_template', 'long_template')
    ordering_fields = ('name', 'created', 'updated', 'short_message',
                       'long_message', 'search', 'enabled')

    def get_queryset(self):
        return AlertDefinition.objects.all()


class CreatedFilter(filters.FilterSet):
    created_after = django_filters.NumberFilter(name="created_ts",
                                                lookup_type='gt')

    class Meta:
        model = Alert
        fields = ['created_ts']


class AlertViewSet(ReadOnlyModelViewSet):
    """Provide the /core/alert/ endpoints."""

    permission_classes = (IsAuthenticated, )
    serializer_class = AlertSerializer
    query_model = Alert
    filter_class = CreatedFilter

    # Tell DRF that the lookup field is this string, and not "pk".
    lookup_field = "uuid"

    search_fields = ('short_message', 'long_message', 'alert_def',
                     'created_ts')
    ordering_fields = ('created', 'updated', 'short_message', 'long_message',
                       'alert_def')

    def get_queryset(self):
        return Alert.objects.all()


class ProducerViewSet(ReadOnlyModelViewSet):
    """Producer the /core/producer/ endpoints."""

    permission_classes = (IsAuthenticated,)
    serializer_class = ProducerSerializer
    ordering_fields = ('alert_def',)

    def get_queryset(self):
        return Producer.objects.all()
        #  base_objects = Producer.objects.all()
        # return Producer.objects.get_real_instances(base_objects)


class EmailProducerViewSet(ModelViewSet):
    """Producer the /core/email_producer/ endpoints."""

    permission_classes = (IsAuthenticated,)
    serializer_class = EmailProducerSerializer
    search_fields = ('sender', 'receiver', 'alert_def')
    ordering_fields = ('sender', 'receiver', 'alert_def')

    def get_queryset(self):
        return EmailProducer.objects.all()
