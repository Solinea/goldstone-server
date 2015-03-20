"""Core utilities."""
# Copyright '2015' Solinea, Inc.
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
import logging

import elasticsearch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework.viewsets import ReadOnlyModelViewSet
from goldstone.apps.drfes.utils import es_custom_exception_handler

logger = logging.getLogger(__name__)


# TODO remove JsonReadOnlyViewSet after poly resource model in place.
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

    # These must be defined by the subclass.
    model = lambda: None
    key = None

    # This may be defined by subclass.
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
                region = item['region']

                if request_region is None or request_region == region:
                    timestamp = item['@timestamp']

                    new_list = []

                    for rec in item[self.key]:
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
        request_zone = request.query_params.get('zone')
        request_region = request.query_params.get('region')

        # Now fetch the data and return it as JSON.
        return Response(self._get_objects(request_zone, request_region))

    def retrieve(self, request, *args, **kwargs):
        """We do not implement single-object GET."""
        from django.http import HttpResponseNotAllowed

        return HttpResponseNotAllowed('')


def custom_exception_handler(exc, context):
    """Return a response from customized exception handling.

    :param exc: An exception
    :type exc: Exception

    """

    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # All other generated exceptions should be logged and handled here.
    if response is None:
        if isinstance(exc, elasticsearch.exceptions.ElasticsearchException) or\
           isinstance(exc, elasticsearch.exceptions.ImproperlyConfigured):

            response = es_custom_exception_handler(exc)

        elif isinstance(exc, Exception):
            data = {'detail': "There was an error processing this request. "
                              "Please file a ticket with support.",
                    'message': str(exc)}
            logger.exception(exc)
            response = Response(data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # not an exception
            return None

    return response
