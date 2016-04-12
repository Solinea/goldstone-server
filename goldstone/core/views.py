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
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.status import HTTP_400_BAD_REQUEST
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from goldstone.core.models import SavedSearch, Alert, AlertDefinition, \
    Producer, EmailProducer, MonitoredService
from goldstone.core.serializers import SavedSearchSerializer, \
    AlertDefinitionSerializer, AlertSerializer, ProducerSerializer, \
    EmailProducerSerializer, MonitoredServiceSerializer
from goldstone.drfes.filters import ElasticFilter
from goldstone.drfes.serializers import ElasticResponseSerializer




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
        self.reserved_params = ['interval',  # pylint: disable=W0201
                                'ordering']

        queryset = obj.search()
        queryset = self.filter_queryset(queryset)

        # Default to descending sort on the timestamp_field if no ordering
        # param is provided in the query.
        if obj.timestamp_field is not None \
                and 'ordering' not in self.request.query_params:
            queryset = queryset.sort("-%s" % obj.timestamp_field)

        # otherwise use any provided ordering parameter (only supports
        # fieldname or -fieldname forms at the moment).  We'll try to look up
        # a raw field if it has one.  If it doesn't, and it's a string, this
        # will probably fail.  It may also fail for events since they don't
        # have a common doc_type.
        elif 'ordering' in self.request.query_params:
            ordering_value = self.request.query_params['ordering']
            if ordering_value.startswith("-"):
                has_raw = obj.field_has_raw(ordering_value[1:])
            else:
                has_raw = obj.field_has_raw(ordering_value)

            if has_raw:
                ordering_value += ".raw"

            queryset = queryset.sort(ordering_value)

        # if an interval parameter was provided, assume that it is meant to
        # be a change to the saved search date_histogram aggregation interval
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

    def update(self, request, *args, **kwargs):
        """override PATCH methods to not allow updates to
        protected searches"""
        instance = self.get_object()
        if getattr(instance, 'protected', False):
            raise MethodNotAllowed(request.method,
                                   "Can not edit protected Saved Searches")
        return super(SavedSearchViewSet, self)\
            .update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """override DELETE methods to not allow deletes of
        protected searches"""
        instance = self.get_object()
        if getattr(instance, 'protected', False):
            raise MethodNotAllowed(request.method,
                                   "Can not delete protected Saved Searches")
        return super(SavedSearchViewSet, self)\
            .destroy(request, *args, **kwargs)


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


class MonitoredServiceViewSet(ModelViewSet):
    """Provide the /defined_search/ endpoints."""

    permission_classes = (IsAuthenticated,)
    serializer_class = MonitoredServiceSerializer
    query_model = MonitoredService

    # Tell DRF that the lookup field is this string, and not "pk".
    lookup_field = "uuid"

    filter_fields = ('name', 'host', 'state')
    search_fields = ('name', 'host', 'state')
    ordering_fields = ('name', 'host', 'state', 'created', 'updated')

    def get_queryset(self):
        return self.query_model.objects.all()
