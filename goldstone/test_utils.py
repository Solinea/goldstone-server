"""Goldstone unit test utilities."""
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
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework.status import HTTP_200_OK

# Test URLs.
LOGIN_URL = "/accounts/login/"
USER_URL = "/user/"

# Http response content used by multiple tests.
CONTENT_BAD_TOKEN = '{"detail":"Invalid token."}'
CONTENT_MISSING_PASSWORD = '"password":["This field is required."]'
CONTENT_MISSING_USERNAME = '"username":["This field is required."]'
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_NO_PERMISSION = \
    '{"detail":"You do not have permission to perform this action."}'
CONTENT_NON_FIELD_ERRORS = \
    '{"non_field_errors":["Unable to login with provided credentials."]}'
CONTENT_NOT_BLANK_USERNAME = '"username":["This field is required."]'
CONTENT_NOT_FOUND = "Not found."
CONTENT_PERMISSION_DENIED = '{"detail":"Permission denied."}'
CONTENT_UNIQUE_USERNAME = '{"username":["This field must be unique."]}'
CONTENT_UNIQUE_NAME = '{"name":["This field must be unique."]}'

# The payload string for the HTTP Authorization header.
AUTHORIZATION_PAYLOAD = "Token %s"

# Test data
TEST_USER = ("fred", "fred@fred.com", "meh")
BAD_TOKEN = '4' * 40
BAD_UUID = '4' * 32


class Setup(TransactionTestCase):
    """A base class to do housekeeping before each test."""

    def setUp(self):
        """Do additional inter-test resetting."""
        from goldstone.core import resource

        get_user_model().objects.all().delete()

        resource.types = resource.Types()

        # Resource.instances may have been used before this test, so force it
        # into a virgin state.
        resource.instances._graph = None        # pylint: disable=W0212


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

    # pylint: disable=E1101
    assert response.status_code == HTTP_200_OK
    assert isinstance(response.data["auth_token"], basestring)

    return response.data["auth_token"]      # pylint: disable=E1101


def create_and_login(is_superuser=False, tenant=None):
    """Create a user and log her in.

    :keyword is_superuser: Set the is_superuser flag in the User record?
                           (A.k.a., create a Django admin account?)
    :type is_superuser: bool
    :keyword tenant: If not None, make the user a tenant_admin of this tenant
    :type tenant: Tenant
    :return: The authorization token's value
    :rtype: str

    """

    # Create a user
    user = get_user_model().objects.create_user(*TEST_USER)

    user.is_superuser = is_superuser
    user.is_staff = is_superuser

    if tenant:
        user.tenant = tenant
        user.tenant_admin = True

    user.save()

    return login(TEST_USER[0], TEST_USER[2])


def check_response_without_uuid(response, expected_status_code,
                                expected_content, uuid_under_results=False,
                                extra_keys=None):
    """Compare a response's content with expected content, without fully
    comparing the "uuid" key.

    A uuid is random. For responses that contain one, we confirm that the uuid
    key exists and its string value is at least N digits long. If those checks
    pass, we assume the uuid is correct, and then do an exact comparison of the
    remainder of the response.

    The uuid key may be, "UUID," or, "uuid".

    The extra_keys hook allows the caller to specify the same treatment (except
    for the length of the value) for arbitrary keys.

    :param response: The HTTP response to be tested
    :type response: django.test.client.Response
    :param expected_status_code: The expected status code
    :type expected_status_code: rest_framework.status.HTTP*
    :param expected_content: The expected response.content, without a uuid key
    :type expected_content: dict
    :keyword uuid_under_results: If True, response.content contains a 'results'
                                 key. Its value is a list of dicts, and each
                                 dict contains a "uuid" key. If False,
                                 response.content contains a "uuid" key.
    :type uuid_under_results: bool
    :keyword extra_keys: If not None, a list of keys. These keys will be
                         checked for their existence, and their values must
                         be strings.
    :type extra_keys: list of str

    """
    import json

    def uuid_check(response_dict):
        """Check the uuid key and value."""

        assert isinstance(response_dict.get("uuid", response_dict.get("UUID")),
                          basestring)
        assert len(response_dict.get("uuid", response_dict.get("UUID"))) >= 32

    assert response.status_code == expected_status_code

    # Deserialize the response content to simplify checking.
    response_content = json.loads(response.content)

    if uuid_under_results:
        # Look under the 'results' key for a list of dicts. Each dict must
        # have a 'uuid' key.
        for entry in response_content["results"]:
            uuid_check(entry)
            if "uuid" in entry:
                del entry["uuid"]
            else:
                del entry["UUID"]
    else:
        # Look under response_content for the single 'uuid' key.
        uuid_check(response_content)
        if "uuid" in response_content:
            del response_content["uuid"]
        else:
            del response_content["UUID"]

    # Check the extra_keys keys for existence, and their values must be
    # strings.
    if extra_keys is not None:
        for key in extra_keys:
            assert isinstance(response_content[key], basestring)
            del response_content[key]

    if uuid_under_results:
        # assertEqual compares nested dict values with order sensitivity, if
        # the values are lists.
        response_content["results"].sort()
        expected_content["results"].sort()

    # Now check every other key in the response.
    assert response_content == expected_content
