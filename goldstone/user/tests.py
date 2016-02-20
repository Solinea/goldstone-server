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

import json
from copy import deepcopy

from django.contrib.auth import get_user_model
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST

from goldstone.tenants.models import Tenant, Cloud
from goldstone.test_utils import create_and_login, Setup, USER_URL, \
    AUTHORIZATION_PAYLOAD, CONTENT_NO_CREDENTIALS, CONTENT_BAD_TOKEN, \
    CONTENT_MISSING_USERNAME, TEST_USER_1, check_response_without_uuid, \
    BAD_TOKEN

# Test content.
EXPECTED_CONTENT = {"username": TEST_USER_1[0],
                    "first_name": '',
                    "last_name": '',
                    "email": TEST_USER_1[1],
                    "tenant_admin": False,
                    "is_superuser": False,
                    "default_tenant_admin": False}


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

        # Create a user and get their authorization token.
        token = create_and_login()

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_CONTENT,
                                    extra_keys=["last_login", "date_joined"])

    def test_change_one_field(self):
        """Change one field in the account."""

        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["first_name"] = "Dirk"

        # Create a user and get their authorization token.
        token = create_and_login()

        # Change some attributes from the default. Note, the username is
        # required by djoser UserView/PUT.
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER_1[0],
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

        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["first_name"] = "Dirk"
        expected_content["last_name"] = "Diggler"

        # Create a user and get their authorization token.
        token = create_and_login()

        # Change some attributes from the default. Note, the username is
        # required by djoser UserView/PUT.
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER_1[0],
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

        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["username"] = "Heywood"
        expected_content["first_name"] = "Dirk"
        expected_content["last_name"] = "Diggler"
        expected_content["email"] = "john@siberia.com"

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

        cloud_fields = {"tenant_name": "cloud name 0",
                        "username": "abracadabra",
                        "password": "boomlackalackalacka",
                        "auth_url": "http://10.11.12.13:5000/v3/"}

        # Make a tenant, and one Cloud under it.
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        cloud_fields["tenant"] = tenant
        Cloud.objects.create(**cloud_fields)

        # Create a normal user.
        token = create_and_login()

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # None of the Tenant or Cloud fields should be in the response.
        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_CONTENT,
                                    extra_keys=["last_login", "date_joined"])

    def test_post_restricted_fields(self):
        """Try changing fields that are restricted to tenant_admins."""

        cloud_fields = {"tenant_name": "cloud name 0",
                        "username": "abracadabra",
                        "password": "boomlackalackalacka",
                        "auth_url": "http://10.11.12.13:5000/v3/"}

        # Make a tenant, and one Cloud under it.
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        cloud_fields["tenant"] = tenant
        Cloud.objects.create(**cloud_fields)

        # Create a normal user.
        token = create_and_login()

        # Try to change some attributes. Note, the username is required by
        # djoser UserView/PUT.
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "os_username": "B minus",
                        "os_password": "12344321",
                        "tenant_name": "$20k"}),   # tenant_name won't change.
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # None of the Tenant or Cloud fields should be in the response.
        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_CONTENT,
                                    extra_keys=["last_login", "date_joined"])


class GetPutTenantAdmin(Setup):
    """The tenant_admin user gets and changes her Cloud credentials."""

    def test_no_tenant(self):
        """Get or change Cloud data when there's no Goldstone tenant."""

        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["tenant_admin"] = True

        # Make a tenant
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.  Then nullify the Tenant field.
        token = create_and_login(tenant=tenant)
        user = get_user_model().objects.all()[0]
        user.tenant = None
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

        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["tenant_admin"] = True
        expected_content["tenant_name"] = "hellothere"

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

        cloud_fields = {"tenant_name": "cloud name 0",
                        "username": "abracadabra",
                        "password": "boomlackalackalacka",
                        "auth_url": "http://10.11.12.13:5000/v3/"}

        # Make a tenant, and one Cloud under it.
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        cloud_fields["tenant"] = tenant
        Cloud.objects.create(**cloud_fields)

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Concoct the results we expect, which includes the cloud credentials.
        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["tenant_admin"] = True
        expected_content["tenant_name"] = tenant.name
        expected_content["os_name"] = cloud_fields["tenant_name"]
        expected_content["os_username"] = cloud_fields["username"]
        expected_content["os_password"] = cloud_fields["password"]
        expected_content["os_auth_url"] = cloud_fields["auth_url"]

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_change_bogus_field(self):
        """Try changing fields that don't exist."""

        cloud_fields = {"tenant_name": "cloud name 0",
                        "username": "abracadabra",
                        "password": "boomlackalackalacka",
                        "auth_url": "http://10.11.12.13:5000/v3/"}

        # Make a tenant, and one Cloud under it.
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        cloud_fields["tenant"] = tenant
        Cloud.objects.create(**cloud_fields)

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try changing some bogus attributes. Note, the username is required by
        # djoser UserView/PUT.
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "os_bloodtype": "B minus",
                        "tenant_taxes": "$20k"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Concoct the results we expect, which includes the cloud credentials.
        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["tenant_admin"] = True
        expected_content["tenant_name"] = tenant.name
        expected_content["os_name"] = cloud_fields["tenant_name"]
        expected_content["os_username"] = cloud_fields["username"]
        expected_content["os_password"] = cloud_fields["password"]
        expected_content["os_auth_url"] = cloud_fields["auth_url"]

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])

    def test_change_some_fields(self):
        """Get Cloud data and change some fields."""

        cloud_fields = {"tenant_name": "cloud name 0",
                        "username": "abracadabra",
                        "password": "boomlackalackalacka",
                        "auth_url": "http://10.11.12.13:5000/v3/"}

        # Make a tenant, and one Cloud under it.
        tenant = Tenant.objects.create(name='hellothere',
                                       owner='John',
                                       owner_contact='206.867.5309')

        cloud_fields["tenant"] = tenant
        Cloud.objects.create(**cloud_fields)

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Change some attributes. Note, the username is required by djoser
        # UserView/PUT.
        response = self.client.put(
            USER_URL,
            json.dumps({"username": TEST_USER_1[0],
                        "os_username": "B minus",
                        "os_password": "12344321",
                        "tenant_name": "$20k"}),   # tenant_name won't change.
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now get the account attributes and see if they've changed.
        response = self.client.get(
            USER_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Concoct the results we expect, which includes the cloud credentials.
        expected_content = deepcopy(EXPECTED_CONTENT)
        expected_content["tenant_admin"] = True
        expected_content["tenant_name"] = tenant.name
        expected_content["os_name"] = cloud_fields["tenant_name"]
        expected_content["os_username"] = "B minus"
        expected_content["os_password"] = "12344321"
        expected_content["os_auth_url"] = cloud_fields["auth_url"]

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_content,
                                    extra_keys=["last_login", "date_joined"])
