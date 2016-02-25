"""Alert views unit tests."""
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

import json
from types import NoneType

from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED
from rest_framework.test import APIRequestFactory, force_authenticate
from django.test import SimpleTestCase, TestCase

from goldstone.core.models import Alert, AlertSearch
from goldstone.core.views import AlertViewSet
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, CONTENT_NO_CREDENTIALS, \
    BAD_TOKEN, BAD_UUID, TEST_USER_1

SEARCH_URL = "/core/alert/"
SEARCH_UUID_URL = SEARCH_URL + "%s/"
SEARCH_UUID_RESULTS_URL = SEARCH_UUID_URL + "results/"


class SearchSetup(Setup):
    """A base test class that simulates the installation fixtures for the
    saved_search tests.

    """

    def create_store_alert_object(self):

        # First create and store an Alert-Search object
        # Second, use that AlertSearch to foreign-key into an Alert

        search_obj = AlertSearch()
        search_obj.save()

        new_alert = Alert(owner='core',
                          created='2015-09-01T13:20:30+03:00',
                          msg_title='Alert : openstack syslog errors',
                          msg_body='There are 23 incidents of syslog errors',
                          query_id=search_obj.pk)
        new_alert.save()


class PermissionsTest(SearchSetup):
    """Test all API permissions."""

    def test_not_logged_in(self):
        """We're not logged in."""

        for method in (self.client.get, self.client.post):
            response = method(SEARCH_URL)

            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        for method in (self.client.get, self.client.put, self.client.patch,
                       self.client.delete):
            for url in [SEARCH_UUID_URL]:

                response = method(url % BAD_UUID)

                self.assertContains(response,
                                    CONTENT_NO_CREDENTIALS,
                                    status_code=HTTP_401_UNAUTHORIZED)

    def test_bad_token(self):
        """We're logged in but present a bogus token."""

        create_and_login()

        for method in (self.client.get, self.client.post):
            response = \
                method(SEARCH_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

            self.assertContains(response,
                                CONTENT_BAD_TOKEN,
                                status_code=HTTP_401_UNAUTHORIZED)

        for method in (self.client.get, self.client.put, self.client.patch,
                       self.client.delete):

            # we dont have a results() or get_by_uuid() for alerts
            for url in [SEARCH_UUID_URL]:
                response = \
                    method(url % BAD_UUID,
                           HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD %
                           BAD_TOKEN)
                self.assertContains(response,
                                    CONTENT_BAD_TOKEN,
                                    status_code=HTTP_401_UNAUTHORIZED)

    def test_normal(self):
        """We're logged in as a normal user.

        This test should pass. Because of how DRF works, we only need to test
        one call (GET) to verify that everything is hooked up correctly.

        """

        # Create a normal user and get the authorization token.
        token = create_and_login()

        response = \
            self.client.get(SEARCH_URL,
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

    def test_get_tenant_admin(self):
        """We're logged in as a tenant admin.

        This test should pass. Because of how DRF works, we only need to test
        one call (GET) to verify that everything is hooked up correctly.

        """
        from django.contrib.auth import get_user_model

        # Create a normal user and get the authorization token. Then force the
        # user to be a tenant admin.
        token = create_and_login()

        user = get_user_model().objects.get(username=TEST_USER_1[0])
        user.tenant_admin = True
        user.save()

        response = \
            self.client.get(SEARCH_URL,
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)


class GetPostTests(SearchSetup):
    """GET and POST to /saved_search/."""

    def test_get(self):
        """Good GET request, one page."""

        # The GET's response should equal the contents of the AlertSearch
        # table's initial data. We verify the result count, the next and
        # previous keys, and each row's keys.  We don't verify the contents
        # of each defined search.

        super(GetPostTests, self).create_store_alert_object()
        expected_rows = Alert.objects.all().count()
        if expected_rows > 10:
            expected_rows = 10

        expected_keys = ['query', 'msg_title', 'msg_body',
                         'created', 'owner']

        token = create_and_login()

        response = self.client.get(
            SEARCH_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        response_content = json.loads(response.content)

        self.assertEqual(expected_rows, response_content["count"])

        self.assertIsNone(response_content["previous"])
        self.assertIsNone(response_content["next"])

        for entry in response_content["results"]:
            for key in expected_keys:
                self.assertIn(key, entry)

    def test_get_pages(self):
        """Good GET request using pages."""

        # We'll ask for the last page of single-entry pages.

        super(GetPostTests, self).create_store_alert_object()
        expected_rows = Alert.objects.all().count()
        if expected_rows > 10:
            expected_rows = 10

        # we are expected to get only 1 row for now, so skip prev-page tests
        # expected_prev = expected_rows - 1

        token = create_and_login()
        response = self.client.get(
            SEARCH_URL + "?page_size=1&page=%d" % expected_rows,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        response_content = json.loads(response.content)

        self.assertEqual(expected_rows, response_content["count"])
        self.assertIsNone(response_content["next"])
        self.assertEqual(1, len(response_content["results"]))
