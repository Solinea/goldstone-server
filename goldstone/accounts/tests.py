"""Account unit tests."""
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
from django.test import Client
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST, HTTP_201_CREATED
from goldstone.user.util_test import Setup, create_and_login

# Http response content that are expected by some tests.
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'
CONTENT_MISSING_PASSWORD = '{"password":["This field is required."]}'
CONTENT_MISSING_USERNAME = '{"username":["This field is required."]}'
CONTENT_MISSING_FIELDS = '{"username":["This field is required."],' \
                         '"password":["This field is required."]}'
CONTENT_UNIQUE_USERNAME = '{"username":["This field must be unique."]}'


# Define the URLs and payloads used in this module's testing.
SETTINGS_URL = "/accounts/settings"
REGISTRATION_URL = "/accounts/register"
AUTHORIZATION_PAYLOAD = "Token %s"


class Settings(Setup):
    """Retrieving and setting account settings."""

    def test_get(self):
        """Get user settings.

        At the moment, there are no settings to test against.

        """

        # Create a user and get the authorization token.
        token = create_and_login()

        client = Client()
        response = \
            client.get(SETTINGS_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, {}, status_code=HTTP_200_OK)

    def test_put(self):
        """Set user settings.

        At the moment, there are no settings to test against.

        """

        # Create a user and get the authorization token.
        token = create_and_login()

        client = Client()
        response = \
            client.put(SETTINGS_URL,
                       json.dumps({}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, {}, status_code=HTTP_200_OK)

    def test_get_badtoken(self):
        """Doing a GET with a bad token."""

        # Create a user, and create a bad authorization token.
        bad_token = create_and_login().replace('9', '8').replace('4', '3')

        client = Client()
        response = \
            client.get(SETTINGS_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_put_badtoken(self):
        """Doing a PUT with a bad token."""

        # Create a user, and create a bad authorization token.  (This test will
        # erroneously fail if the good token doesn't contain any 9 characters,
        # which is very unlikely.)
        bad_token = create_and_login().replace('9', '8')

        client = Client()
        response = \
            client.put(SETTINGS_URL,
                       json.dumps({}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)


class Register(Setup):
    """Account registration tests."""

    def test_no_data(self):
        """Try registering with an empty payload."""

        client = Client()
        response = client.post(REGISTRATION_URL,
                               content_type="application/json")

        self.assertContains(response,
                            CONTENT_MISSING_FIELDS,
                            status_code=HTTP_400_BAD_REQUEST)

        self.assertEqual(get_user_model().objects.count(), 0)

    def test_no_username(self):
        """Try registering with no username."""

        client = Client()
        response = client.post(REGISTRATION_URL,
                               json.dumps({"password": "Diggler"}),
                               content_type="application/json")

        self.assertContains(response,
                            CONTENT_MISSING_USERNAME,
                            status_code=HTTP_400_BAD_REQUEST)

        self.assertEqual(get_user_model().objects.count(), 0)

    def test_no_password(self):
        """Try registering with no password."""

        client = Client()
        response = client.post(REGISTRATION_URL,
                               json.dumps({"username": "Dirk"}),
                               content_type="application/json")

        self.assertContains(response,
                            CONTENT_MISSING_PASSWORD,
                            status_code=HTTP_400_BAD_REQUEST)

        self.assertEqual(get_user_model().objects.count(), 0)

    def test_duplicate_name(self):
        """Try registering with a duplicate name."""

        USERS = ["Bahb", "Barbra"]

        # Register a couple of users.
        client = Client()

        for user in USERS:
            response = \
                client.post(REGISTRATION_URL,
                            json.dumps({"username": user, "password": "x"}),
                            content_type="application/json")

            self.assertEqual(response.status_code, HTTP_201_CREATED)

        self.assertEqual(get_user_model().objects.count(), 2)

        # Now try to re-register one of the accounts.
        response = \
            client.post(REGISTRATION_URL,
                        json.dumps({"username": USERS[0], "password": "x"}),
                        content_type="application/json")

        self.assertContains(response,
                            CONTENT_UNIQUE_USERNAME,
                            status_code=HTTP_400_BAD_REQUEST)

        self.assertEqual(get_user_model().objects.count(), 2)

    def test_post(self, email=None):
        """Register a user.

        :keyword email: An e-mail address to use when registering the user
        :type email: str or None

        """

        USERNAME = "Debra"

        # Assemble the registration payload
        payload = {"username": USERNAME, "password": "x"}
        if email:
            payload["email"] = email

        # Register this account.
        client = Client()
        response = \
            client.post(REGISTRATION_URL,
                        json.dumps(payload),
                        content_type="application/json")

        # Check the results.
        self.assertEqual(response.status_code, HTTP_201_CREATED)

        response_content = json.loads(response.content)
        self.assertEqual(response_content["username"], USERNAME)
        self.assertIsInstance(response_content["auth_token"], basestring)
        self.assertEquals(len(response_content), 3)
        self.assertEqual(response_content["email"], email if email else '')

        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(get_user_model().objects.all()[0].username,
                         USERNAME)

    def test_post_with_email(self):
        """Register a user, with an email address."""

        self.test_post("dirk@diggler.com")
