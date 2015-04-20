"""DRFES Filters."""
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
from rest_framework.filters import BaseFilterBackend


class ElasticFilter(BaseFilterBackend):
    """A basic query filter for ES query specification.

    Everything will be treated as query enhancements (rather than filters) from
    an ES perspective.  Conditionals other than AND are not currently
    supported.
    """

    class Meta:
        reserved_params = []

    @staticmethod
    def _update_queryset(param, value, view, queryset, op='match'):
        """Builds a query, preferring the raw field if available.

        :param param: the field name in ES
        :param value: the field value
        :param view: the calling view
        :param queryset: the base queryset
        :param op: the query operation
        :rtype Search
        :return: the update Search object

        """

        model_class = view.Meta.model
        param = param if not model_class.field_has_raw(param) \
            else param + '.raw'
        return queryset.query(op, **{param: value})

    @staticmethod
    def _coerce_value(value):
        """Attempt to coerce a query parameter's value to a more accurate type.

        :type value: str
        :param value: the value for a query parameter
        :return: the original value, possibly coerced by AST

        """
        import ast

        try:
            return ast.literal_eval(value)

        except (ValueError, SyntaxError):
            return value

    def filter_queryset(self, request, queryset, view):
        """Enhance the queryset with additional specificity, then return it.

        Does an AND of all query conditions.

        :param request: the HTTP request
        :param queryset: the original queryset
        :param view: the view
        :rtype: Search
        :return: the updated queryset

        """
        from django.db.models.constants import LOOKUP_SEP

        reserved_params = view.reserved_params + \
            [view.pagination_class.page_query_param,
             view.pagination_class.page_size_query_param]

        for param in request.query_params:
            # don't want these in our queryset
            if param in reserved_params:
                continue

            value = self._coerce_value(request.query_params.get(param))
            split_param = param.split(LOOKUP_SEP)

            if len(split_param) == 1:
                # standard match query
                queryset = self._update_queryset(param, value, view, queryset)
            else:
                # first term is the field, second term is the query operation
                param = split_param[0]
                op = split_param[1]
                queryset = self._update_queryset(
                    param, value, view, queryset, op)

        return queryset
