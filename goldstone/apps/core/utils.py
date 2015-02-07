"""Core utilities."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging

import elasticsearch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework.viewsets import ReadOnlyModelViewSet

logger = logging.getLogger(__name__)


class JsonReadOnlyViewSet(ReadOnlyModelViewSet):
    """A base ViewSet that renders a JSON response for "list" actions; i.e.,
    GET requests for a collection of objects.

    This must be subclassed.

    Implementing views on new data sources is achieved by subclassing
    this class, and defining the model, key, and zone_key class attributes.
    Then, adding the DjangoRestFramework ViewSet code to the URLconf.

    N.B. settings.REST_FRAMEWORK defines some global settings,
    including default renderer classes, which includes the JSON
    renderer.

    """

    # Must be defined by the subclass.
    model = None
    key = None

    # May be defined by subclass.
    zone_key = None

    def _get_objects(self, request_zone, request_region):
        """Return a collection of objects.

        :param request_zone: The request's "zone", if present.
        :type request_zone: str or None
        :param request_region: The request's "region", if present.
        :type request_region: str or None

        """

        try:
            data = self.model().get()

            result = []

            for item in data:
                region = item['_source']['region']

                if request_region is None or request_region == region:
                    timestamp = item['_source']['@timestamp']

                    new_list = []

                    for rec in item['_source'][self.key]:
                        if request_zone is None or self.zone_key is None or \
                                request_zone == rec[self.zone_key]:
                            rec['region'] = region
                            rec['@timestamp'] = timestamp
                            new_list.append(rec)

                    result.append(new_list)

            return result

        except TypeError:
            return [[]]

    def list(self, request, *args, **kwargs):
        """Implement the GET request for a collection."""

        # Extract a zone or region provided in the request, if present.
        request_zone = self.request.data.get('zone')
        request_region = self.request.data.get('region')

        # Now fetch the data and return it as JSON.
        return Response(self._get_objects(request_zone, request_region))

    def retrieve(self, request, *args, **kwargs):
        """We do not implement single-object GET."""
        from django.http import HttpResponseNotAllowed

        return HttpResponseNotAllowed('')


def custom_exception_handler(exc):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc)

    # All other generated exceptions should be logged and handled here.
    if response is None:
        data = {}

        if isinstance(exc, elasticsearch.exceptions.ElasticsearchException):
            data = {'gateway': 'search',
                    'gateway_status': exc.status_code,
                    'exception_type': exc.__class__.__name__,
                    'message': "Received " + exc.__class__.__name__ +
                               " from the search engine."}
        # 502 Exceptions
        if isinstance(exc, elasticsearch.exceptions.ConflictError) or \
                isinstance(exc, elasticsearch.exceptions.NotFoundError) or \
                isinstance(exc, elasticsearch.exceptions.RequestError) or \
                isinstance(exc, elasticsearch.exceptions.SerializationError):
            data['detail'] = "The search engine responded with a client " \
                             "error. This is usually a problem with the user" \
                             " request, though it could also be a bug in " \
                             "goldstone."
            response = Response(data, status=status.HTTP_502_BAD_GATEWAY)

        # 504 Exceptions
        elif isinstance(exc, elasticsearch.exceptions.ConnectionError):
            del data['gateway_status']
            data['detail'] = "Could not connect to the search backend."
            response = Response(data, status=status.HTTP_504_GATEWAY_TIMEOUT)

        # 500 Exceptions
        elif isinstance(exc, elasticsearch.exceptions.TransportError) or \
                isinstance(exc, elasticsearch.exceptions.ImproperlyConfigured):
            data['detail'] = "The search engine responded with a client " \
                             "configuration error. This is probably a bug in" \
                             " goldstone.  Please contact support."
            response = Response(data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle all other exceptions
        elif isinstance(exc, Exception):
            data = {'detail': "There was an error processing this request. "
                              "Please file a ticket with goldstone support.",
                    'message': exc.message}
            response = Response(data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Now add the HTTP status code to the response.
        if response is not None:
            logger.exception(
                '[custom_exception_handler] Handled custom exception')
            response.data['status_code'] = response.status_code
        else:
            logger.exception(
                '[custom_exception_handler] Unhandled custom exception')

    return response
