"""Logging tests."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
# http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from contextlib import nested
import arrow
from django.test import SimpleTestCase
from elasticsearch.client import IndicesClient
from elasticsearch_dsl import Search
from mock import patch
from .models import LogData


class LogDataModelTests(SimpleTestCase):
    """Tests for the LogData model"""

    def test_field_has_raw_true(self):
        """field_has_raw returns true if mapping has a raw field"""
        # py26 support
        with nested(
                patch("goldstone.apps.logging.models.most_recent_index"),
                patch.object(LogData, "get_field_mapping")) \
                as (mre, gfm):

            field = 'field'
            mre.return_value = 'index'
            gfm.return_value = {'index': {'mappings': {
            'syslog': {field: {'mapping': {field: {'fields': {
                'raw': True}}}}}}}}

            result = LogData.field_has_raw('field')
            self.assertTrue(mre.called)
            self.assertTrue(gfm.called)
            self.assertTrue(result)

    def test_field_has_raw_false(self):
        """field_has_raw returns false if mapping doesn't have a raw field"""
        # py26 support
        with nested(
                patch("goldstone.apps.logging.models.most_recent_index"),
                patch.object(LogData, "get_field_mapping")) \
                as (mre, gfm):

            field = 'field'
            mre.return_value = 'index'
            gfm.return_value = {'index': {'mappings': {
            'syslog': {field: {'mapping': {field: {'fields': {
                'not_raw': True}}}}}}}}

            result = LogData.field_has_raw('field')
            self.assertTrue(mre.called)
            self.assertTrue(gfm.called)
            self.assertFalse(result)

    def test_field_has_raw_key_error(self):
        """field_has_raw returns false if KeyError raised"""
        # py26 support
        with nested(
                patch("goldstone.apps.logging.models.most_recent_index"),
                patch.object(LogData, "get_field_mapping")) \
                as (mre, gfm):

            field = 'field'
            mre.return_value = 'index'
            gfm.side_effect = KeyError

            result = LogData.field_has_raw('field')
            self.assertTrue(mre.called)
            self.assertTrue(gfm.called)
            self.assertFalse(result)

    def test_get_field_mapping(self):
        """get_field_mapping returns the mapping reported by ES"""

        with patch.object(IndicesClient, "get_field_mapping") as gfm:

            gfm.return_value = 'pass me through'
            result = LogData.get_field_mapping('field')
            self.assertEqual(result, 'pass me through')

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
        expectation = {'range': {'@timestamp': {
            'gte': now.isoformat(),
            'lte': now.isoformat()}}}
        result = LogData.ranged_log_search(start=now, end=now).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_start_provided(self):
        """ranged_log_search returns a query with range including start"""
        now = arrow.utcnow()
        expectation = {'range': {'@timestamp': {
            'gte': now.isoformat()}}}
        result = LogData.ranged_log_search(start=now).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_end_provided(self):
        """ranged_log_search returns a query with range including end"""
        now = arrow.utcnow()
        expectation = {'range': {'@timestamp': {
            'lte': now.isoformat()}}}
        result = LogData.ranged_log_search(end=now).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_no_times_provided(self):
        """ranged_log_search returns a match_all query when no time is
        provided"""
        now = arrow.utcnow()
        expectation = {'match_all': {}}
        result = LogData.ranged_log_search().to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_host_provided(self):
        """ranged_log_search returns a query with terms clause"""
        now = arrow.utcnow()
        expectation = {'terms': {u'host.raw': ['h1']}}
        result = LogData.ranged_log_search(hosts=['h1']).to_dict()
        self.assertDictEqual(result['query'], expectation)

    def test_ranged_log_search_sort_clause(self):
        """ranged_log_search returns a query with interval in clause"""
        now = arrow.utcnow()
        expectation = [{'@timestamp': {'order': 'desc'}}]
        result = LogData.ranged_log_search(hosts=['h1']).to_dict()
        self.assertListEqual(result['sort'], expectation)


class LogEventModelTests(SimpleTestCase):
    """Tests for the LogEvent model"""

    def test_search(self):
        from .models import LogEvent

        expectation = {'terms': {u'event_type.raw': ['OpenStackSyslogError',
                       'GenericSyslogError']}}
        result = LogEvent.search().to_dict()
        self.assertDictContainsSubset(expectation, result['query'])

