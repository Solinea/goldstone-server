"""Elasticsearch views."""
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

from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from goldstone.apps.drfes.filters import ElasticFilter
from goldstone.apps.drfes.pagination import ElasticPageNumberPagination
from goldstone.apps.drfes.serializers import ReadOnlyElasticSerializer


class ElasticListAPIView(ListAPIView):
    """A view that handles requests for ES search results."""

    serializer_class = ReadOnlyElasticSerializer
    pagination_class = ElasticPageNumberPagination
    filter_backends = (ElasticFilter,)

    class Meta:
        model = None

    def get_queryset(self):
        """Gets a search object from the model."""

        assert self.Meta.model is not None, (
            "'%s' should set the `Meta.model` attribute, "
            "or override the `get_queryset()` method."
            % self.__class__.__name__
        )
        return self.Meta.model.search()

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
