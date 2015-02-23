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
from django.test import Client
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST
from .util_test import create_and_login, Setup

# Http response content that are expected by some tests.
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'
CONTENT_MISSING_FIELD = '{"username":["This field is required."]}'

# Define the URLs and payloads used in this module's testing.
LOGIN_URL = "/accounts/login"
USER_URL = "/user"
AUTHORIZATION_PAYLOAD = "Token %s"
TEST_USER = ("fred", "fred@fred.com", "meh")
TEST_USER_LOGIN = {"username": TEST_USER[0], "password": TEST_USER[2]}


def _response_equals_without_uuid(response, expected_status_code,
                                  expected_content):
    """Compare a response's content with expected content, without fully
    testing the "uuid" key.

    This module's tests can't always just do a self.assertContains, or use
    self.assertEqual, because the response contains a "uuid" key. We want to
    test that the uuid key is present and its value is a string, without
    comparing the uuid strings.

    :param response: The HTTP response to be tested
    :type response: django.test.client.Response
    :param expected_status_code: The expected status code
    :type expected_status_code: rest_framework.status.HTTP*
    :param expected_content: The expected response.content
    :type expected_content: dict

    """

    assert response.status_code == expected_status_code

    # We deserialize the response content, to simplify checking the
    # results
    response_content = json.loads(response.content)

    # Check that every expected key is in the response, and the content lengths
    # differ by only one.
    for key in expected_content:
        assert response_content[key] == expected_content[key]

    assert len(response_content) == len(expected_content) + 1

    # Verify that the uuid key is present and its value is a string, but
    # don't check the value's content.
    assert "uuid" in response_content
    assert isinstance(response_content["uuid"], basestring)


class NoAccess(Setup):
    """The user attempts access without being logged in, or presenting a bad
    authentication token."""

    def test_get_nologin(self):
        """Getting while not logged in."""

        client = Client()
        response = client.get(USER_URL)

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_get_badtoken(self):
        """Getting while not logged in, using any token."""

        BAD_TOKEN = "2f7306baced9dddd2c50071d25c6d7f2a46cbfd7"

        client = Client()
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_loggedin_get_badtoken(self):
        """Getting while logged in, using a bad token."""

        # Create a user, and create a bad authorization token.  (This test will
        # erroneously fail if the good token doesn't contain any 9 characters,
        # which is very unlikely.)
        bad_token = create_and_login().replace('9', '8')

        client = Client()
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_put_nologin(self):
        """Putting (trying to change user attributes) while not logged in."""

        client = Client()
        response = client.put(USER_URL,
                              json.dumps({"first_name": "Dirk"}),
                              content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=HTTP_401_UNAUTHORIZED)


class BadPut(Setup):
    """Bad PUT requests to change account attributes."""

    def test_put_badtoken(self):
        """Putting (trying to change user attributes) while logged in, but
        using a bad token."""

        # Create a user, and create a bad authorization token.
        bad_token = create_and_login().replace('9', '8')

        client = Client()
        response = \
            client.put(USER_URL,
                       json.dumps({"first_name": "Dirk"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_no_username(self):
        """Try changing account attributes with a good token, but a bad
        username."""

        # Create a user and get the authorization token.
        token = create_and_login()

        client = Client()
        response = \
            client.put(USER_URL,
                       json.dumps({"first_name": "Dirk"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_MISSING_FIELD,
                            status_code=HTTP_400_BAD_REQUEST)


class GetPut(Setup):
    """The user gets her account's User data, and changes some attributes."""

    def test_get(self):                   # pylint: disable=R0201
        """Get data from the default created account."""

        expected_content = {"username": TEST_USER[0],
                            "first_name": '',
                            "last_name": '',
                            "email": TEST_USER[1],
                            "tenant_admin": False,
                            "default_tenant_admin": False}

        # Create a user and get their authorization token.
        token = create_and_login()

        client = Client()
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        _response_equals_without_uuid(response, HTTP_200_OK, expected_content)

    def test_change_one_field(self):
        """Change one field in the account."""

        expected_content = {"username": TEST_USER[0],
                            "first_name": "Dirk",
                            "last_name": '',
                            "email": TEST_USER[1],
                            "tenant_admin": False,
                            "default_tenant_admin": False}

        # Create a user and get their authorization token.
        token = create_and_login()

        # Change some attributes from the default. Note, the username is
        # required by djoser UserView/PUT.
        client = Client()
        response = \
            client.put(USER_URL,
                       json.dumps({"username": TEST_USER[0],
                                   "first_name": "Dirk"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        _response_equals_without_uuid(response, HTTP_200_OK, expected_content)

    def test_change_some_fields(self):
        """Get data from an account, after we've modified some fields."""

        expected_content = {"username": TEST_USER[0],
                            "first_name": "Dirk",
                            "last_name": "Diggler",
                            "email": TEST_USER[1],
                            "tenant_admin": False,
                            "default_tenant_admin": False}

        # Create a user and get their authorization token.
        token = create_and_login()

        # Change some attributes from the default. Note, the username is
        # required by djoser UserView/PUT.
        client = Client()
        response = \
            client.put(USER_URL,
                       json.dumps({"username": TEST_USER[0],
                                   "first_name": "Dirk",
                                   "last_name": "Diggler"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        _response_equals_without_uuid(response, HTTP_200_OK, expected_content)

    def test_change_all_fields(self):
        """Get data from an account, after we've modified all the
        user-modifiable fields."""

        expected_content = {"username": "Heywood",
                            "first_name": "Dirk",
                            "last_name": "Diggler",
                            "email": "john@siberia.com",
                            "tenant_admin": False,
                            "default_tenant_admin": False}

        # Create a user and get their authorization token.
        token = create_and_login()

        # Change some attributes from the default. Note, the username is
        # required by djoser UserView/PUT.
        client = Client()
        response = \
            client.put(USER_URL,
                       json.dumps({"username": "Heywood",
                                   "first_name": "Dirk",
                                   "last_name": "Diggler",
                                   "email": "john@siberia.com"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = \
            client.get(USER_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        _response_equals_without_uuid(response, HTTP_200_OK, expected_content)
