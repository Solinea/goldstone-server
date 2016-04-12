"""Core app unit tests.

This module demonstrates no less than 3 strategies for mocking ES.

"""
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

import datetime
from django.test import SimpleTestCase, TestCase
import elasticsearch
import elasticsearch_dsl
from elasticsearch_dsl import String, Date
from elasticsearch_dsl.result import Response
import mock
from rest_framework.test import APISimpleTestCase
from goldstone.core.tasks import prune_es_indices
from .utils import custom_exception_handler
from goldstone.drfes.new_models import DailyIndexDocType
from goldstone.core.models import SavedSearch, CADFEventDocType
from pycadf import event, cadftype, cadftaxonomy
import uuid


class TaskTests(SimpleTestCase):
    """Test task hooks."""

    @mock.patch('goldstone.core.tasks.es_conn')
    @mock.patch('goldstone.core.tasks.curator.get_indices')
    @mock.patch('goldstone.core.tasks.curator.delete_indices')
    @mock.patch('goldstone.core.tasks.logger.exception')
    def test_prune_es_indices(self, exception_mock, delete_indices_mock,
                              get_indices_mock, es_conn_mock):
        """tests for goldstone.core.tasks.prune_es_indices"""

        # test when no indices are present
        get_indices_mock.return_value = []
        rv = prune_es_indices()
        self.assertTrue(es_conn_mock.called)
        self.assertTrue(get_indices_mock.called)
        self.assertFalse(delete_indices_mock.called)
        self.assertItemsEqual(rv, [])

        # test when old versions of all indices are present
        get_indices_mock.return_value = ['goldstone-1900.01.01',
                                         'goldstone_metrics-1900.01.01',
                                         'api_stats-1900.01.01',
                                         'events_1900-01-01']
        rv = prune_es_indices()

        self.assertTrue(delete_indices_mock.call_count, 4)
        self.assertItemsEqual(rv,
                              ['goldstone-1900.01.01',
                               'goldstone_metrics-1900.01.01',
                               'api_stats-1900.01.01',
                               'events_1900-01-01'])
        delete_indices_mock.reset_mock()

        # test when old and new versions of all indices are present
        get_indices_mock.return_value = ['goldstone-1900.01.01',
                                         'goldstone_metrics-1900.01.01',
                                         'api_stats-1900.01.01',
                                         'events_1900-01-01',
                                         'goldstone-9999.01.01',
                                         'goldstone_metrics-9999.01.01',
                                         'api_stats-9999.01.01',
                                         'events_9999-01-01']
        rv = prune_es_indices()

        self.assertTrue(delete_indices_mock.call_count, 4)
        self.assertItemsEqual(rv,
                              ['goldstone-1900.01.01',
                               'goldstone_metrics-1900.01.01',
                               'api_stats-1900.01.01',
                               'events_1900-01-01'])
        delete_indices_mock.reset_mock()

        # test when only new versions of all indices are present
        get_indices_mock.return_value = ['goldstone-9999.01.01',
                                         'goldstone_metrics-9999.01.01',
                                         'api_stats-9999.01.01',
                                         'events_9999-01-01']
        rv = prune_es_indices()

        self.assertFalse(delete_indices_mock.called)
        self.assertItemsEqual(rv, [])
        delete_indices_mock.reset_mock()

        # test when non-goldstone indices are present
        get_indices_mock.return_value = ['xyz_1900-01-01',
                                         'abc-1900.01.01']
        rv = prune_es_indices()

        self.assertFalse(delete_indices_mock.called)
        self.assertItemsEqual(rv, [])
        delete_indices_mock.reset_mock()

        # test when an exception is raised.  logstash indices are processed
        # before goldstone indices.  an exception is raised for logstash, but
        # goldstone should still be pruned.
        get_indices_mock.return_value = ['goldstone-1900.01.01',
                                         'logstash-1900.01.01']
        delete_indices_mock.side_effect = [Exception, None]

        rv = prune_es_indices()

        self.assertTrue(delete_indices_mock.call_count, 2)
        self.assertTrue(exception_mock.call_count, 1)
        self.assertItemsEqual(rv, ['goldstone-1900.01.01'])


