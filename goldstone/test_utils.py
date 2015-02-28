"""Goldstone unit test utilities."""
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
from django.test import SimpleTestCase
from rest_framework.status import HTTP_200_OK

# Test URL
LOGIN_URL = "/accounts/login"

# Http response content used by multiple tests.
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'
CONTENT_MISSING_FIELDS = '{"username":["This field is required."],' \
                         '"password":["This field is required."]}'
CONTENT_MISSING_PASSWORD = '{"password":["This field is required."]}'
CONTENT_MISSING_USERNAME = '{"username":["This field is required."]}'
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_NO_PERMISSION = \
    '{"detail":"You do not have permission to perform this action."}'
CONTENT_PERMISSION_DENIED = '{"detail":"Permission denied"}'
CONTENT_NON_FIELD_ERRORS = \
    '{"non_field_errors":["Unable to login with provided credentials."]}'
CONTENT_NOT_BLANK = '{"username":["This field may not be blank."],'\
                    '"password":["This field may not be blank."]}'
CONTENT_NOT_BLANK_USERNAME = '{"username":["This field may not be blank."]}'
CONTENT_UNIQUE_USERNAME = '{"username":["This field must be unique."]}'
CONTENT_UNIQUE_NAME = '{"name":["This field must be unique."]}'

# The payload string for the HTTP Authorization header.
AUTHORIZATION_PAYLOAD = "Token %s"

# Test data
TEST_USER = ("fred", "fred@fred.com", "meh")
BAD_TOKEN = '4' * 40
BAD_UUID = '4' * 32


class Setup(SimpleTestCase):

    """A base class to ensure we do needed housekeeping before each test."""

    def setUp(self):
        """Do explicit database reseting because SimpleTestCase doesn't always
        reset the database to as much of an initial state as we expect."""
        from goldstone.tenants.models import Tenant

        get_user_model().objects.all().delete()
        Tenant.objects.all().delete()


def login(username, password):
    """Log a user in.

    This is for use on a login that is supposed to succeed. It checks the
    system response with asserts before returning.

    :param username: The username to use
    :type username: str
    :param password: The password to use
    :type password: str
    :return: If a successful login, the authorization token's value
    :rtype: str

    """
    from django.test import Client

    # Log the user in, and return the auth token's value.
    client = Client()
    response = client.post(LOGIN_URL,
                           {"username": username, "password": password})

    assert response.status_code == HTTP_200_OK

    # pylint: disable=E1101
    assert isinstance(response.data["auth_token"], basestring)

    return response.data["auth_token"]      # pylint: disable=E1101


def create_and_login(is_staff=False):
    """Create a user and log them in.

    :keyword is_staff: Set the is_staff flag in the User record? (A.k.a.
                       create a Django admin user?)
    :type is_staff: bool
    :return: The authorization token's value
    :rtype: str

    """

    # Create a user
    user = get_user_model().objects.create_user(*TEST_USER)
    user.is_staff = is_staff
    user.save()

    return login(TEST_USER[0], TEST_USER[2])


def check_response_without_uuid(response, expected_status_code,
                                expected_content, uuid_under_results=False):
    """Compare a response's content with expected content, without fully
    comparing the "uuid" key.

    A uuid is random. For responses that contain one, we confirm that the uuid
    key existst, and its value is a string that's at least N digits long. If
    those checks pass, we assume the uuid is correct, and then do an exact
    comparison of the remainder of the response.

    :param response: The HTTP response to be tested
    :type response: django.test.client.Response
    :param expected_status_code: The expected status code
    :type expected_status_code: rest_framework.status.HTTP*
    :param expected_content: The expected response.content, without a uuid key
    :type expected_content: dict
    :keyword uuid_under_results: If True, response.content contains a 'results'
                                 key. Its value is a list of dicts, and each
                                 dict contains a 'uuid' key. If False,
                                 response.content contains a 'uuid' key.

    """
    import json

    def uuid_check(response_dict):
        """Check the uuid key and value."""

        assert isinstance(response_dict["uuid"], basestring)
        assert len(response_dict["uuid"]) >= 32

    assert response.status_code == expected_status_code

    # Deserialize the response content to simplify checking.
    response_content = json.loads(response.content)

    if uuid_under_results:
        # Look under the 'results' key for a list of dicts. Each dict should
        # have a 'uuid' key.
        for entry in response_content["results"]:
            uuid_check(entry)
            del entry["uuid"]
    else:
        # Look under response_content for the single 'uuid' key.
        uuid_check(response_content)
        del response_content["uuid"]

    # Now check that every other key is in the response.
    assert response_content == expected_content
