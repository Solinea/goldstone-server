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

logger = logging.getLogger(__name__)


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
