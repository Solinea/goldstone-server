"""Tenant unit tests."""
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
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_403_FORBIDDEN, \
    HTTP_204_NO_CONTENT
from goldstone.user.util_test import Setup, create_and_login, login, \
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, CONTENT_NON_FIELD_ERRORS, \
    CONTENT_NO_CREDENTIALS, LOGIN_URL, check_response_without_uuid, \
    TEST_USER, CONTENT_NOT_BLANK, CONTENT_NO_PERMISSION, CONTENT_UNIQUE_NAME, \
    CONTENT_PERMISSION_DENIED, BAD_TOKEN
from .models import Tenant

# URLs used by this module.
TENANTS_URL = "/tenants"
TENANTS_ID_URL = TENANTS_URL + '/%s'
TENANTS_ID_USERS_URL = TENANTS_ID_URL + "/users"


class Tenants(Setup):
    """Getting a list of tenants, and creating a tenant."""

    def test_not_logged_in(self):
        """Getting a tenant list, or creating a tenant, without being logged
        in."""

        client = Client()

        # Try getting a tenant list with no token.
        response = client.get(TENANTS_URL)

        self.assertContains(response,
                            CONTENT_NO_PERMISSION,
                            status_code=HTTP_403_FORBIDDEN)

        # Try getting a tenant list with a bogus token.
        response = \
            client.get(TENANTS_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

        # Try creating a tenant with no token.
        response = client.post(TENANTS_URL,
                               json.dumps({"name": "foobar",
                                           "owner": "Debra Winger"}),
                               content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_PERMISSION,
                            status_code=HTTP_403_FORBIDDEN)

        # Try creating a tenant with a bogus token.
        response = \
            client.post(TENANTS_URL,
                        json.dumps({"name": "foobar",
                                    "owner": "Debra Winger"}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

    def test_no_access(self):
        """Getting a tenant list, or creating a tenant, without being a Django
        admin."""

        def get_post():
            """Try getting and posting, using the default test user."""

            # Try getting a tenant list.
            response = \
                client.get(TENANTS_URL,
                           HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            self.assertContains(response,
                                CONTENT_NO_PERMISSION,
                                status_code=HTTP_403_FORBIDDEN)

            # Try creating a tenant.
            response = \
                client.post(TENANTS_URL,
                            json.dumps({"name": "foobar",
                                        "owner": "Debra Winger"}),
                            content_type="application/json",
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            self.assertContains(response,
                                CONTENT_NO_PERMISSION,
                                status_code=HTTP_403_FORBIDDEN)

        # Create a user and get the authorization token.
        token = create_and_login()

        client = Client()

        # Test for no-access, as a normal user.
        get_post()

        # Now do both sub-tests again, this time as a tenant_admin. We should
        # still have no access.
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant_admin = True
        user.save()

        get_post()

    def test_get_no_list(self):
        """Get a tenant list when no tenant yet exists."""

        EXPECTED_CONTENT = \
            '{"count":0,"next":null,"previous":null,"results":[]}'

        # Create a user, save the authorization token, and make the user a
        # Django admin.
        token = create_and_login(True)

        # Try getting the list.
        client = Client()
        response = \
            client.get(TENANTS_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_200_OK)

    def test_get(self):
        """Get a tenant list when tenants exist.."""

        # The expected content, sans uuids.
        EXPECTED_CONTENT = \
            {'count': 2,
             'next': None,
             'previous': None,
             'results': [{'name': 'tenant 1',
                          'owner': 'John',
                          'owner_contact': ''},
                         {'name': 'tenant 2',
                          'owner': 'Alex',
                          'owner_contact': '867-5309'}]}

        # Create a user, save the authorization token, and make the user a
        # Django admin.
        token = create_and_login(True)

        # Make two tenants.
        Tenant.objects.create(name=EXPECTED_CONTENT["results"][0]["name"],
                              owner=EXPECTED_CONTENT["results"][0]["owner"])
        Tenant.objects.create(
            name=EXPECTED_CONTENT["results"][1]["name"],
            owner=EXPECTED_CONTENT["results"][1]["owner"],
            owner_contact=EXPECTED_CONTENT["results"][1]["owner_contact"])

        # Try getting the list, then check the results.
        client = Client()
        response = \
            client.get(TENANTS_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_CONTENT,
                                    True)

    @patch("djoser.utils.send_email")
    def test_post(self, send_email, number_tenant_admins=1):
        """Create a tenant.

        :param number_tenant_admin: The number of default_tenant_admins to use
                                    in this test. 0 = use none. 1 = use the
                                    normal number, i.e., one. > 1 = use this
                                    number, and the system should use one of
                                    them when it creates a tenant.

        """

        # The expected content, sans uuids.
        EXPECTED_CONTENT = \
            {'count': 3,
             'next': None,
             'previous': None,
             'results': [{'name': 'tenant 1',
                          'owner': 'John',
                          'owner_contact': 'eight six seven'},
                         {'name': 'tenant 2',
                          'owner': 'Alex',
                          'owner_contact': 'five three oh niiieeiiiin...'},
                         {'name': 'tenant 3',
                          'owner': 'Heywood Jablowme',
                          'owner_contact': '(666)666-6666'}]}

        # Create a user, save the authorization token, and make the user a
        # Django admin.
        token = create_and_login(True)

        # Create the desired number of default_tenant_admins.
        if number_tenant_admins == 0:
            # Run this test with no default tenant admins. The "current" user,
            # who's a Django admin, should be used as the default tenant_admin.
            default_tenant_admins = \
                [get_user_model().objects.get(username=TEST_USER[0])]
        else:
            # Run this test with one or more default_tenant_admins.
            default_tenant_admins = [get_user_model().objects.create_user(
                                     "Julianne_%d" % x,
                                     "oh@mama.com",
                                     "bueno",
                                     default_tenant_admin=True)
                                     for x in range(number_tenant_admins)]

        # Make the tenants, and check each POST's response.
        client = Client()
        for entry in EXPECTED_CONTENT["results"]:
            response = \
                client.post(TENANTS_URL,
                            json.dumps(entry),
                            content_type="application/json",
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_201_CREATED, entry)

        # Now get the list and see if it matches what we expect.
        response = \
            client.get(TENANTS_URL,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Check the response.
        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    EXPECTED_CONTENT,
                                    True)

        # Did the ViewSet attempt to send three emails?
        self.assertEqual(send_email.call_count, 3)

        # Did the e-mails seem to have the correct content?
        for entry in [0, 1, 2]:
            # tenant_admin email.
            self.assertIn(send_email.call_args_list[entry][0][0],
                          [x.email for x in default_tenant_admins])
            # from
            self.assertEqual(send_email.call_args_list[entry][0][1],
                             "webmaster@localhost")
            # site name
            self.assertEqual(
                send_email.call_args_list[entry][0][2]["site_name"],
                "YOUR_EMAIL_SITE_NAME")
            # The name of the newly created tenant.
            self.assertEqual(
                send_email.call_args_list[entry][0][2]["tenant_name"],
                EXPECTED_CONTENT["results"][entry]["name"])

    def test_post_no_default_admin(self):
        """Create a tenant when there's no default_tenant_admin in the
        system."""

        self.test_post(number_tenant_admins=0)

    def test_post_many_default_admins(self):
        """Create a tenant when there are multiple default tenant_admins in the
        system."""

        self.test_post(number_tenant_admins=5)

    def test_post_missing_fields(self):
        """Try creating a tenant without some required fields."""

        # The expected content, sans uuids.
        TEST = [{'owner': 'John', 'owner_contact': 'eight six seven'},
                {'name': 'tenant 2',
                 'owner_contact': 'five three oh niiieeiiiin...'},
                {'owner_contact': '(666)666-6666'}]

        # Create a user, save the authorization token, and make the user a
        # Django admin.
        token = create_and_login(True)

        # Create another user, and make them the default_tenant_admin.
        get_user_model().objects.create_user("Julianne",
                                             "oh@mama.com",
                                             "bueno",
                                             default_tenant_admin=True)

        # Make the tenants, and check each POST's response.
        client = Client()
        for entry in TEST:
            response = \
                client.post(TENANTS_URL,
                            json.dumps(entry),
                            content_type="application/json",
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            self.assertContains(response,
                                ':["This field is required."]}',
                                status_code=HTTP_400_BAD_REQUEST)

    @patch("djoser.utils.send_email")
    def test_post_duplicate_name(self, send_email):
        """Try creating a tenant with a duplicate name."""

        TEST = {'name': 'tenant 1',
                'owner': 'John',
                'owner_contact': 'eight six seven'}

        # Create a user, save the authorization token, and make the user a
        # Django admin.
        token = create_and_login(True)

        # Create a default_tenant_admins
        get_user_model().objects.create_user("Julianne",
                                             "oh@mama.com",
                                             "bueno",
                                             default_tenant_admin=True)

        # Make a tenant.
        client = Client()
        response = \
            client.post(TENANTS_URL,
                        json.dumps(TEST),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_201_CREATED)
        self.assertEqual(send_email.call_count, 1)

        # Now try making it again.
        response = \
            client.post(TENANTS_URL,
                        json.dumps(TEST),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_UNIQUE_NAME,
                            status_code=HTTP_400_BAD_REQUEST)


class TenantsId(Setup):
    """GETting, PUTting, and DELETEing to the /tenants/<id> endpoint."""

    def test_not_logged_in(self):
        """Getting a tenant, changing a tenant's attributes, or deleting a
        tenant without being logged in.

        """

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Try getting, putting, and deleting a tenant without a token.
        client = Client()
        responses = [client.get(TENANTS_ID_URL % tenant.uuid.hex),
                     client.put(TENANTS_ID_URL % tenant.uuid.hex,
                                json.dumps({"name": "foobar"}),
                                content_type="application/json"),
                     client.delete(TENANTS_ID_URL % tenant.uuid.hex)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

        # Try getting, putting, and deleting a tenant with a bad token.
        responses = [
            client.get(TENANTS_ID_URL % tenant.uuid.hex,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            client.put(TENANTS_ID_URL % tenant.uuid.hex,
                       json.dumps({"name": "foobar"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            client.delete(TENANTS_ID_URL % tenant.uuid.hex,
                          HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)
            ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_BAD_TOKEN,
                                status_code=HTTP_401_UNAUTHORIZED)

    def test_no_access(self):
        """Getting a tenant list, changing a tenant's attributes, or deleting a
        tenant without being an authorized user.

        For getting and changing, this means being a Django admin or the
        tenant's tenant_admin.

        For deleting, this means being a Django admin.

        """

        # Create a normal user and save the authorization token.
        token = create_and_login()

        # Make a two tenants
        tenants = [Tenant.objects.create(name='tenant %d' % i,
                                         owner='John',
                                         owner_contact='206.867.5309')
                   for i in range(2)]

        # Try getting, putting, and deleting a tenant as a normal user.
        client = Client()
        responses = [
            client.get(TENANTS_ID_URL % tenants[0].uuid.hex,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            client.put(TENANTS_ID_URL % tenants[0].uuid.hex,
                       json.dumps({"name": "foobar"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            client.delete(TENANTS_ID_URL % tenants[0].uuid.hex,
                          HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
            ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

        # Try deleting a tenant as a tenant_admin
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenants[1]
        user.save()

        response = \
            client.delete(TENANTS_ID_URL % tenants[0].uuid.hex,
                          HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Try deleting a tenant as a tenant_admin of the tenant being deleted.
        user.tenant = tenants[0]
        user.save()

        response = \
            client.delete(TENANTS_ID_URL % tenants[0].uuid.hex,
                          HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_no_tenant(self):
        """Getting a tenant list, changing a tenant's attributes, or deleting a
        tenant, when the tenant doesn't exist."""

        # Create a Django admin user.
        token = create_and_login(True)

        # Make a tenant, save its uuid, then delete it.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        uuid = tenant.uuid.hex
        tenant.delete()

        # Try getting, putting, and deleting a tenant that doesn't exist.
        client = Client()
        responses = [
            client.get(TENANTS_ID_URL % uuid,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            client.put(TENANTS_ID_URL % uuid,
                       json.dumps({"name": "foobar"}),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            client.delete(TENANTS_ID_URL % uuid,
                          HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
            ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_get(self):
        """Get a tenant record."""

        # The expected result, sans uuid.
        EXPECTED_RESULT = {"name": "tenant",
                           "owner": "John",
                           "owner_contact": "206.867.5309"}

        def get_tenant(token):
            """Get the tenant using the token, and check the response."""

            client = Client()
            response = \
                client.get(TENANTS_ID_URL % tenant.uuid.hex,
                           HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_200_OK, EXPECTED_RESULT)

        # Make a tenant
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a Django admin user, and a normal user who's a tenant_admin of
        # the tenant.
        token = create_and_login(True)
        get_user_model().objects.create_user("a",
                                             "a@b.com",
                                             "a",
                                             tenant=tenant,
                                             tenant_admin=True)

        # Test getting the tenant as a Django admin, then as the tenant_admin
        # of the tenant. Both should work.
        get_tenant(token)
        token = login('a', 'a')
        get_tenant(token)

    def test_put(self):
        """Change a tenant's attributes."""

        # The expected result, sans uuid.
        INITIAL_TENANT = {"name": "tenant",
                          "owner": "John",
                          "owner_contact": "206.867.5309"}
        NEW_TENANT = {"name": "TENant",
                      "owner": "Bob",
                      "owner_contact": "212.867.5309"}

        def get_tenant(token, expected):
            """Get the tenant using the token and check the response."""

            client = Client()
            response = \
                client.get(TENANTS_ID_URL % tenant.uuid.hex,
                           HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_200_OK, expected)

        # Make a tenant
        tenant = Tenant.objects.create(**INITIAL_TENANT)

        # Create a Django admin user, and a normal user who's a tenant_admin of
        # the tenant.
        token = create_and_login(True)
        get_user_model().objects.create_user("a",
                                             "a@b.com",
                                             "a",
                                             tenant=tenant,
                                             tenant_admin=True)

        # Test changing the tenant as a Django admin.
        client = Client()
        response = \
            client.put(TENANTS_ID_URL % tenant.uuid.hex,
                       json.dumps(NEW_TENANT),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, NEW_TENANT)
        get_tenant(token, NEW_TENANT)

        # Test changing the tenant as a tenant admin.
        token = login('a', 'a')
        response = \
            client.put(TENANTS_ID_URL % tenant.uuid.hex,
                       json.dumps(NEW_TENANT),
                       content_type="application/json",
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, NEW_TENANT)
        get_tenant(token, NEW_TENANT)

    def test_delete(self):
        """Delete a tenant."""

        # Create a Django admin user, and a tenant.
        token = create_and_login(True)
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Delete the tenant.
        client = Client()
        response = \
            client.delete(TENANTS_ID_URL % tenant.uuid.hex,
                          HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_204_NO_CONTENT)

        # Make sure the tenant no longer exists.
        self.assertEqual(Tenant.objects.count(), 0)


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
        client = Client()
        responses = [client.get(TENANTS_ID_USERS_URL % tenant.uuid.hex),
                     client.post(TENANTS_ID_USERS_URL % tenant.uuid.hex,
                                 json.dumps({"username": "fool",
                                             "password": "fooll",
                                             "email": "a@b.com"}),
                                 content_type="application/json")]

        for response in responses:
            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        # Try the GET and POST with a bad authorization token.
        responses = \
            [client.get(TENANTS_ID_USERS_URL % tenant.uuid.hex,
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
             client.post(TENANTS_ID_USERS_URL % tenant.uuid.hex,
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
        # tenant_admin.token.
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.save()

        # Try the GET and POST.
        client = Client()
        responses = [
            client.get(TENANTS_ID_USERS_URL % tenant.uuid.hex,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            client.post(TENANTS_ID_USERS_URL % tenant.uuid.hex,
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
        token = create_and_login(True)

        # Make a tenant, save its uuid, then delete it.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        tenant.delete()

        # Try the GET and POST to a tenant that doesn't exist.
        client = Client()
        responses = [
            client.get(TENANTS_ID_USERS_URL % tenant.uuid.hex,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            client.post(TENANTS_ID_USERS_URL % tenant.uuid.hex,
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

        expected_result = [{"username": "a",
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

        # Get the tenant's user list and check the response.
        client = Client()
        response = \
            client.get(TENANTS_ID_USERS_URL % tenant.uuid.hex,
                       HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_200_OK)

        response_content = json.loads(response.content)

        for entry in response_content["results"]:
            self.assertIsInstance(entry["uuid"], basestring)
            self.assertGreaterEqual(len(entry["uuid"]), 32)

            del entry["uuid"]

        for entry in expected_result:
            entry["tenant"] = tenant.pk

        self.assertItemsEqual(response_content["results"], expected_result)

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

            client = Client()
            response = \
                client.post(TENANTS_ID_USERS_URL % tenant.uuid.hex,
                            json.dumps(TENANT_USERS[user_number]),
                            content_type="application/json",
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response,
                                        HTTP_201_CREATED,
                                        expected_result[user_number])

            # Was email send to the new user?
            self.assertEqual(send_email.call_count, 1)

            # Did the e-mail seem to have the correct content?
            self.assertEqual(send_email.call_args[0][0],
                             TENANT_USERS[user_number]["email"])
            self.assertEqual(send_email.call_args[0][1],
                             "webmaster@localhost")  # from
            self.assertEqual(send_email.call_args[0][2]["site_name"],
                             "YOUR_EMAIL_SITE_NAME")  # The site name
            self.assertIn("tenant", send_email.call_args[0][2]["tenant_name"])
            self.assertEqual(send_email.call_args[1],
                             {'plain_body_template_name': 'new_tenant_body.txt',
                              'subject_template_name': 'new_tenant.txt'})

        expected_result = [{"username": "a",
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

        expected_result[0]["tenant"] = tenant.pk
        expected_result[1]["tenant"] = tenant.pk

        # Create a user who's the tenant_admin of this tenant, and log him in.
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Create one user in this empty tenant and check the result.
        create(0)

        # Now try it again.
        send_email.reset_mock()
        create(1)


class TenantsIdUsersId(Setup):
    """Logging out."""

    def test_not_logged_in_no_creds(self):
        """Logging out when a user is not logged in, and not giving any
        credentials."""

        client = Client()
        response = client.post(LOGOUT_URL)

        self.assertContains(response,
                            CONTENT_NOT_BLANK,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_not_logged_in(self):
        """Logging out when a user is not logged in, with username and
        password."""

        create_and_login()

        # Logout. Then logout again with username and password.
        # pylint: disable=E1101
        client = Client()
        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")
        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertIsInstance(response.data["auth_token"], basestring)

        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertIsInstance(response.data["auth_token"], basestring)

    def test_logout(self):
        """Log out."""

        create_and_login()

        # pylint: disable=E1101
        client = Client()
        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertIsInstance(response.data["auth_token"], basestring)


class TenantsIdAddUsers(Setup):
    """Test changing the user password."""

    def test_not_logged_in(self):
        """The user isn't logged in.

        The user should be able to change their password.

        """

        # Create a user and log them out.
        token = create_and_login()
        client = Client()
        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now try changing the password.
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "current_password": TEST_USER[2],
                                    "new_password": "boom"}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test logging in using the new password.
        login(TEST_USER[0], "boom")

        # Verify that we can't log in using the old password.
        response = client.post(LOGIN_URL,
                               {"username": TEST_USER[0],
                                "password": TEST_USER[2]})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_missing_token(self):
        """The change password request doesn't have an authentication token."""

        # Create a user and log them in.
        create_and_login()

        # Try changing the password.
        client = Client()
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "current_password": TEST_USER[2],
                                    "new_password": "boom"}),
                        content_type="application/json")

        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)

        # Test logging in using the old password.
        login(TEST_USER[0], TEST_USER[2])

        # Verify that we can't log in using the new password.
        response = client.post(LOGIN_URL,
                               {"username": TEST_USER[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_bad_token(self):
        """The change password request has a bad authentication token."""

        # Create a user and log them in.
        bad_token = create_and_login().replace('9', '8').replace('4', '3')

        # Try changing the password.
        client = Client()
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "current_password": TEST_USER[2],
                                    "new_password": "boom"}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % bad_token)

        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)

        # Test logging in using the old password.
        login(TEST_USER[0], TEST_USER[2])

        # Verify that we can't log in using the new password.
        response = client.post(LOGIN_URL,
                               {"username": TEST_USER[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_no_current_password(self):
        """The change password request doesn't have a current password."""

        # Create a user and log them in.
        token = create_and_login()

        # Try changing the password.
        client = Client()
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "new_password": "boom"}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test logging in using the old password.
        login(TEST_USER[0], TEST_USER[2])

        # Verify that we can't log in using the new password.
        response = client.post(LOGIN_URL,
                               {"username": TEST_USER[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_bad_current_password(self):
        """The change password request has a bad current password."""

        # Create a user and log them in.
        token = create_and_login()

        # Try changing the password.
        client = Client()
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "current_password": "rockmeamadeus",
                                    "new_password": "boom"}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test logging in using the old password.
        login(TEST_USER[0], TEST_USER[2])

        # Verify that we can't log in using the new password.
        response = client.post(LOGIN_URL,
                               {"username": TEST_USER[0], "password": "boom"})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)

    def test_no_new_password(self):
        """The change password request doesn't have a new password."""

        # Create a user and log them in.
        token = create_and_login()

        # Try changing the password.
        client = Client()
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "current_password": TEST_USER[2]}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test logging in using the old password.
        login(TEST_USER[0], TEST_USER[2])

    def test_change_password(self):
        """Change the current user's password."""

        # Create a user.
        token = create_and_login()

        # Try changing the password.
        client = Client()
        response = \
            client.post(PASSWORD_URL,
                        json.dumps({"username": TEST_USER[0],
                                    "current_password": TEST_USER[2],
                                    "new_password": "boom"}),
                        content_type="application/json",
                        HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test logging in using the new password.
        login(TEST_USER[0], "boom")

        # Verify that we can't log in using the old password.
        response = client.post(LOGIN_URL,
                               {"username": TEST_USER[0],
                                "password": TEST_USER[2]})

        self.assertContains(response,
                            CONTENT_NON_FIELD_ERRORS,
                            status_code=HTTP_400_BAD_REQUEST)


class TenantsIdUsersRemoveUsers(Setup):
    """Test resetting the user password."""

    def _check_response(self, response, send_email):
        """A simple response checker for this test class."""

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test that send_email was called only once, and check some of the
        # arguments it was called with.
        self.assertEqual(send_email.call_count, 1)
        self.assertEqual(send_email.call_args[0][0], TEST_USER[1])  # email
        self.assertEqual(send_email.call_args[0][1],
                         "webmaster@localhost")  # from
        self.assertEqual(send_email.call_args[0][2]["site_name"],
                         "YOUR_EMAIL_SITE_NAME")  # The site name
        self.assertIn("#/password/reset/confirm/",
                      send_email.call_args[0][2]["url"])  # The confirm url
        # A simple check that the confirmation URL is about the right length.
        self.assertGreater(len(send_email.call_args[0][2]["url"]),
                           len("#/password/reset/confirm/") + 24)
        self.assertEqual(send_email.call_args[0][2]["user"].username,
                         TEST_USER[0])  # username

    @patch("djoser.utils.send_email")
    def test_not_logged_in(self, send_email):
        """The user isn't logged in.

        The user should be able to generated a reset-password email. No
        authentication token is needed.

        """

        # Create a user and log them out.
        create_and_login()
        client = Client()
        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now try resetting the password.
        response = \
            client.post(PASSWORD_RESET_URL,
                        json.dumps({"email": TEST_USER[1]}),
                        content_type="application/json")

        self._check_response(response, send_email)

    @patch("djoser.utils.send_email")
    def test_logged_in(self, send_email):
        """The user is logged in.

        No authentication token is needed.

        """

        # Create a user
        create_and_login()
        client = Client()

        # Try resetting the password.
        response = \
            client.post(PASSWORD_RESET_URL,
                        json.dumps({"email": TEST_USER[1]}),
                        content_type="application/json")

        self._check_response(response, send_email)

    @patch("djoser.utils.send_email")
    def test_no_email(self, send_email):
        """The reset-password request doesn't have an email."""

        # Create a user and log them out.
        create_and_login()
        client = Client()

        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now try resetting the password.
        response = \
            client.post(PASSWORD_RESET_URL,
                        content_type="application/json")

        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        # Test that send_email was not called.
        self.assertEqual(send_email.call_count, 0)

    @patch("djoser.utils.send_email")
    def test_bad_email(self, send_email):
        """The reset-password password request has a bad email.

        The server returns a 200 status code, but does not send any email.

        """

        # Create a user and log them out.
        create_and_login()
        client = Client()

        response = client.post(LOGOUT_URL,
                               json.dumps({"username": TEST_USER[0],
                                           "password": TEST_USER[2]}),
                               content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Now try resetting the password.
        response = \
            client.post(PASSWORD_RESET_URL,
                        json.dumps({"email": "zippl@nyahnyah.org"}),
                        content_type="application/json")

        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test that send_email was not called.
        self.assertEqual(send_email.call_count, 0)
