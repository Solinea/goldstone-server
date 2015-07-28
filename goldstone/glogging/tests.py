"""Logging tests."""
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
import arrow
from django.test import SimpleTestCase
from elasticsearch_dsl import Search
from mock import patch
from rest_framework.test import APITestCase
from goldstone.test_utils import create_and_login, AUTHORIZATION_PAYLOAD
from .models import LogData

# pylint: disable=C0103


class LogDataModelTests(SimpleTestCase):
    """Tests for the LogData model."""

    def test_ranged_log_agg(self):
        """ranged_log_agg should return the aggregation from the execution"""

        with patch.object(Search, 'execute') as execute:
            execute.return_value.aggregations = 'hi there!'

            self.assertEqual(LogData.ranged_log_agg(Search()), 'hi there!')
            self.assertEqual(LogData.ranged_log_agg(Search(), per_host=False),
                             'hi there!')

    def test_ranged_log_agg_assertion(self):
        """ranged_log_agg asserts that the interval is a string"""

        with self.assertRaises(AssertionError):
            LogData.ranged_log_agg(Search(), interval=1)

    def test_ranged_log_search_start_assertion(self):
        """ranged_log_search asserts that end is an Arrow"""

        with self.assertRaises(AssertionError):
            LogData.ranged_log_search(start=1)

    def test_ranged_log_search_end_assertion(self):
        """ranged_log_search asserts that start is an Arrow"""

        with self.assertRaises(AssertionError):
            LogData.ranged_log_search(end=1)

    def test_ranged_log_search_start_end_provided(self):
        """ranged_log_search returns a query with range including start/end"""
        now = arrow.utcnow()
        expectation = {'bool': {
            'must': [{'range': {'@timestamp': {
                'gte': now.isoformat(),
                'lte': now.isoformat()}}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}

        result = LogData.ranged_log_search(start=now, end=now).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_start_provided(self):
        """ranged_log_search returns a query with range including start"""
        now = arrow.utcnow()
        expectation = {'bool': {
            'must': [{'range': {'@timestamp': {'gte': now.isoformat()}}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}
        result = LogData.ranged_log_search(start=now).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_end_provided(self):
        """ranged_log_search returns a query with range including end"""
        now = arrow.utcnow()
        expectation = {'bool': {
            'must': [{'range': {'@timestamp': {
                'lte': now.isoformat()}}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}

        result = LogData.ranged_log_search(end=now).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_no_times_provided(self):
        """ranged_log_search returns a match_all query when no time is
        provided"""

        expectation = {'bool': {
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}
        result = LogData.ranged_log_search().to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_host_provided(self):
        """ranged_log_search returns a query with terms clause"""

        expectation = {'bool': {
            'must': [{'terms': {u'host.raw': ['h1']}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}

        result = LogData.ranged_log_search(hosts=['h1']).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_sort_clause(self):
        """ranged_log_search returns a query with interval in clause"""

        expectation = [{'@timestamp': {'order': 'desc'}}]
        result = LogData.ranged_log_search(hosts=['h1']).to_dict()
        self.assertListEqual(result['sort'], expectation)


class LogEventModelTests(SimpleTestCase):
    """Tests for the LogEvent model"""

    def test_search(self):
        """Assert that the search object has the correct basic form."""
        from .models import LogEvent

        expectation = {'bool': {
            'must': [{'terms': {u'event_type.raw': ['OpenStackSyslogError',
                       'GenericSyslogError']}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}

        result = LogEvent.search().to_dict()
        self.assertDictEqual(expectation, result['query'])


class LogAggViewTests(APITestCase):
    """Test log aggregation views."""
    # pylint: disable=C0103

    def setUp(self):
        """set up for each test."""
        self.token = create_and_login()

    def test_agg_view_with_params(self):
        """Test parameter handling for an aggregation view."""

        start = arrow.get(0).timestamp * 1000
        end = arrow.utcnow().timestamp * 1000
        timestamp_range = \
            '@timestamp__range={"gte":"' + str(start) + '", "lte": "' + \
            str(end) + '"}'
        interval = "interval=1d"
        url = '/logging/summarize/?' + timestamp_range + '&' + interval

        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, 200)  # pylint: disable=E1101
