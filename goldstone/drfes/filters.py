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

        if view.Meta.model.field_has_raw(param):
            param += ".raw"

        return queryset.query(operation, **{param: value})

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
        """Return the queryset enhanced with additional specificity, as
        determined by the request's query parameters.

        The returned queryset is effectively an AND of the conditions.

        :param request: The HTTP request
        :type request: Request
        :param queryset: The base queryset
        :type queryset: Search
        :param view: The view
        :type view: callable
        :return: The base queryset enhanced with additional queries
        :rtype: Search

        """
        from django.db.models.constants import LOOKUP_SEP

        reserved_params = view.reserved_params + \
            [view.pagination_class.page_query_param,
             view.pagination_class.page_size_query_param]

        for param in request.query_params:
            # We don't want these in our queryset.
            if param in reserved_params:
                continue

            value = self._coerce_value(request.query_params.get(param))
            split_param = param.split(LOOKUP_SEP)

            if len(split_param) == 1:
                # This is a field = value term.
                if split_param[0] in ["regexp", "terms"]:
                    # The terms and regexp "fields" have a value of a dict of
                    # field:value terms.
                    queryset = queryset.query(split_param[0], **value)
                else:
                    # This is a standard match query.
                    queryset = self._add_query(param, value, view, queryset)
            else:
                # First term is the field, second term is the query operation.
                param = split_param[0]
                operation = split_param[1]

                queryset = self._add_query(param,
                                           value,
                                           view,
                                           queryset,
                                           operation)

        return queryset
