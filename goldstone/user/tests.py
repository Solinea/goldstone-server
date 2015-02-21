"""Custom User model tests."""
# Copyright 2015 Solinea, Inc.
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
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, Client
from rest_framework.status import *

from goldstone.user.models import User

# Http response content that is expected by the tests.
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'

# Define the URLs and payloads used in this module's testing.
LOGIN_URL = "/accounts/login"
USER_URL = "/user"
AUTHORIZATION_PAYLOAD = "Token %s"


class NoAccess(SimpleTestCase):
    """The user attempts access without being logged in, or presenting a bad
    authentication token."""

    def setUp(self):
        """Perform some housekeeping before each test."""

        # SimpleTestCase doesn't always reset the database to as much of an
        # initial state as we expect. So, do it explicitly.
        get_user_model().objects.all().delete()

    def test_get_nologin(self):
        """Getting while not logged in."""

        EXPECTED_CONTENT = CONTENT_NO_CREDENTIALS

        client = Client()
        response = client.get(USER_URL)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_get_badtoken(self):
        """Getting while not logged in, using any token."""

        BAD_TOKEN = "2f7306baced9dddd2c50071d25c6d7f2a46cbfd7"
        EXPECTED_CONTENT = CONTENT_BAD_TOKEN

        client = Client()
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_loggedin_get_badtoken(self):
        """Getting while logged in, using a bad token."""

        EXPECTED_CONTENT = CONTENT_BAD_TOKEN

        # Create a user
        user = get_user_model().objects.create_user("fred",
                                                    "fred@fred.com",
                                                    "fredspassword")

        # Log the user in, and create a bad token be changing some
        # characters. (This test will erroneously fail if the good token
        # doesn't contain any 9 characters, which is very unlikely.)
        client = Client()
        response = client.post(LOGIN_URL,
                               {"username": "fred",
                                "password": "fredspassword"})
        self.assertEqual(response.status_code, HTTP_200_OK)

        bad_token = response.data["auth_token"].replace('9', '8')

        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_put_nologin(self):
        """Putting (trying to change user attributes) while not logged in."""

        EXPECTED_CONTENT = CONTENT_NO_CREDENTIALS

        client = Client()
        response = client.put(USER_URL, {"first_name": "Dirk"})

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_put_badtoken(self):
        """Putting (trying to change user attributes) while logged in, but
        using a bad token."""

        EXPECTED_CONTENT = CONTENT_BAD_TOKEN

        # Create a user
        user = get_user_model().objects.create_user("fred",
                                                    "fred@fred.com",
                                                    "fredspassword")

        # Log the user in, and create a bad token be changing some
        # characters. (This test will erroneously fail if the good token
        # doesn't contain any 9 characters, which is very unlikely.)
        client = Client()
        response = client.post(LOGIN_URL,
                               {"username": "fred",
                                "password": "fredspassword"})
        self.assertEqual(response.status_code, HTTP_200_OK)

        bad_token = response.data["auth_token"].replace('9', '8')

        response = \
            client.put(USER_URL,
                       {"first_name": "Dirk"},
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_401_UNAUTHORIZED)


# class Get(SimpleTestCase):
#     pass


# class Put(SimpleTestCase):
#     pass


# class BadPut(SimpleTestCase):
#     pass
