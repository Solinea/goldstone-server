"""Core app unit tests.

This module demonstrates no less than 3 strategies for mocking ES.
"""

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
from django.test import SimpleTestCase
import elasticsearch
from elasticsearch.client import IndicesClient
import mock
from mock import patch
from rest_framework.test import APISimpleTestCase

from . import tasks
from .utils import custom_exception_handler
from .models import PolyResource

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_delete_indices(self):
        """Tests that delete indices returns result of check_call,"""

        tasks.check_call = mock.Mock(return_value='mocked')
        # pylint: disable=W0212
        self.assertEqual(tasks.delete_indices('abc', 10), 'mocked')

    @patch.object(IndicesClient, 'create')
    @patch.object(IndicesClient, 'exists_alias')
    @patch.object(IndicesClient, 'update_aliases')
    @patch.object(IndicesClient, 'put_alias')
    def test_create_daily_index(self, put_alias, update_aliases, exists_alias,
                                create):

        create.side_effect = None
        exists_alias.return_value = True
        update_aliases.return_value = None

        # pylint: disable=W0212
        self.assertIsNone(tasks.create_daily_index('abc'))
        create.assert_called()

        exists_alias.return_value = False
        put_alias.return_value = None

        self.assertIsNone(tasks.create_daily_index('abc'))


class PolyResourceModelTests(SimpleTestCase):
    """Test the PolyResourceModel."""

    def test_logs(self):
        """test that the logs method returns an appropriate search object."""

        expectation = {'bool': {
            'must': [{'query_string': {'query': 'polly'}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}

        resource = PolyResource(name='polly')
        result = resource.logs().to_dict()
        self.assertDictEqual(expectation, result['query'])

        expectation = [{'@timestamp': {'order': 'desc'}}]
        self.assertListEqual(expectation, result['sort'])

    def test_events(self):
        """test that the events method returns an appropriate search object."""

        expectation = {"query_string":
                       {"query": "\"polly\"", "default_field": "_all"}}
        resource = PolyResource(name='polly')
        result = resource.events().to_dict()
        self.assertTrue(expectation in result['query']['bool']['must'])


class JsonReadOnlyViewSetTests(SimpleTestCase):
    """Not testing due to upcoming replacement with PolyResource model."""
    pass


class CustomExceptionHandlerTests(APISimpleTestCase):
    """Tests for DRF custom exception handling."""

    def test_drf_handled_exception(self):
        """Test that we pass DRF recognized exceptions through unmodified"""
        with patch(
                'goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = "it's handled"
            result = custom_exception_handler(None, None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, "it's handled")

    def test_502_error_exceptions(self):
        """Test ES connection exception is handled"""
        with patch(
                'goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.ConnectionError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 502)

    def test_500_error_exceptions(self):
        """Test ES connection exception is handled"""
        with patch(
                'goldstone.core.utils.exception_handler') \
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
                'goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler('what??', None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, None)