class DailyIndexDocTypeTests(SimpleTestCase):

    class LogMessage(DailyIndexDocType):

        message = String()
        timestamp = Date()

        class Meta:
            doc_type = 'syslog'
            index = 'logstash-*'

    def test_search_wildcard_index(self):
        s = self.LogMessage.search()
        result = s.execute()
        # verify that execute() returns an es_dsl result object
        self.assertIsInstance(result, Response)

    def test_index_today(self):
        import arrow
        date_fmt = self.LogMessage.INDEX_DATE_FMT
        today = arrow.utcnow().format(date_fmt)
        dt = self.LogMessage()
        self.assertEqual(dt._index_today(), 'logstash-' + today)

    def test_lifecycle(self):
        import arrow

        # to avoid worrying about searching the raw field, let's use a
        # lowercase string with no special chars.
        message = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        created = arrow.utcnow().isoformat()

        # instantiate and persist the LogMessage
        lm = self.LogMessage(message=message, created=created)
        result = lm.save()
        # verify that calling save() on es_dsl results in persistence
        self.assertEqual(result, True)

        # force flush the index so our test has a chance to succeed.
        lm._doc_type.using.indices.flush(lm.meta.index)

        # Sadly, the get method does not accept a wildcard index, so you will
        # need to either know which index the document is in, or use the search
        # method to get it back.  When you save an instance, the meta attrs
        # id and index are set, so if it's important information, you may
        # want to persist it in postgres.
        glm = self.LogMessage.get(id=lm.meta.id, index=lm.meta.index)
        # Method 1 : verify that what we obtain by calling a get() with
        # index-filtering is indeed the log-message we persisted earlier
        self.assertEqual(lm.message, glm.message)
        self.assertEqual(lm.created, glm.created)
        self.assertIsInstance(glm, self.LogMessage)

        # so let's try to find it via search.
        s = self.LogMessage.search()
        # filter by the string log-message we used for creating a LogMessage
        # instance. This object was used earlier to create and persist a new
        # log-message in DailyIndexDocType.
        slm = s.filter('term', message=message) \
            .filter('term', created=created) \
            .execute()[0]

        # Method 2 : verify that what we got by searching and filtering
        # by message is indeed the log-message we persisted earlier
        self.assertEqual(lm.message, slm.message)
        self.assertEqual(lm.created, slm.created)
        self.assertIsInstance(slm, self.LogMessage)

        # let's make sure we can delete an object
        result = slm.delete()
        self.assertIsNone(result)

        # force flush the index so our test has a chance to succeed.
        lm._doc_type.using.indices.flush(lm.meta.index)

        # we should not be able to find the record now.
        s = self.LogMessage.search()
        slm2 = s.filter('term', message=message) \
            .filter('term', created=created) \
            .execute()
        self.assertEqual(len(slm2.hits), 0)

    def test_cadf_event(self):
        initiator_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        observer_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        target_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])

        # create a CADF event something like (using .as_dict()):
        # {'action': 'read',
        #  'eventTime': '2015-12-21T18:47:50.275715+0000',
        #  'eventType': 'activity',
        #  'id': '2f38134e-c880-5a38-8b3e-101554a71e37',
        #  'initiatorId': '46e4be801e0b4c2ab373b26dceedce1a',
        #  'name': 'test event',
        #  'observerId': 'a6b012069d174d4fbf9acee03367f068',
        #  'outcome': 'success',
        #  'targetId': '005343040e084c3ba90f7bac1b97e1ae',
        #  'typeURI': 'http://schemas.dmtf.org/cloud/audit/1.0/event'}
        e = event.Event(
            eventType=cadftype.EVENTTYPE_ACTIVITY,
            action=cadftaxonomy.ACTION_READ,
            outcome=cadftaxonomy.OUTCOME_SUCCESS,
            initiatorId=initiator_id,
            targetId=target_id,
            observerId=observer_id,
            name="test event")

        cadf = CADFEventDocType(event=e)

        result = cadf.save()
        self.assertTrue(result)

        # force flush the index so our test has a chance to succeed.
        cadf._doc_type.using.indices.flush(cadf.meta.index)

        ge = CADFEventDocType.get(id=cadf.meta.id, index=cadf.meta.index)
        self.assertEqual(cadf.traits['initiatorId'], ge.traits['initiatorId'])
        self.assertEqual(cadf.traits['eventTime'], ge.traits['eventTime'])
        self.assertIsInstance(ge, CADFEventDocType)

        s = CADFEventDocType.search()
        s = s.filter('term', ** {'traits.initiatorId': initiator_id})\
            .execute()
        self.assertIsInstance(s, Response)
        self.assertEqual(len(s.hits), 1)

        # let's make sure we can delete an object
        result = cadf.delete()
        self.assertIsNone(result)

        # force flush the index so our test has a chance to succeed.
        cadf._doc_type.using.indices.flush(cadf.meta.index)

        # we should not be able to find the record now.
        s2 = CADFEventDocType.search()
        # Alternate form of filter/query expression since we have a nested
        # field.
        r2 = s2.filter('term', ** {'traits.initiatorId': initiator_id})\
            .execute()
        self.assertEqual(len(r2.hits), 0)


