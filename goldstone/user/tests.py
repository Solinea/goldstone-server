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
import json
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, Client
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED

# Http response content that are expected by some tests.
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'

# Define the URLs and payloads used in this module's testing.
LOGIN_URL = "/accounts/login"
USER_URL = "/user"
AUTHORIZATION_PAYLOAD = "Token %s"


def _create_and_login():
    """Create a user and log them in.

    :return: The authorization token's value
    :rtype: str

    """

    # Create a user
    get_user_model().objects.create_user("fred", "fred@fred.com", "meh")

    # Log the user in, and return the auth token's value.
    client = Client()
    response = client.post(LOGIN_URL, {"username": "fred", "password": "meh"})

    assert response.status_code == HTTP_200_OK

    return response.data["auth_token"]      # pylint: disable=E1101


class NoAccess(SimpleTestCase):
    """The user attempts access without being logged in, or presenting a bad
    authentication token."""

    def setUp(self):
        """Do some housekeeping before each test."""

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

        # Create a user, and create a bad authorization token.  (This test will
        # erroneously fail if the good token doesn't contain any 9 characters,
        # which is very unlikely.)
        bad_token = _create_and_login().replace('9', '8')

        client = Client()
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

        # Create a user, and create a bad authorization token.
        bad_token = _create_and_login().replace('9', '8')

        client = Client()
        response = \
            client.put(USER_URL,
                       {"first_name": "Dirk"},
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_401_UNAUTHORIZED)


class Get(SimpleTestCase):
    """The user gets her account's User data."""

    def setUp(self):
        """Do some housekeeping before each test."""

        # SimpleTestCase doesn't always reset the database to as much of an
        # initial state as we expect. So, do it explicitly.
        get_user_model().objects.all().delete()

    def test_get(self):
        """Get data from the default created account."""

        expected_content = {"username": "fred",
                            "first_name": '',
                            "last_name": '',
                            "email": "fred@fred.com",
                            "tenant_admin": False,
                            "default_tenant_admin": False}

        # Create a user and get their authorization token.
        token = _create_and_login()

        client = Client()
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_200_OK)

        # We deserialize the response content, to simplify checking the
        # results. We'll check that the uuid key is present, and it has a
        # string value, but we don't check the value.
        response_content = json.loads(response.content)
        for key in expected_content:
            self.assertEqual(response_content[key], expected_content[key])
        self.assertEqual(len(response_content), len(expected_content) + 1)
        self.assertIn("uuid", response_content)
        self.assertIsInstance(response_content["uuid"], basestring)

    def test_get_changed_fields(self):
        """Get data from the created account, after we've modified it."""

        pass


# class Put(SimpleTestCase):
#     pass


# class BadPut(SimpleTestCase):
#     pass
