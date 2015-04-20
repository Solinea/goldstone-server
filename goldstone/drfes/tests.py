"""DRFES tests."""
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
from django.http import QueryDict
import elasticsearch
from elasticsearch.client import IndicesClient

from rest_framework.test import APITestCase

from elasticsearch_dsl import Search
from elasticsearch_dsl.result import Response
from goldstone.drfes.models import DailyIndexDocType
from goldstone.drfes.utils import custom_exception_handler

from goldstone.drfes.views import ElasticListAPIView
from goldstone.drfes.filters import ElasticFilter
from goldstone.drfes.serializers import ReadOnlyElasticSerializer

from mock import MagicMock, patch


def dummy_response():
    """Return a document for an Elasticsearch DSL Response object"""

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
        elasticfilter = ElasticFilter()
        view = ElasticListAPIView()
        queryset = Search()
        view.Meta.model = MagicMock()
        view.Meta.model.field_has_raw.return_value = False

        result = elasticfilter._update_queryset('param1',
                                                'value1',
                                                view,
                                                queryset)
        self.assertTrue(view.Meta.model.field_has_raw.called)
        self.assertEqual(result.to_dict(), expectation)

    def test__update_queryset_with_raw(self):
        """Test proper handling of mapping with raw field"""

        expectation = {'query': {'match': {'param1.raw': 'value1'}}}
        elasticfilter = ElasticFilter()
        view = ElasticListAPIView()
        queryset = Search()
        view.Meta.model = MagicMock()
        view.Meta.model.field_has_raw.return_value = True

        result = elasticfilter._update_queryset('param1',
                                                'value1',
                                                view,
                                                queryset)
        self.assertTrue(view.Meta.model.field_has_raw.called)
        self.assertEqual(result.to_dict(), expectation)

    def test__coerce_value_list(self):
        """Test that we properly coerce values to native python types"""

        expectation = [1426206062000, 1426206062000]
        quoted_value = '[1426206062000, 1426206062000]'
        elasticfilter = ElasticFilter()

        result = elasticfilter._coerce_value(quoted_value)
        self.assertEqual(result, expectation)

    def test__coerce_value_exception(self):
        """Test coercion failure that returns the original string"""

        expectation = '2015-03-12T00:12:55.500814+00:00'
        elasticfilter = ElasticFilter()

        result = elasticfilter._coerce_value(expectation)
        self.assertEqual(result, expectation)

    def test_filter_queryset(self):
        """Test filtering of search objects"""

        view = ElasticListAPIView()
        elasticfilter = ElasticFilter()
        request = MagicMock()
        params = QueryDict('', mutable=True)
        params.update(
            {view.pagination_class.page_query_param: 'ignored',
             'name': 'value',
             'name__terms': '["value1","value2"]'}
        )
        request.query_params = params

        result = elasticfilter.filter_queryset(request,
                                               Search(),
                                               view).to_dict()
        self.assertTrue({'terms': {u'name': ['value1', 'value2']}} in
                        result['query']['bool']['must'])
        self.assertTrue(
            {'match': {u'name': 'value'}} in result['query']['bool']['must'])


class PaginationTests(APITestCase):
    """Not going to do it.

    The paginator is mostly the same as the Django paginator.  The only
    difference is that ours executes the search object.
    """
    pass


class ViewTests(APITestCase):
    """View testing

    Testing the actual get would take a lot of mocking for little value since
    it is pretty generic."""

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


class CustomExceptionHandlerTests(APITestCase):
    """Tests for DRF custom exception handling."""

    def test_drf_handled_exception(self):
        """Test that we pass DRF recognized exceptions through unmodified"""
        with patch(
                'goldstone.drfes.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = "it's handled"
            result = custom_exception_handler(None, None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, "it's handled")

    def test_502_error_exceptions(self):
        """Test ES connection exception is handled"""
        with patch(
                'goldstone.drfes.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.ConnectionError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 502)

    def test_500_error_exceptions(self):
        """Test ES connection exception is handled"""
        with patch(
                'goldstone.drfes.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.SerializationError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            result = custom_exception_handler(
                elasticsearch.exceptions.ImproperlyConfigured("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            result = custom_exception_handler(
                elasticsearch.exceptions.TransportError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            exception_handler.return_value = None
            result = custom_exception_handler(Exception("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

    def test_not_exception(self):
        """Test ES connection exception is handled"""
        with patch(
                'goldstone.drfes.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler('what??', None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, None)


class DailyIndexDocTypeTests(APITestCase):
    """Tests for the LogData model"""

    def test_field_has_raw_true(self):
        """field_has_raw returns true if mapping has a raw field"""
        # py26 support
        with patch.object(DailyIndexDocType, "get_field_mapping") as gfm:

            field = 'field'
            gfm.return_value = {'index': {'mappings': {
                'syslog': {field: {'mapping': {field: {'fields': {
                    'raw': True}}}}}}}}

            result = DailyIndexDocType.field_has_raw('field')
            self.assertTrue(gfm.called)
            self.assertTrue(result)

    def test_field_has_raw_false(self):
        """field_has_raw returns false if mapping doesn't have a raw field"""
        # py26 support
        with patch.object(DailyIndexDocType, "get_field_mapping") as gfm:

            field = 'field'
            gfm.return_value = {'index': {'mappings': {
                'syslog': {field: {'mapping': {field: {'fields': {
                    'not_raw': True}}}}}}}}

            result = DailyIndexDocType.field_has_raw('field')
            self.assertTrue(gfm.called)
            self.assertFalse(result)

    def test_field_has_raw_key_error(self):
        """field_has_raw returns false if KeyError raised"""
        # py26 support
        with patch.object(DailyIndexDocType, "get_field_mapping") as gfm:

            gfm.side_effect = KeyError

            result = DailyIndexDocType.field_has_raw('field')
            self.assertTrue(gfm.called)
            self.assertFalse(result)

    def test_get_field_mapping(self):
        """get_field_mapping returns the mapping reported by ES"""

        with patch.object(IndicesClient, "get_field_mapping") as gfm:

            gfm.return_value = 'pass me through'
            result = DailyIndexDocType.get_field_mapping('field')
            self.assertEqual(result, 'pass me through')
