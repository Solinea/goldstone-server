"""Utilities for DRFES"""
# Copyright '2015' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import elasticsearch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """An example handler for custom exceptions that aren't taken care of by
     DRF.

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
            data = {'detail': "There was an error processing this request. ",
                    'message': exc.message}
            response = Response(data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # not an exception
            return None

    return response


def es_custom_exception_handler(exc):
    """A function to handle ES specific exceptions.

    :type exc: Exception
    :param exc: the exception to process
    :return: Response or None
    """

    data = {'gateway': 'search',
            'exception_type': exc.__class__.__name__,
            'message': "Received " + exc.__class__.__name__ +
                       " from the search engine."}
    if hasattr(exc, 'status_code'):
        data['gateway_status'] = exc.status_code

    if isinstance(exc, elasticsearch.exceptions.ImproperlyConfigured):
        data['detail'] = "The search engine responded with a client " \
                         "configuration error."
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif isinstance(exc, elasticsearch.exceptions.SerializationError):
        data['detail'] = "Data passed in failed to serialize properly in " \
                         "the serializer being used. This may be a " \
                         "problem with the client request."
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif isinstance(exc, elasticsearch.exceptions.ConnectionError):
        data['detail'] = "Error raised when there was an exception while " \
                         "talking to ES. This may be a network problem or " \
                         "an issue with ES. It may be transient."
        return Response(data, status=status.HTTP_502_BAD_GATEWAY)

    elif isinstance(exc, elasticsearch.exceptions.TransportError):
        data['detail'] = "Exception raised when ES returns a non-OK (>=400) " \
                         "HTTP status code or when an actual connection " \
                         "error occurs."
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:
        data['detail'] = "An ES exception has occurred that's we're not " \
                         "familiar with."
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
