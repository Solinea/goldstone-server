"""Custom User model tests."""
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
import json
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST
from goldstone.tenants.models import Tenant
from goldstone.test_utils import create_and_login, Setup, USER_URL, \
    AUTHORIZATION_PAYLOAD, CONTENT_NO_CREDENTIALS, CONTENT_BAD_TOKEN, \
    CONTENT_MISSING_USERNAME, TEST_USER, check_response_without_uuid, \
    BAD_TOKEN


class NoAccess(Setup):
    """The user attempts access without being logged in, or presenting a bad
    authentication token."""

    def test_get_nologin(self):
        """Getting while not logged in."""

        response = self.client.get(USER_URL)

        self.assertContains(response,
                            CONTENT_NO_CREDENTIALS,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_get_badtoken(self):
        """Getting while not logged in, using any token."""

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_loggedin_get_badtoken(self):
        """Getting while logged in, using a bad token."""

        # Create a user.
        create_and_login()

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_put_nologin(self):
        """Putting (trying to change user attributes) while not logged in."""

        response = self.client.put(USER_URL,
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

        # Create a user.
        create_and_login()

        response = self.client.put(
            USER_URL,
            json.dumps({"first_name": "Dirk"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_no_username(self):
        """Try changing account attributes with a good token, but a bad
        username."""

        # Create a user and get the authorization token.
        token = create_and_login()

        response = self.client.put(
            USER_URL,
            json.dumps({"first_name": "Dirk"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_MISSING_USERNAME,
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

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

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
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER[0],
                        "first_name": "Dirk"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

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
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER[0],
                        "first_name": "Dirk",
                        "last_name": "Diggler"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

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
        response = self.client.put(
            USER_URL,
            json.dumps({"username": "Heywood",
                        "first_name": "Dirk",
                        "last_name": "Diggler",
                        "email": "john@siberia.com"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_get_restricted_fields(self):
        """Try getting fields that are restricted to tenant_admins."""

        self.fail()

    def test_post_restricted_fields(self):
        """Try posting to fields that are restricted to tenant_admins."""

        self.fail()


class GetPutTenantAdmin(Setup):
    """The tenant_admin user gets and changes her Cloud credentials."""

    def test_no_tenant(self):
        """Get or change Cloud data when there's no Goldstone tenant."""
 
        expected_content = {"username": TEST_USER[0],
                            "first_name": '',
                            "last_name": '',
                            "email": TEST_USER[1],
                            "tenant_admin": True,
                            "default_tenant_admin": False}

        # Make a tenant
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.  Then nullify the Tenant field.
        token = create_and_login(tenant=tenant)
        user = get_user_model().objects.all()[0]
        user.tenant  = None
        user.save()

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_no_cloud(self):
        """Get or change Cloud data when there's no Cloud."""

        expected_content = {"username": TEST_USER[0],
                            "first_name": '',
                            "last_name": '',
                            "email": TEST_USER[1],
                            "tenant_admin": True,
                            "tenant_name": "hellothere",
                            "default_tenant_admin": False}

        # Make a tenant.  Don't make a Cloud under it.
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_get_data(self):
        """Get Cloud data."""

        expected_content = {"username": TEST_USER[0],
                            "first_name": '',
                            "last_name": '',
                            "email": TEST_USER[1],
                            "tenant_admin": False,
                            "default_tenant_admin": False}

        # Create a user and get their authorization token.
        token = create_and_login()

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_change_bogus_field(self):
        """Try changing a field that doesn't exist."""

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
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER[0],
                        "first_name": "Dirk"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_change_some_fields(self):
        """Get Cloud data and change some of the fields."""

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
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER[0],
                        "first_name": "Dirk",
                        "last_name": "Diggler"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])
