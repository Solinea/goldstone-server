"""Core utilities."""
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
import elasticsearch
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response
from goldstone.drfes.utils import es_custom_exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Return a response from customized exception handling.

    :param exc: An exception
    :type exc: Exception
    :param context: The request context

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
