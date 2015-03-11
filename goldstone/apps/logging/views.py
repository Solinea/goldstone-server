"""Logging app views."""
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
from django.conf import settings
import arrow
from rest_framework.fields import BooleanField
from rest_framework.filters import BaseFilterBackend
from rest_framework.viewsets import GenericViewSet
import six
import logging

from django.http import HttpResponse, Http404
from rest_framework import serializers, fields, pagination
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.serializers import Serializer
from rest_framework.views import APIView

from goldstone.apps.core.serializers import IntervalField, \
    ArrowCompatibleField, CSVField
from goldstone.apps.logging.models import LogData
from .serializers import LoggingNodeSerializer
from rest_framework.response import Response
from goldstone.apps.core.views import NodeViewSet, ReadOnlyElasticViewSet

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(NodeViewSet):

    serializer_class = LoggingNodeSerializer

    @staticmethod
    def get_request_time_range(params_dict):

        end_time = \
            arrow.get(params_dict['end_time']) if 'end_time' in params_dict \
            else arrow.utcnow()

        start_time = \
            arrow.get(params_dict['start_time']) \
            if 'start_time' in params_dict \
            else end_time.replace(
                minutes=(-1 * settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES))

        return {'start_time': start_time, 'end_time': end_time}

    @staticmethod
    def _add_headers(response, time_range):
        """Add time logging to a response's header."""

        # pylint: disable=W0212
        response._headers['LogCountEnd'] = \
            ('LogCountEnd', time_range['end_time'].isoformat())
        response._headers['LogCountStart'] = \
            ('LogCountStart', time_range['start_time'].isoformat())

        return response

    def list(self, request, *args, **kwargs):

        time_range = self.get_request_time_range(request.QUERY_PARAMS.dict())
        instance = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(instance)

        serializer = self.get_pagination_serializer(page) if page is not None \
            else self.get_serializer(instance, many=True)

        serializer.context['start_time'] = time_range['start_time']
        serializer.context['end_time'] = time_range['end_time']

        return self._add_headers(Response(serializer.data), time_range)

    def retrieve(self, request, *args, **kwargs):

        time_range = self.get_request_time_range(request.QUERY_PARAMS.dict())

        serializer = self.serializer_class(
            self.get_object(),
            context={'start_time': time_range['start_time'],
                     'end_time': time_range['end_time']})

        return self._add_headers(Response(serializer.data), time_range)


class LogDataPagination(pagination.PageNumberPagination):

    def paginate_queryset(self, queryset, request, view=None):
        """
        Paginate a queryset if required, either returning a
        page object, or `None` if pagination is not configured for this view.
        """
        from django.core.paginator import InvalidPage, \
            Paginator as DjangoPaginator

        self._handle_backwards_compat(view)

        page_size = self.get_page_size(request)
        if not page_size:
            return None

        paginator = DjangoPaginator(queryset, page_size)
        page_number = request.query_params.get(self.page_query_param, 1)
        if page_number in self.last_page_strings:
            page_number = paginator.num_pages

        try:
            self.page = paginator.page(page_number)
            # we need to execute the query to resolve the page of objects
            self.page.object_list = self.page.object_list.execute()
        except InvalidPage as exc:
            msg = self.invalid_page_message.format(
                page_number=page_number, message=six.text_type(exc)
            )
            raise NotFound(msg)

        if paginator.count > 1 and self.template is not None:
            # The browsable API should display pagination controls.
            self.display_page_controls = True

        self.request = request
        return list(self.page)


class DRFESReadOnlySerializer(Serializer):

    class Meta:
        exclude = ()

    def to_representation(self, instance):
        """Convert a record to a representation suitable for rendering."""

        obj = instance.to_dict()

        for excl in self.Meta.exclude:
            try:
                del obj[excl]
            except KeyError as exc:
                logger.exception(exc)

        return obj


class LogDataSerializer(DRFESReadOnlySerializer):

    class Meta:
        exclude = ('@version', 'message', 'syslog_ts', 'received_at', 'sort',
                   'tags', 'syslog_facility_code', 'syslog_severity_code',
                   'syslog_pri', 'type')

class LogAggSerializer(DRFESReadOnlySerializer):
    """Custom serializer to manipulate the aggregation that comes back from ES.
    """

    def to_representation(self, instance):
        """Create serialized representation of aggregate log data.

        There will be a summary block that can be used for ranging, legends,
        etc., then the detailed aggregation data which will be a nested
        structure.  The number of layers will depend on whether the host
        aggregation was done.
        """

        timestamps = [i['key'] for i in instance.per_interval['buckets']]
        levels = [i['key'] for i in instance.per_level['buckets']]
        hosts = [i['key'] for i in instance.per_host['buckets']] \
            if hasattr(instance, 'per_host') else None

        # let's clean up the inner buckets
        data = []
        if hosts is None:
            for interval_bucket in instance.per_interval.buckets:
                key = interval_bucket.key
                values = [{item.key: item.doc_count}
                          for item in interval_bucket.per_level.buckets]
                data.append({key: values})

        else:
            for interval_bucket in instance.per_interval.buckets:
                interval_key = interval_bucket.key
                interval_values = []
                for host_bucket in interval_bucket.per_host.buckets:
                    key = host_bucket.key
                    values = [{item.key: item.doc_count}
                              for item in host_bucket.per_level.buckets]
                    interval_values.append({key: values})
                data.append({interval_key: interval_values})

        if hosts is not None:
            return {
                'timestamps': timestamps,
                'hosts': hosts,
                'levels': levels,
                'data': data
            }
        else:
            return {
                'timestamps': timestamps,
                'levels': levels,
                'data': data
            }


