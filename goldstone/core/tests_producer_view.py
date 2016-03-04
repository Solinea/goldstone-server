"""Unit tests for AlertDefinition views."""

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
import json

from rest_framework import status
from rest_framework.test import APITestCase

from goldstone.core.models import SavedSearch, AlertDefinition, Alert, \
    EmailProducer
from goldstone.test_utils import CONTENT_NO_CREDENTIALS, \
    AUTHORIZATION_PAYLOAD, BAD_TOKEN, CONTENT_BAD_TOKEN, create_and_login

PRODUCER_URL = '/core/producer/'
EMAIL_PRODUCER_URL = '/core/email_producer/'


class ProducerViewTests(APITestCase):
    """ Test Producer API """

    fixtures = ['core_initial_data.yaml']

    def setUp(self):
        self.saved_search = SavedSearch.objects.all()[0]

        self.alert_def = AlertDefinition(name='alert_def',
                                         search=self.saved_search)
        self.alert_def.save()

        self.alert = Alert(short_message='test',
                           long_message='test123',
                           alert_def=self.alert_def)
        self.alert.save()

        self.producer = EmailProducer(sender='me@localhost',
                                      receiver='you@localhost',
                                      alert_def=self.alert_def)
        self.producer.save()

        self.basic_post_body = {
            'sender': 'bell@xyz.com',
            'receiver': 'watson@xyz.com',
            'alert_def': self.alert_def.uuid
        }

    def test_not_logged_in(self):
        """All operations should fail when not logged in."""

        # Try getting resource with no token.
        response = self.client.get(PRODUCER_URL)

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try getting resource a bogus token.
        response = self.client.get(
            PRODUCER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try creating resource with no token.
        response = self.client.post(PRODUCER_URL,
                                    json.dumps(self.basic_post_body),
                                    content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try creating resource with a bogus token.
        response = self.client.post(
            PRODUCER_URL,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try updating resource with no token.
        response = self.client.put(
            PRODUCER_URL + self.alert_def.uuid + '/',
            json.dumps(self.basic_post_body),
            content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try updating resource with a bogus token.
        response = self.client.put(
            PRODUCER_URL + self.alert_def.uuid + '/',
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

    def test_post_not_allowed(self):
        """POST operation tests"""

        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.post(
            PRODUCER_URL,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_get(self):
        """GET operation tests"""

        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # We should have at least one result in our list, but could have more
        response = self.client.get(
            PRODUCER_URL,
            accept="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)
        self.assertIn('count', content)
        self.assertIn('next', content)
        self.assertIn('previous', content)
        self.assertIn('results', content)
        self.assertIsInstance(content['results'], list)
        self.assertGreater(len(content['results']), 0)

        # test the structure of the one we loaded

        response = self.client.get(
            PRODUCER_URL + "%s/" % self.producer.uuid,
            accept="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)
        self.assertIn('uuid', content)
        self.assertIn('alert_def', content)
        self.assertIn('created', content)
        self.assertIn('updated', content)
        self.assertIn('sender', content)
        self.assertIn('receiver', content)

    def test_delete_not_allowed(self):
        """DELETE operation tests"""
        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.delete(
            PRODUCER_URL + '%s/' % self.alert_def.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_not_allowed(self):
        """PUT operation tests"""
        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.put(
            PRODUCER_URL + '%s/' % self.alert_def.uuid,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch_not_allowed(self):
        """PATCH operation tests"""
        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.put(
            PRODUCER_URL + '%s/' % self.alert_def.uuid,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)


class EmailProducerViewTests(APITestCase):
    """ Test Email Producer API """

    fixtures = ['core_initial_data.yaml']

    def setUp(self):
        self.saved_search = SavedSearch.objects.all()[0]

        self.alert_def = AlertDefinition(name='alert_def',
                                         search=self.saved_search)
        self.alert_def.save()

        self.alert = Alert(short_message='test',
                           long_message='test123',
                           alert_def=self.alert_def)
        self.alert.save()

        self.producer = EmailProducer(sender='me', receiver='you',
                                      alert_def=self.alert_def)
        self.producer.save()

        self.basic_post_body = {
            "sender": "bell@localhost",
            "receiver": "watson@localhost",
            "alert_def": self.alert_def.uuid
        }

    def test_not_logged_in(self):
        """All operations should fail when not logged in."""

        # Try getting resource with no token.
        response = self.client.get(EMAIL_PRODUCER_URL)

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try getting resource a bogus token.
        response = self.client.get(
            EMAIL_PRODUCER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try creating resource with no token.
        response = self.client.post(EMAIL_PRODUCER_URL,
                                    json.dumps(self.basic_post_body),
                                    content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try creating resource with a bogus token.
        response = self.client.post(
            EMAIL_PRODUCER_URL,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try updating resource with no token.
        response = self.client.put(
            EMAIL_PRODUCER_URL + self.alert_def.uuid + '/',
            json.dumps(self.basic_post_body),
            content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try updating resource with a bogus token.
        response = self.client.put(
            EMAIL_PRODUCER_URL + self.alert_def.uuid + '/',
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

    def test_crud(self):
        """POST operation tests"""

        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.post(
            EMAIL_PRODUCER_URL,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_201_CREATED)

        # Quick test of a filtered GET of the new resource
        response = self.client.get(
            EMAIL_PRODUCER_URL + "?sender=bell@localhost",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)

        self.assertIn('count', content)
        self.assertIn('next', content)
        self.assertIn('previous', content)
        self.assertIn('results', content)
        self.assertIsInstance(content['results'], list)
        self.assertGreater(len(content['results']), 0)

        self.bell_uuid = content['results'][0]['uuid']

        # test the structure of the record we posted

        response = self.client.get(
            EMAIL_PRODUCER_URL + "%s/" % self.bell_uuid,
            accept="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)
        self.assertIn('uuid', content)
        self.assertIn('alert_def', content)
        self.assertIn('created', content)
        self.assertIn('updated', content)
        self.assertIn('sender', content)
        self.assertIn('receiver', content)
        self.assertEqual(content['sender'], 'bell@localhost')
        self.assertEqual(content['receiver'], 'watson@localhost')
        self.bell_content = content

        put_body = self.bell_content
        put_body['receiver'] = 'howell@localhost'

        # Try updating resource with a valid token.
        response = self.client.put(
            EMAIL_PRODUCER_URL + '%s/' % self.bell_uuid,
            json.dumps(put_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_200_OK)

        # Try patching resource with a valid token.
        response = self.client.patch(
            EMAIL_PRODUCER_URL + '%s/' % self.bell_uuid,
            json.dumps({'receiver': 'watson@localhost'}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_200_OK)

        # Try deleting resource with a valid token.
        response = self.client.delete(
            EMAIL_PRODUCER_URL + '%s/' % self.bell_uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_204_NO_CONTENT)




