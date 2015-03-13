"""DRFES tests."""
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
from django.http import QueryDict
from elasticsearch_dsl import Search
from rest_framework.test import APITestCase
from goldstone.apps.drfes.filters import ElasticFilter
from goldstone.apps.drfes.serializers import ReadOnlyElasticSerializer
from elasticsearch_dsl.result import Response
from mock import patch, MagicMock
from goldstone.apps.drfes.views import ElasticListAPIView
import urllib


def dummy_response():
    return {
        "_shards": {
            "failed": 0,
            "successful": 1,
            "total": 1
        },
        "hits": {
            "hits": [
                {
                    "_index": "test-index",
                    "_type": "Solinea",
                    "_id": "1",
                    "_score": 1.0,

                    "_source": {
                        "include": "the good stuff",
                        "exclude": "the bad stuff",
                    },
                }
            ],
            "max_score": 1.0,
            "total": 123
        },
        "timed_out": False,
        "took": 123
    }


class SerializerTests(APITestCase):
    """Serializer tests."""

    def test_exclusion(self):
        """Test excluding key from serialized data"""

        expectation = {'include': 'the good stuff'}
        response = Response(dummy_response())
        instance = response[0]
        ser = ReadOnlyElasticSerializer(instance)
        ser.Meta.exclude = ['exclude']
        result = ser.data
        self.assertEqual(result, expectation)

    def test_nonexistent_exclusion(self):
        """Test proper handling of nonexistent key in exclusion list"""

        expectation = {"include": "the good stuff",
                       "exclude": "the bad stuff"}
        response = Response(dummy_response())
        instance = response[0]
        ser = ReadOnlyElasticSerializer(instance)
        ser.Meta.exclude = ['bad_key']
        result = ser.data
        self.assertDictEqual(result, expectation)


class FilterTests(APITestCase):
    """Filter tests."""

    def test__update_queryset_without_raw(self):
        """Test proper handling of mapping without raw field"""

        expectation = {'query': {'match': {'param1': 'value1'}}}
        filter = ElasticFilter()
        view = ElasticListAPIView()
        queryset = Search()
        view.Meta.model = MagicMock()
        view.Meta.model.field_has_raw.return_value = False
        result = filter._update_queryset('param1', 'value1', view, queryset)
        self.assertTrue(view.Meta.model.field_has_raw.called)
        self.assertEqual(result.to_dict(), expectation)

    def test__update_queryset_with_raw(self):
        """Test proper handling of mapping with raw field"""

        expectation = {'query': {'match': {'param1.raw': 'value1'}}}
        filter = ElasticFilter()
        view = ElasticListAPIView()
        queryset = Search()
        view.Meta.model = MagicMock()
        view.Meta.model.field_has_raw.return_value = True
        result = filter._update_queryset('param1', 'value1', view, queryset)
        self.assertTrue(view.Meta.model.field_has_raw.called)
        self.assertEqual(result.to_dict(), expectation)

    def test__coerce_value_list(self):
        """Test that we properly coerce values to native python types"""
        expectation = [1426206062000, 1426206062000]
        quoted_value = '[1426206062000, 1426206062000]'
        filter = ElasticFilter()
        result = filter._coerce_value(quoted_value)
        self.assertEqual(result, expectation)

    def test__coerce_value_exception(self):
        expectation = '2015-03-12T00:12:55.500814+00:00'
        filter = ElasticFilter()
        result = filter._coerce_value(expectation)
        self.assertEqual(result, expectation)

    def test_filter_queryset(self):

        expectation = {'query': {'bool': {'must':
                        [{'terms': {u'name': ['value1', 'value2']}},
                         {'match': {u'name': 'value'}}]}}}
        view = ElasticListAPIView()
        filter = ElasticFilter()
        request = MagicMock()
        params = QueryDict('', mutable=True)
        params.update(
            {view.pagination_class.page_query_param: 'ignored',
             'name': 'value',
             'name__terms': '["value1","value2"]'}
        )
        request.query_params = params

        result = filter.filter_queryset(request, Search(), view)
        self.assertEqual(result.to_dict(), expectation)

class ViewTests(APITestCase):

    def test_model_not_set(self):
        """Test handling of no model"""

        view = ElasticListAPIView()
        view.Meta.model = None
        with self.assertRaises(AssertionError):
            view.get_queryset()

    def test_model_set(self):
        """Test handling when model is set"""
        
        expectation = Search().query('match', field='value')
        view = ElasticListAPIView()
        view.Meta.model = MagicMock()
        view.Meta.model.return_value = 'Some'
        view.Meta.model.search.return_value = expectation
        self.assertEqual(view.get_queryset(), expectation)