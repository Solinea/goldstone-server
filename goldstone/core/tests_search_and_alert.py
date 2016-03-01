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
from smtplib import SMTPException

from django.test import TestCase
from mock import patch

from goldstone.core.models import SavedSearch, AlertDefinition, EmailProducer, \
    Alert


class ProducerModelTests(TestCase):
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

    def test_superclass_raises(self):
        """ Calling send on the Producer superclass should raise an exception
        """

        with self.assertRaises(NotImplementedError):
            super(EmailProducer, self.producer).produce(self.alert)

    # @patch("django.core.mail.send_mail")
    @patch('goldstone.core.models.send_mail')
    def test_produce(self, mock_send_mail):
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
