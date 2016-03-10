"""Account unit tests."""
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
from django.contrib.auth import get_user_model
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST, HTTP_201_CREATED
from goldstone.test_utils import Setup, create_and_login, login, \
    AUTHORIZATION_PAYLOAD, CONTENT_MISSING_USERNAME, CONTENT_BAD_TOKEN, \
    CONTENT_NO_CREDENTIALS, CONTENT_NON_FIELD_ERRORS, LOGIN_URL, USER_URL, \
    TEST_USER_1, BAD_TOKEN

# Http response content.
CONTENT_MISSING_PASSWORD = '"password":["This field is required."]'
CONTENT_UNIQUE_USERNAME = 'A user with that username already exists.'


# URLs used by this module.
REGISTRATION_URL = "/accounts/register/"
LOGOUT_URL = "/accounts/logout/"
PASSWORD_URL = "/accounts/password/"
PASSWORD_RESET_URL = PASSWORD_URL + "reset/"


class Register(Setup):
    """Account registration tests."""

    def test_no_data(self):
        """Try registering with an empty payload."""

        response = self.client.post(REGISTRATION_URL,
                                    content_type="application/json")

        # We should have received errors for a blank username and blank
        # password. Depending on the Python version, they may be returned in
        # either order. Since assertContains compares strings, we will check
        # for these errors separately, so we don't get a spurious miscompare.
        self.assertContains(response,
                            CONTENT_MISSING_USERNAME,
                            status_code=HTTP_400_BAD_REQUEST)
        self.assertContains(response,
                            CONTENT_MISSING_PASSWORD,
                            status_code=HTTP_400_BAD_REQUEST)

        self.assertEqual(get_user_model().objects.count(), 0)

    def test_no_username(self):
        """Try registering with no username."""

        response = self.client.post(REGISTRATION_URL,
                                    json.dumps({"password": "Diggler"}),
                                    content_type="application/json")

        self.assertContains(response,
                            CONTENT_MISSING_USERNAME,
                            status_code=HTTP_400_BAD_REQUEST)

        self.assertEqual(get_user_model().objects.count(), 0)

    def test_no_password(self):
        """Try registering with no password."""

        response = self.client.post(REGISTRATION_URL,
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

        for user in USERS:
            response = self.client.post(
                REGISTRATION_URL,
                json.dumps({"username": user, "password": "x"}),
                content_type="application/json")

            # pylint: disable=E1101
            self.assertEqual(response.status_code, HTTP_201_CREATED)

        self.assertEqual(get_user_model().objects.count(), 2)

        # Now try to re-register one of the accounts.
        response = self.client.post(
            REGISTRATION_URL,
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

        USERNAME = "user1"

        # Assemble the registration payload
        payload = {"username": USERNAME, "password": "x"}
        if email:
            payload["email"] = email

        # Register this account.
        response = self.client.post(REGISTRATION_URL,
                                    json.dumps(payload),
                                    content_type="application/json")

        # Check the results.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_201_CREATED)

        response_content = json.loads(response.content)
        self.assertEqual(response_content["username"], USERNAME)
        self.assertIsInstance(response_content["auth_token"], basestring)
        self.assertEqual(response_content["email"], email if email else '')
        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(get_user_model().objects.all()[0].username,
                         USERNAME)

    def test_post_with_email(self):
        """Register a user, with an email address."""

        self.test_post("donotreply@dontdoit.xyz")


class Login(Setup):
    """Logging in."""

    def test_bad_username(self):
        """Logging in with a bad username."""

        # Create a user
        get_user_model().objects.create_user(*TEST_USER_1)

        # Try logging in with a bad username.
        response = self.client.post(LOGIN_URL,
                                    {"username": "Atticus",
                                     "password": TEST_USER_1[2]})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_bad_password(self):
        """Logging in with a bad password."""

        # Create a user
        get_user_model().objects.create_user(*TEST_USER_1)

        # Try logging in with a bad username.
        response = self.client.post(LOGIN_URL,
                                    {"username": TEST_USER_1[0],
                                     "password": "Finch"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_login(self):      # pylint: disable=R0201
        """Logging in."""

        create_and_login()

    def test_login_already_logged_in(self):        # pylint: disable=R0201
        """Logging in when the user is already logged in.

        The user should remain logged in.

        """

        create_and_login()
        login(TEST_USER_1[0], TEST_USER_1[2])

    def test_login_another_logged_in(self):        # pylint: disable=R0201
        """Logging in when another user is logged in.

        The second user should be logged in normally.

        """

        # Create user 1 and user 2. User 2 is just user 1 with the username and
        # password swapped.
        create_and_login()
        get_user_model().objects.create_user(TEST_USER_1[2],
                                             TEST_USER_1[1],
                                             TEST_USER_1[0])

        # Login user 1, then login user 2.
        login(TEST_USER_1[0], TEST_USER_1[2])
        login(TEST_USER_1[2], TEST_USER_1[0])


class Logout(Setup):
    """Logging out."""

    def test_not_logged_in_no_creds(self):
        """Logging out when a user is not logged in, and not giving any
        credentials."""

        response = self.client.post(LOGOUT_URL)

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_not_logged_in(self):
        """Logging out when a user is not logged in, with username and
        password."""

        token = create_and_login()

        # Logout. Then logout again with username and password.
        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_200_OK)

        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_logout_with_username(self):
        """Log out, using a username and password for authentication.

        This should fail.

        """

        create_and_login()

        response = self.client.post(
            LOGOUT_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "password": TEST_USER_1[2]}),
            content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_logout_with_token(self):
        """Log out, using an authorization token."""

        token = create_and_login()

        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_200_OK)

        # Ensure we no longer have access to Goldstone.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)


class Password(Setup):
    """Test changing the user password."""

    def test_not_logged_in(self):
        """The user isn't logged in.

        The user shouldn't be able to change their password.

        """

        # Create a user and log them out.
        token = create_and_login()
        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_200_OK)

        # Now try changing the password.
        response = self.client.post(
            PASSWORD_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "current_password": TEST_USER_1[2],
                        "new_password": "boom"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

        # Verify that we can't log in using the NEW password.
        response = self.client.post(LOGIN_URL,
                                    {"username": TEST_USER_1[0],
                                     "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

        # We should be able to still log in using the old password.
        login(TEST_USER_1[0], TEST_USER_1[2])

    def test_missing_token(self):
        """The change password request doesn't have an authentication token."""

        # Create a user and log them in.
        create_and_login()

        # Try changing the password.
        response = \
            self.client.post(PASSWORD_URL,
                             json.dumps({"username": TEST_USER_1[0],
                                         "current_password": TEST_USER_1[2],
                                         "new_password": "boom"}),
                             content_type="application/json")

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)

        # Test logging in using the old password.
        login(TEST_USER_1[0], TEST_USER_1[2])

        # Verify that we can't log in using the new password.
        response = self.client.post(
            LOGIN_URL,
            {"username": TEST_USER_1[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_bad_token(self):
        """The change password request has a bad authentication token."""

        # Create a user and log them in.
        create_and_login()

        # Try changing the password.
        response = \
            self.client.post(
                PASSWORD_URL,
                json.dumps({"username": TEST_USER_1[0],
                            "current_password": TEST_USER_1[2],
                            "new_password": "boom"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)

        # Test logging in using the old password.
        login(TEST_USER_1[0], TEST_USER_1[2])

        # Verify that we can't log in using the new password.
        response = self.client.post(LOGIN_URL,
                                    {"username": TEST_USER_1[0],
                                     "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_no_current_password(self):
        """The change password request doesn't have a current password."""

        # Create a user and log them in.
        token = create_and_login()

        # Try changing the password.
        response = self.client.post(
            PASSWORD_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "new_password": "boom"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test logging in using the old password.
        login(TEST_USER_1[0], TEST_USER_1[2])

        # Verify that we can't log in using the new password.
        response = self.client.post(
            LOGIN_URL,
            {"username": TEST_USER_1[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_bad_current_password(self):
        """The change password request has a bad current password."""

        # Create a user and log them in.
        token = create_and_login()

        # Try changing the password.
        response = self.client.post(
            PASSWORD_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "current_password": "rockmeamadeus",
                        "new_password": "boom"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test logging in using the old password.
        login(TEST_USER_1[0], TEST_USER_1[2])

        # Verify that we can't log in using the new password.
        response = self.client.post(
            LOGIN_URL,
            {"username": TEST_USER_1[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_no_new_password(self):
        """The change password request doesn't have a new password."""

        # Create a user and log them in.
        token = create_and_login()

        # Try changing the password.
        response = self.client.post(
            PASSWORD_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "current_password": TEST_USER_1[2]}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test logging in using the old password.
        login(TEST_USER_1[0], TEST_USER_1[2])

    def test_change_password(self):
        """Change the current user's password."""

        # Create a user.
        token = create_and_login()

        # Try changing the password.
        response = self.client.post(
            PASSWORD_URL,
            json.dumps({"current_password": TEST_USER_1[2],
                        "new_password": "boom"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test logging in using the new password.
        login(TEST_USER_1[0], "boom")

        # Verify that we can't log in using the old password.
        response = self.client.post(LOGIN_URL,
                                    {"username": TEST_USER_1[0],
                                     "password": TEST_USER_1[2]})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)


class PasswordReset(Setup):
    """Test resetting the user password."""

    def _check_response(self, response, send_email):
        """A simple response checker for this test class."""
        from django.conf import settings

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test that send_email was called only once, and check some of the
        # arguments it was called with.
        self.assertEqual(send_email.call_count, 1)
        self.assertEqual(send_email.call_args[0][0], TEST_USER_1[1])  # email
        self.assertEqual(send_email.call_args[0][1],
                         "webmaster@localhost")  # from
        self.assertEqual(send_email.call_args[0][2]["site_name"],
                         settings.DJOSER["SITE_NAME"])  # The site name
        self.assertIn('password/confirm/?uid=',
                      send_email.call_args[0][2]["url"])  # The confirm url

        # A simple check that the confirmation URL is about the right length.
        self.assertGreater(len(send_email.call_args[0][2]["url"]),
                           len(settings.DJOSER["PASSWORD_RESET_CONFIRM_URL"]) +
                           11)
        self.assertEqual(send_email.call_args[0][2]["user"].username,
                         TEST_USER_1[0])  # username

    @patch("djoser.utils.send_email")
    def test_not_logged_in(self, send_email):
        """The user isn't logged in.

        The user should be able to generated a reset-password email. No
        authentication token is needed.

        """

        # Create a user and log them out.
        token = create_and_login()
        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        self.assertContains(response, '', status_code=HTTP_200_OK)

        # Now try resetting the password.
        response = \
            self.client.post(PASSWORD_RESET_URL,
                             json.dumps({"email": TEST_USER_1[1]}),
                             content_type="application/json")

        self._check_response(response, send_email)

    @patch("djoser.utils.send_email")
    def test_logged_in(self, send_email):
        """The user is logged in.

        No authentication token is needed.

        """

        # Create a user
        create_and_login()

        # Try resetting the password.
        response = self.client.post(PASSWORD_RESET_URL,
                                    json.dumps({"email": TEST_USER_1[1]}),
                                    content_type="application/json")

        self._check_response(response, send_email)

    @patch("djoser.utils.send_email")
    def test_no_email(self, send_email):
        """The reset-password request doesn't have an email."""

        # Create a user and log them out.
        token = create_and_login()

        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        self.assertContains(response, '', status_code=HTTP_200_OK)

        # Now try resetting the password.
        response = self.client.post(PASSWORD_RESET_URL,
                                    content_type="application/json")

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test that send_email was not called.
        self.assertEqual(send_email.call_count, 0)

    @patch("djoser.utils.send_email")
    def test_bad_email(self, send_email):
        """The reset-password password request has a bad email.

        The server returns a 200 status code, but does not send any email.

        """

        # Create a user and log them out.
        token = create_and_login()

        response = self.client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        self.assertContains(response, '', status_code=HTTP_200_OK)

        # Now try resetting the password.
        response = \
            self.client.post(PASSWORD_RESET_URL,
                             json.dumps({"email": "zippl@nyahnyah.org"}),
                             content_type="application/json")

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test that send_email was not called.
        self.assertEqual(send_email.call_count, 0)