class LogDataFilter(BaseFilterBackend):
    """A basic query filter for ES query and filter specification.

    Initially, this will support some very limited expressions like:

        field=value (equivalent to a term filter)
        field__prefix=value
        field__regex=value
        field__gt=value
        field__lt=value
        field__gte=value
        field__lte=value

    These will all be treated as query enhancements (rather than filters) from
    an ES perspective.  If we run into the need for supporting filters, we can
    augment/change the specification to add another term such as:

        f__field=value or q__field=value

    However, that may expose too much detail about the backend, so we should
    think carefully about it.

    We also do not currently support conditionals other than AND.  If we get
    to that point, we probably need ot use a body to express the query.
    """

    def filter_queryset(self, request, queryset, view):
        """Enhance the queryset with additional specificity, then return it.

        :param request: the HTTP request
        :param queryset: the original queryset
        :param view: the view
        :rtype: Search
        :return: the updated queryset
        """

        from django.db.models.constants import LOOKUP_SEP
        from goldstone.models import es_indices

        # some conditions to consider:
        #   * using raw fields if available
        #   * lists of things like hosts (host=[host1,host2])
        #   * ranges (is @timestamp gt and @timestamp lt worse than range?)
        #   * conditionals other than AND

        # we'll need to look up the mapping for the index associated with this
        # request.  The assumption we'll make is that the most recent index
        # matching the index prefix has an acceptable mapping.
        model_class = view.Meta.model

        for param in request.query_params:
            value = request.query_params.get(param)
            split_param = param.split(LOOKUP_SEP)
            if len(split_param) == 1:
                # standard term query
                param = param if model_class.field_has_raw(param) \
                    else param + '.raw'
                queryset = queryset.query("match",  ** {param: value})
            else:
                # first term is the field, second term is the query operation
                param = split_param[0] \
                    if model_class.field_has_raw(split_param[0]) \
                    else split_param[0] + '.raw'
                queryset = queryset.query(split_param[1],
                                          ** {param: value})

        logger.info("queryset: %s", queryset.to_dict())

        return queryset


class LogDataView(ListAPIView):
    """A view that handles requests for Logstash data."""

    permission_classes = (AllowAny,)
    serializer_class = LogDataSerializer
    pagination_class = LogDataPagination
    filter_backends = (LogDataFilter,)

    class Meta:
        model = LogData

    class ParamValidator(serializers.Serializer):
        """An inner class that validates and deserializes the request context.
        """
        start = ArrowCompatibleField(
            required=False,
            allow_blank=True)
        end = ArrowCompatibleField(
            required=False,
            allow_blank=True)
        interval = IntervalField(
            required=False,
            allow_blank=True)
        hosts = CSVField(
            required=False,
            allow_blank=True)

    def get_queryset(self):
        logger.info("in get_queryset")
        return LogData.ranged_log_search(**self.validated_params)

    def get_object(self):

        queryset = self.get_queryset()

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg, None)

        if lookup is not None:
            filter_kwargs = {self.lookup_field: lookup}

        queryset_result = queryset.filter(**filter_kwargs)[:1].execute()

        if queryset_result.count > 1:
            logger.warning("multiple objects with %s = %s, only returning "
                           "first one.", lookup_url_kwarg, lookup)

        if queryset_result.count > 0:
            return queryset_result.objects[0].get_object()
        else:
            raise Http404

    def _get_data(self, data):
        return LogData.ranged_log_search(**data)

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""
        params = self.ParamValidator(data=request.query_params)
        params.is_valid(raise_exception=True)
        self.validated_params = params.to_internal_value(request.query_params)

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class LogAggView(APIView):
    """A view that handles requests for Logstash aggregations."""

    permission_classes = (AllowAny,)
    serializer_class = LogAggSerializer

    class ParamValidator(serializers.Serializer):
        """An inner class that validates and deserializes the request context.
        """
        start = ArrowCompatibleField(
            required=False,
            allow_blank=True)
        end = ArrowCompatibleField(
            required=False,
            allow_blank=True)
        interval = IntervalField(
            required=False,
            allow_blank=True)
        hosts = CSVField(
            required=False,
            allow_blank=True),
        per_host = BooleanField(
            default=True)

    def _get_data(self):
        return LogData.ranged_log_agg(**self.validated_params)

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""
        params = self.ParamValidator(data=request.query_params)
        params.is_valid(raise_exception=True)
        self.validated_params = params.to_internal_value(request.query_params)

        data = self._get_data()
        serializer = self.serializer_class(data)
        return Response(serializer.data)
