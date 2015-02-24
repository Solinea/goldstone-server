"""Unit Test utilities.

These are used by the unit tests of multiple apps.

TODO: Find a neutral home for them.

"""
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

# Http response content used by multiple tests.
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'
CONTENT_MISSING_PASSWORD = '{"password":["This field is required."]}'
CONTENT_MISSING_USERNAME = '{"username":["This field is required."]}'
CONTENT_MISSING_FIELDS = '{"username":["This field is required."],' \
                         '"password":["This field is required."]}'
CONTENT_UNIQUE_USERNAME = '{"username":["This field must be unique."]}'

# HTTP Authorization header payload for token authorization.
AUTHORIZATION_PAYLOAD = "Token %s"


def create_and_login():
    """Create a user and log them in.

    :return: The authorization token's value
    :rtype: str

    """
    from rest_framework.status import HTTP_200_OK

    # Define URLs and payloads.
    LOGIN_URL = "/accounts/login"
    TEST_USER = ("fred", "fred@fred.com", "meh")
    TEST_USER_LOGIN = {"username": TEST_USER[0], "password": TEST_USER[2]}

    # Create a user
    get_user_model().objects.create_user(*TEST_USER)

    # Log the user in, and return the auth token's value.
    client = Client()
    response = client.post(LOGIN_URL, TEST_USER_LOGIN)

    assert response.status_code == HTTP_200_OK

    return response.data["auth_token"]      # pylint: disable=E1101


class Setup(SimpleTestCase):

    """A base class to ensure we do needed housekeeping before each test."""

    def setUp(self):
        """Do explicit database reseting because SimpleTestCase doesn't always
        reset the database to as much of an initial state as we expect."""

        get_user_model().objects.all().delete()
