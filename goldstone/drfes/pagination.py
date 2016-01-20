"""DRFES pagination support."""
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
from collections import OrderedDict
import logging
from django.core.paginator import InvalidPage, Paginator as DjangoPaginator
from rest_framework import pagination
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
import six

logger = logging.getLogger(__name__)


class ElasticPageNumberPagination(pagination.PageNumberPagination):

    def paginate_queryset(self, queryset, request, view=None):
        """Paginate a queryset if required, either returning a page object, or
        `None` if pagination is not configured for this view."""

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
        return self.page.object_list

    def get_paginated_response(self, data):

        if 'aggregations' in data:
            return Response(OrderedDict([
                ('count', self.page.paginator.count),
                ('next', self.get_next_link()),
                ('previous', self.get_previous_link()),
                ('results', data['results']),
                ('aggregations', data['aggregations'])
            ]))
        else:
            return Response(OrderedDict([
                ('count', self.page.paginator.count),
                ('next', self.get_next_link()),
                ('previous', self.get_previous_link()),
                ('results', data['results']),
            ]))
