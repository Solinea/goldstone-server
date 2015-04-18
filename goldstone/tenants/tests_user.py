"""Unit tests for /tenants/<id>/users endpoints."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from django.contrib.auth import get_user_model
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_403_FORBIDDEN, \
    HTTP_204_NO_CONTENT
from goldstone.test_utils import Setup, create_and_login, login, \
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, CONTENT_NO_CREDENTIALS, \
    check_response_without_uuid, TEST_USER, CONTENT_PERMISSION_DENIED, \
    BAD_TOKEN, BAD_UUID, CONTENT_NOT_BLANK_USERNAME
from .models import Tenant
from .tests_tenants import TENANTS_ID_URL

# HTTP response content.
CONTENT_MISSING_OS_USERNAME = '"username":["This field may not be blank."]'
CONTENT_MISSING_OS_NAME = '"tenant_name":["This field may not be blank."]'
CONTENT_MISSING_OS_PASSWORD = '"password":["This field may not be blank."]'
CONTENT_MISSING_OS_URL = '"auth_url":["This field may not be blank."]'

# URLs used by this module.
TENANTS_ID_USERS_URL = TENANTS_ID_URL + "/users"
TENANTS_ID_USERS_ID_URL = TENANTS_ID_USERS_URL + "/%s"


class TenantsIdUsers(Setup):
    """Listing users of a tenant, and creating user of a tenant."""

    def test_not_logged_in(self):
        """Getting the tenant users, or creating a tenant user, without being
        logged in."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Try the GET and POST without an authorization token.
        responses = [self.client.get(TENANTS_ID_USERS_URL % tenant.uuid),
                     self.client.post(TENANTS_ID_USERS_URL % tenant.uuid,
                                      json.dumps({"username": "fool",
                                                  "password": "fooll",
                                                  "email": "a@b.com"}),
                                      content_type="application/json")]

        for response in responses:
            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        # Try the GET and POST with a bad authorization token.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid,
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_BAD_TOKEN,
                                status_code=HTTP_401_UNAUTHORIZED)

    def test_no_access(self):
        """Getting the tenant users, or creating a tenant user, without being
        an authorized user."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a normal user who's a member of the tenant, but *not* a
        # tenant_admin
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.save()

        # Try the GET and POST.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid,
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_no_tenant(self):
        """Getting a tenant, or creating a user of a tenant, when the tenant
        doesn't exist."""

        # Create a Django admin user.
        token = create_and_login(is_superuser=True)

        # Make a tenant, then delete it.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        tenant.delete()

        # Try the GET and POST to a tenant that doesn't exist.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid,
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_get(self):
        """List a tenant's users."""

        # The accounts in this test.
        TENANT_USERS = [{"username": "a",
                         "email": "a@b.com",
                         "password": "a",
                         "tenant_admin": True},
                        {"username": "b", "email": "b@b.com", "password": "b"},
                        {"username": "c", "email": "c@b.com", "password": "c"},
                        ]

        USERS = [{"username": "d", "email": "d@b.com", "password": "d"},
                 {"username": "e", "email": "e@b.com", "password": "e"},
                 ]

        EXPECTED_RESULT = [{"username": "a",
                            "first_name": '',
                            "last_name": '',
                            "email": "a@b.com",
                            "default_tenant_admin": False,
                            "tenant_admin": True},
                           {"username": "b",
                            "first_name": '',
                            "last_name": '',
                            "email": "b@b.com",
                            "default_tenant_admin": False,
                            "tenant_admin": False},
                           {"username": "c",
                            "first_name": '',
                            "last_name": '',
                            "email": "c@b.com",
                            "default_tenant_admin": False,
                            "tenant_admin": False},
                           ]

        # Make a tenant
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create users belonging to this tenant. One will be the tenant_admin.
        for user in TENANT_USERS:
            user["tenant"] = tenant
            get_user_model().objects.create_user(**user)

        # Create users who don't belong to the tenant.
        for user in USERS:
            get_user_model().objects.create(**user)

        # Log in as the tenant_admin.
        tenant_admin = [x for x in TENANT_USERS if "tenant_admin" in x][0]
        token = login(tenant_admin["username"], tenant_admin["password"])

        # Get the tenant's user list and check the response. We do a partial
        # check of the uuid, date_joined, and last_login keys. They must exist,
        # and their values must be strings, and the UUID ought to be >= 32
        # characters.
        response = self.client.get(
            TENANTS_ID_USERS_URL % tenant.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        response_content = json.loads(response.content)

        for entry in response_content["results"]:
            self.assertIsInstance(entry["uuid"], basestring)
            self.assertGreaterEqual(len(entry["uuid"]), 32)

            self.assertIsInstance(entry["date_joined"], basestring)
            self.assertIsInstance(entry["last_login"], basestring)

            del entry["uuid"]
            del entry["date_joined"]
            del entry["last_login"]

        self.assertItemsEqual(response_content["results"], EXPECTED_RESULT)

    @patch("djoser.utils.send_email")
    def test_post(self, send_email):
        """Create a user in a tenant."""

        # The accounts in this test.
        TENANT_USERS = [{"username": "a", "email": "a@b.com", "password": "a"},
                        {"username": "b", "email": "b@b.com", "password": "b"}]

        def create(user_number):
            """Create one user in the tenant.

            :param user_number: The TENANT_USERS index to use
            :type user_number: int

            """
            from django.conf import settings

            response = self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid,
                json.dumps(TENANT_USERS[user_number]),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response,
                                        HTTP_201_CREATED,
                                        EXPECTED_RESULT[user_number],
                                        extra_keys=["last_login",
                                                    "date_joined"])

            # Was email send to the new user?
            self.assertEqual(send_email.call_count, 1)

            # Did the e-mail seem to have the correct content?
            self.assertEqual(send_email.call_args[0][0],
                             TENANT_USERS[user_number]["email"])
            self.assertEqual(send_email.call_args[0][1],
                             "webmaster@localhost")  # from
            self.assertEqual(send_email.call_args[0][2]["site_name"],
                             settings.DJOSER["SITE_NAME"])  # The site name
            self.assertIn("tenant", send_email.call_args[0][2]["tenant_name"])
            self.assertEqual(send_email.call_args[1],
                             {'plain_body_template_name':
                              'new_tenant_body.txt',
                              'subject_template_name': 'new_tenant.txt'})

        EXPECTED_RESULT = [{"username": "a",
                            "first_name": '',
                            "last_name": '',
                            "email": "a@b.com",
                            "tenant_admin": False,
                            "default_tenant_admin": False},
                           {"username": "b",
                            "first_name": '',
                            "last_name": '',
                            "email": "b@b.com",
                            "tenant_admin": False,
                            "default_tenant_admin": False}]

        # Make a tenant
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a user who's the tenant_admin of this tenant, and log him in.
        token = create_and_login(tenant=tenant)

        # Create one user in this empty tenant and check the result.
        create(0)

        # Now try it again.
        send_email.reset_mock()
        create(1)


