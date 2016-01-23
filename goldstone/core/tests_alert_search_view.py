"""Defined search unit tests."""
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

from goldstone.core.models import AlertSearch
from goldstone.core.views import AlertSearchViewSet
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, CONTENT_NO_CREDENTIALS, \
    BAD_TOKEN, BAD_UUID, TEST_USER

SEARCH_URL = "/core/alert_search/"
SEARCH_UUID_URL = SEARCH_URL + "%s/"
SEARCH_UUID_RESULTS_URL = SEARCH_UUID_URL + "results/"


class SearchSetup(Setup):
    """A base test class that simulates the installation fixtures for the
    saved_search tests.

    """

    # load the system saved searches
    fixtures = ['core_initial_data.yaml']


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
            for url in [SEARCH_UUID_URL, SEARCH_UUID_RESULTS_URL]:

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
            for url in [SEARCH_UUID_URL, SEARCH_UUID_RESULTS_URL]:

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

        user = get_user_model().objects.get(username=TEST_USER[0])
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

        # The GET's response should equal the contents of the SavedSearch
        # table's initial data. We verify the result count, the next and
        # previous keys, and each row's keys.  We don't verify the contents
        # of each defined search.
        expected_rows = AlertSearch.objects.all().count()
        print expected_rows
        if expected_rows > 10:
            expected_rows = 10
        expected_keys = ['created', 'name', 'protected', 'query', 'updated',
                         'uuid', 'owner', 'index_prefix', 'doc_type',
                         'timestamp_field', 'last_start', 'last_end',
                         'target_interval']

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
        expected_rows = AlertSearch.objects.all().count()
        if expected_rows > 10:
            expected_rows = 10

        # we are expected to get only 1 row for now, so skip prev-page tests
        #expected_prev = expected_rows - 1

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

    def test_get_uuid(self):
        """Good GET request for one search."""

        # Select one row from the pre-defined searches.
        row = AlertSearch.objects.all()[0]

        token = create_and_login()

        factory = APIRequestFactory()
        view = AlertSearchViewSet.as_view({'get': 'retrieve'})
        request = factory.get(SEARCH_URL,
                              HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        response = view(request, uuid=row.uuid)
        response.render()

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        response_content = json.loads(response.content)

        for key in ['created', 'updated', 'last_start', 'last_end']:
            self.assertIsInstance(response_content[key],
                                  (basestring, NoneType))

        self.assertEqual(row.name, response_content["name"])
        self.assertEqual(row.protected, response_content["protected"])
        self.assertEqual(row.query, response_content["query"])
        self.assertEqual(row.uuid, response_content["uuid"])
        self.assertEqual(row.owner, response_content["owner"])
        self.assertEqual(row.index_prefix, response_content["index_prefix"])
        self.assertEqual(row.doc_type, response_content["doc_type"])
        self.assertEqual(row.timestamp_field,
                         response_content["timestamp_field"])
        self.assertEqual(row.target_interval,
                         response_content["target_interval"])
