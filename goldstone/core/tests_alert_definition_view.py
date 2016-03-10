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

from goldstone.core.models import SavedSearch, AlertDefinition, Alert
from goldstone.test_utils import CONTENT_NO_CREDENTIALS, \
    AUTHORIZATION_PAYLOAD, BAD_TOKEN, CONTENT_BAD_TOKEN, create_and_login

ALERT_DEF_URL = '/core/alert_definition/'


class AlertDefinitionViewTests(APITestCase):
    """ Test AlertDefitions API """

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

        self.basic_post_body = {
            'name': 'basic test test alert def',
            'search': SavedSearch.objects.all()[0].uuid
        }

    def test_not_logged_in(self):
        """All operations should fail when not logged in."""

        # Try getting resource with no token.
        response = self.client.get(ALERT_DEF_URL)

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try getting resource a bogus token.
        response = self.client.get(
            ALERT_DEF_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try creating resource with no token.
        response = self.client.post(ALERT_DEF_URL,
                                    json.dumps(self.basic_post_body),
                                    content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try creating resource with a bogus token.
        response = self.client.post(
            ALERT_DEF_URL,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try updating resource with no token.
        response = self.client.put(
            ALERT_DEF_URL + self.alert_def.uuid + '/',
            json.dumps(self.basic_post_body),
            content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=status.HTTP_401_UNAUTHORIZED)

        # Try updating resource with a bogus token.
        response = self.client.put(
            ALERT_DEF_URL + self.alert_def.uuid + '/',
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
            ALERT_DEF_URL,
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
            ALERT_DEF_URL,
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
            ALERT_DEF_URL + "%s/" % self.alert_def.uuid,
            accept="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)
        self.assertIn('uuid', content)
        self.assertIn('name', content)
        self.assertIn('description', content)
        self.assertIn('search', content)
        self.assertIn('created', content)
        self.assertIn('updated', content)
        self.assertIn('enabled', content)
        self.assertIn('short_template', content)
        self.assertIn('long_template', content)

    def test_delete_not_allowed(self):
        """DELETE operation tests"""
        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.delete(
            ALERT_DEF_URL + '%s/' % self.alert_def.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_not_allowed(self):
        """PUT operation tests"""
        # Create a user and get the authorization token. Then do the test.
        token = create_and_login()

        # Try creating resource with a valid token.
        response = self.client.put(
            ALERT_DEF_URL + '%s/' % self.alert_def.uuid,
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
            ALERT_DEF_URL + '%s/' % self.alert_def.uuid,
            json.dumps(self.basic_post_body),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)