class TenantsIdUsersId(Setup):
    """Retrieving one particular user record from a tenant, and updating one
    user record in a tenant."""

    def test_not_logged_in(self):
        """The client is not logged in."""

        # Make a tenant, and put one member, a tenant_admin, in it.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')
        user = get_user_model().objects.create_user(username=TEST_USER[0],
                                                    password=TEST_USER[2])
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Try GET, PUT, and DELETE without an authorization token.
        responses = [self.client.get(TENANTS_ID_USERS_ID_URL %
                                     (tenant.uuid, user.uuid)),
                     self.client.put(TENANTS_ID_USERS_ID_URL %
                                     (tenant.uuid, user.uuid),
                                     json.dumps({"username": "fool",
                                                 "password": "fooll",
                                                 "email": "a@b.com"}),
                                     content_type="application/json"),
                     self.client.delete(TENANTS_ID_USERS_ID_URL %
                                        (tenant.uuid, user.uuid)),
                     ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        # Try again with a bad authorization token.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.put(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.delete(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_BAD_TOKEN,
                                status_code=HTTP_401_UNAUTHORIZED)

    def test_no_access(self):
        """The client isn't an authorized user."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a normal user who's a member of the tenant, but *not* a
        # tenant_admin
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.save()

        # Try GET, PUT, and DELETE.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

        # Ensure the user wasn't deleted.
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_no_tenant(self):
        """Getting a tenant, or creating a user of a tenant, or deleting a
        user, when the tenant doesn't exist."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)
        user = get_user_model().objects.get(username=TEST_USER[0])

        # Try GET, PUT, and DELETE to a nonexistent tenant.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_ID_URL % (BAD_UUID, user.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_USERS_ID_URL % (BAD_UUID, user.uuid),
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_USERS_ID_URL % (BAD_UUID, user.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_get_no_user(self):
        """Get a user that does not exist from a tenant."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try GETing a nonexistent user from this tenant.
        response = self.client.get(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid, BAD_UUID),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_get(self):
        """Get a user."""

        # Expected results, sans uuid keys.
        EXPECTED_RESULTS = [{"username": "fred",
                             "first_name": "",
                             "last_name": "",
                             "email": "fred@fred.com",
                             "tenant_admin": True,
                             "default_tenant_admin": False},
                            {"username": "Traci",
                             "first_name": "",
                             "last_name": "",
                             "email": '',
                             "tenant_admin": False,
                             "default_tenant_admin": False},
                            ]

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)
        user = get_user_model().objects.get(username=TEST_USER[0])

        # Try GETing the tenant admin.
        response = self.client.get(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid, user.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_RESULTS[0],
                                    extra_keys=["last_login", "date_joined"])

        # Add another user to the tenant, and get her.
        user = get_user_model().objects.create_user(username="Traci",
                                                    password='a')
        user.tenant = tenant
        user.save()

        # Try GETing the second user.
        response = self.client.get(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid, user.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_RESULTS[1],
                                    extra_keys=["last_login", "date_joined"])

    def test_put_no_user(self):
        """Update a non-existent user of a tenant."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try PUTing to a nonexistent user in this tenant.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, BAD_UUID),
            json.dumps({"username": "fool", "email": "a@b.com"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_put_bad_fields(self):
        """Update a user with missing required fields, or unrecognized
        fields, or a field that's not allowed to be changed by the
        tenant_admin."""

        # Expected responses, sans uuid keys.
        EXPECTED_RESPONSES = [
            # PUTting no changes.
            {"username": "Beth",
             "first_name": "",
             "last_name": "",
             "email": "",
             "tenant_admin": False,
             "default_tenant_admin": False},
            # PUTting to an unrecognized field.
            {"username": "Beth",
             "first_name": "Michelle",
             "last_name": "",
             "email": "",
             "tenant_admin": False,
             "default_tenant_admin": False},
        ]

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant, and a normal user of the tenant.
        token = create_and_login(tenant=tenant)

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant
        user.save()

        # Try PUTing to the user with no username.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_NOT_BLANK_USERNAME,
                            status_code=HTTP_400_BAD_REQUEST)

        # Try PUTing to the user with no changes, and with a change to an
        # unrecognized field.
        for i, entry in enumerate([{"username": "Beth"},
                                   {"username": "Beth",
                                    "billybopfoo": "blaRGH",
                                    "first_name": "Michelle"},
                                   ]):
            response = self.client.put(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
                json.dumps(entry),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response,
                                        HTTP_200_OK,
                                        EXPECTED_RESPONSES[i],
                                        extra_keys=["last_login",
                                                    "date_joined"])

        # Try PUTing to the user on a field that's not allowed to be changed.
        # The response should be the same as the "unrecognized field" case.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
            json.dumps({"username": "Beth",
                        "billybopfoo": "blaRGH",
                        "tenant_admin": True,
                        "default_tenant_admin": True,
                        "first_name": "Michelle"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_RESPONSES[1],
                                    extra_keys=["last_login", "date_joined"])

    def test_put(self):
        """Update a user in a tenant."""

        # Expected response, sans uuid.
        EXPECTED_RESPONSE = {"username": "Beth",
                             "first_name": "1",
                             "last_name": "2",
                             "email": "x@y.com",
                             "tenant_admin": False,
                             "default_tenant_admin": False}

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant, and a normal user of the tenant.
        token = create_and_login(tenant=tenant)

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant
        user.save()

        # Try PUTing to the user.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
            json.dumps({"username": "Beth",
                        "first_name": '1',
                        "last_name": '2',
                        "email": "x@y.com"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_RESPONSE,
                                    extra_keys=["last_login", "date_joined"])

    def test_delete_default_tnnt_admin(self):
        """Try deleting the system's default tenant admin."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin, default_tenant_admin, and a normal user.
        token = create_and_login(tenant=tenant)

        default_tenant_admin = \
            get_user_model().objects.create_user(username="Amber",
                                                 password="xxx")
        default_tenant_admin.tenant = tenant
        default_tenant_admin.default_tenant_admin = True
        default_tenant_admin.save()

        get_user_model().objects.create_user(username="Beth",
                                             password='x',
                                             tenant=tenant)

        # Try to DELETE the default_admin_user.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid, default_tenant_admin.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 3)

    def test_delete_self(self):
        """Try deleting oneself."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin.
        token = create_and_login(tenant=tenant)
        admin_user = get_user_model().objects.get(username=TEST_USER[0])

        # Try DELETE on oneself.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, admin_user.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_delete_not_member(self):
        """Try deleting a user of another tenant."""

        # Make two tenants.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        tenant_2 = Tenant.objects.create(name='tenant_2',
                                         owner='John',
                                         owner_contact='206.867.5309')

        # Create a tenant_admin, default_tenant_admin, and a normal user of
        # another tenant.
        token = create_and_login(tenant=tenant)

        default_tenant_admin = \
            get_user_model().objects.create_user(username="Amber",
                                                 password="xxx")
        default_tenant_admin.tenant = tenant
        default_tenant_admin.default_tenant_admin = True
        default_tenant_admin.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x',
                                                    tenant=tenant_2)

        # Try DELETE on the normal user.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 3)

    def test_delete_django_admin(self):
        """Try deleting a Django admin, a.k.a. Goldstone system admin."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Log in as the tenant admin.
        token = create_and_login(tenant=tenant)

        # Create a Django admin who's a member of the tenant.
        django_admin = \
            get_user_model().objects.create_superuser("Amber",
                                                      "a@b.com",
                                                      "xxx",
                                                      tenant=tenant)

        # Try DELETE on the Django admin.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, django_admin.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 2)

    def test_delete(self):
        """Delete a user in a tenant."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin, default_tenant_admin, and a normal user.
        token = create_and_login(tenant=tenant)

        default_tenant_admin = \
            get_user_model().objects.create_user(username="Amber",
                                                 password="xxx")
        default_tenant_admin.tenant = tenant
        default_tenant_admin.default_tenant_admin = True
        default_tenant_admin.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x',
                                                    tenant=tenant)

        # Try to DELETE the normal user.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid, user.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_204_NO_CONTENT)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 2)