class CADFEventDocTypeTests(SimpleTestCase):
    """
        Test CADFEventDocType class for correctness
    """

    @classmethod
    def test_event_save(self):

        initiator_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        observer_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        target_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])

        e = event.Event(
            eventType=cadftype.EVENTTYPE_ACTIVITY,
            action=cadftaxonomy.ACTION_READ,
            outcome=cadftaxonomy.OUTCOME_SUCCESS,
            initiatorId=initiator_id,
            targetId=target_id,
            observerId=observer_id,
            name="test event")

        pyobj = CADFEventDocType(e)
        isinstance(pyobj, CADFEventDocType)
        new_event = event.Event()
        isinstance(new_event, event.Event)
        trait_dict = pyobj._get_traits_dict(new_event)
        isinstance(trait_dict, dict)
        assert('id' in trait_dict['traits'])
        assert('eventTime' in trait_dict['traits'])
        event_saved_flag = pyobj.save(pyobj)
        assert(event_saved_flag)


class SavedSearchModelTests(TestCase):
    """

    Test the
    Test SavedSearch model for :
    1. Given a query-string, build a correct elastic search query object
    2. Given this query object, execute the query against the log indices
    3. Return the rows of results back to caller
    4. Fire an independent elastic search query and compare results with 3.
    """

    fixtures = ['core_initial_data.yaml']

    def test_loaded_data_from_fixtures(self):
        self.assertGreater(SavedSearch.objects.all(), 0)

    def test_predefined_search_func(self):
        owner = 'core'
        sys_defined_searches = SavedSearch.objects.filter(owner=owner)

        for entry in sys_defined_searches:
            search_obj = entry.search()
            self.assertIsInstance(search_obj, elasticsearch_dsl.search.Search)

        for entry in sys_defined_searches:
            search_obj, start, end = entry.search_recent()
            self.assertIsInstance(search_obj, elasticsearch_dsl.search.Search)
            self.assertIsInstance(start, datetime.datetime)
            self.assertIsInstance(end, datetime.datetime)


class CustomExceptionHandlerTests(APISimpleTestCase):
    """Tests for DRF custom exception handling."""

    def test_drf_handled_exception(self):
        """Test that we pass DRF recognized exceptions through unmodified"""

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = "it's handled"
            result = custom_exception_handler(None, None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, "it's handled")

    def test_502_error_exceptions(self):
        """Test ES connection exception is handled"""

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.ConnectionError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 502)

    def test_500_error_exceptions(self):
        """Test ES connection exception is handled"""

        with mock.patch('goldstone.core.utils.exception_handler') \
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

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler('what??', None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, None)
