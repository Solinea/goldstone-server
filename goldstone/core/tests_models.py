"""Unit tests for SavedSearches, AlertDefinitions, Alerts, and Producers."""

# Copyright 2016 Solinea, Inc.
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
from datetime import datetime
from smtplib import SMTPException

import arrow
from django.test import TestCase
from elasticsearch_dsl import Search
from mock import patch, Mock, MagicMock
from rest_framework.test import APITestCase

from goldstone.core.models import SavedSearch, AlertDefinition, \
    EmailProducer, Alert


class ModelTests(TestCase):
    """ Test EmailProducer class model"""

    fixtures = ['core_initial_data.yaml']

    def setUp(self):

        self.saved_search = SavedSearch.objects.all()[0]

        self.alert_def = AlertDefinition(name='alert_def',
                                         search=self.saved_search)
        self.alert_def.save()

        self.producer = EmailProducer(sender='goldstone',
                                      receiver='someone-else',
                                      alert_def=self.alert_def)
        self.producer.save()

        self.alert = Alert(short_message='test', long_message='test123',
                           alert_def=self.alert_def)
        self.alert.save()

    def assertWithinASecond(self, datetime1, datetime2):
        ts1 = arrow.get(datetime1).timestamp / 1000.0
        ts2 = arrow.get(datetime2).timestamp / 1000.0
        self.assertAlmostEqual(ts1, ts2, places=0)

    def test_producer_superclass_raises(self):
        """ Calling send on the Producer superclass should raise an exception
        """

        with self.assertRaises(NotImplementedError):
            super(EmailProducer, self.producer).produce(self.alert)

    # @patch("django.core.mail.send_mail")
    @patch('goldstone.core.models.send_mail')
    def test_producer_produce(self, mock_send_mail):
        """ The return value from send_mail will be the number of successfully
        delivered messages (which can be 0 or 1 since it can only send one
        message).  It could also raise a SMTPException.

        Produce should just pass those through to the caller.
        """

        mock_send_mail.return_value = 1
        rv = self.producer.produce(self.alert)
        self.assertEqual(mock_send_mail.call_count, 1)
        self.assertEqual(rv, 1)

        mock_send_mail.return_value = 0
        rv = self.producer.produce(self.alert)
        self.assertEqual(mock_send_mail.call_count, 2)
        self.assertEqual(rv, 0)

        mock_send_mail.side_effect = SMTPException
        with self.assertRaises(SMTPException):
            self.producer.produce(self.alert)
            self.assertEqual(mock_send_mail.call_count, 3)

    def test_search(self):
        """The search method of a SavedSearch should return an ES search"""

        search = self.saved_search.search()
        self.assertIsInstance(search, Search)

    def test_search_recent(self):
        """The search_recent method of a SavedSearch should return an ES search
        a start datetime, and an end datetime.  The initial start datetime
        should be roughly the creation time of the object, and the initial end
        datetime should be roughly the creation time of the object.

        After a call to update_recent_search_window, the last_start and
        last_end dates should be adjusted to reflect the previous search_recent
        call.

        The search will a range clause on the SavedSearch.timestamp_field with
        a start of the last_end and an end of approximately now.

        Finally, if the SavedSearch.timestamp_field is None a search that is
        the same as the result of search() will be returned along with Nones
        for start and end.
        """

        #
        # first pass we should have initialized start/end times
        #
        search, start1, end1 = self.saved_search.search_recent()
        self.assertIsInstance(search, Search)
        self.assertIsInstance(start1, datetime)
        self.assertIsInstance(end1, datetime)
        self.assertWithinASecond(start1, end1)
        self.assertNotEqual(search._doc_type, [])

        def find_range_dict(a, z):
            """Helper function that extracts the dict with range key."""
            if 'range' in z \
                    and self.saved_search.timestamp_field in z['range']:
                return z
            else:
                return a

        range_dict = reduce(lambda a, z: find_range_dict(a, z),
                            search.to_dict()['query']['bool']['must'],
                            None)

        # validate that the range block was added to the search
        self.assertIsNotNone(range_dict)

        # and that it has the expected start and end times
        self.assertDictContainsSubset(
            {'gte': start1.isoformat()},
            range_dict['range'][self.saved_search.timestamp_field])
        self.assertDictContainsSubset(
            {'lt': end1.isoformat()},
            range_dict['range'][self.saved_search.timestamp_field])

        self.saved_search.update_recent_search_window(start1, end1)

        #
        # let's get the persisted version of our object and test that
        # update_recent_search_window updated the last_start and last_end
        # fields of the object.
        #
        self.saved_search = SavedSearch.objects.get(
            uuid=self.saved_search.uuid)

        self.assertEqual(self.saved_search.last_start, start1)
        self.assertEqual(self.saved_search.last_end, end1)

        #
        # finally, let's run recent_search again and make sure we get updated
        # times.
        #
        search, start2, end2 = self.saved_search.search_recent()
        self.assertIsInstance(start2, datetime)
        self.assertIsInstance(end2, datetime)
        self.assertTrue(start2 == end1)
        self.assertTrue(start2 <= end2)

        range_dict = reduce(lambda a, z: find_range_dict(a, z),
                            search.to_dict()['query']['bool']['must'],
                            None)

        # validate that the range block was added to the search
        self.assertIsNotNone(range_dict)

        # and that it has the expected start and end times
        self.assertDictContainsSubset(
            {'gte': start2.isoformat()},
            range_dict['range'][self.saved_search.timestamp_field])
        self.assertDictContainsSubset(
            {'lt': end2.isoformat()},
            range_dict['range'][self.saved_search.timestamp_field])

        # doctype should not be set in the search if the SavedSearch doesn't
        # have one, and the result of search_recent() should be the same as
        # that of search() if there is no timestamp_field set.
        self.saved_search.timestamp_field = None
        self.saved_search.doc_type = None

        search = self.saved_search.search()
        search_recent = self.saved_search.search_recent()
        self.assertDictEqual(search.to_dict(), search_recent.to_dict())
        self.assertEqual(search._doc_type, [])

    @patch('goldstone.core.models.Alert')
    def test_alert_def_evaluate(self, mock_alert):
        """tests that alert definitions properly create alerts, and produce
        notifications."""

        # mock out a search_result to trigger the alert condition
        hit_count = 99
        search, start, end = self.saved_search.search_recent()
        search_result = {'hits': {'total': hit_count}}
        self.alert_def.evaluate(search_result, start, end)
        self.assertTrue(mock_alert.called)

        # should be called with *args and **kwargs
        self.assertEqual(len(mock_alert.call_args), 2)

        # interested in kwargs
        expected_short = 'Alert: \'%s\' triggered at %s' % \
            (self.alert_def.name, end)

        expected_long = 'There were %d instances of \'%s\' from ' \
                        '%s to %s.\nAlert Definition: %s' % \
                        (hit_count, self.alert_def.name,
                         start, end, self.alert_def.uuid)

        self.assertIs(mock_alert.call_args[1]['alert_def'], self.alert_def)
        self.assertEqual(mock_alert.call_args[1]['short_message'],
                         expected_short)
        self.assertEqual(mock_alert.call_args[1]['long_message'],
                         expected_long)
