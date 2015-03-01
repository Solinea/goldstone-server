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
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_403_FORBIDDEN, \
    HTTP_204_NO_CONTENT
from goldstone.test_utils import Setup, create_and_login, login, \
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, CONTENT_NO_CREDENTIALS, \
    check_response_without_uuid, TEST_USER, CONTENT_NO_PERMISSION, \
    CONTENT_UNIQUE_NAME, CONTENT_PERMISSION_DENIED, BAD_TOKEN, BAD_UUID, \
    CONTENT_NOT_BLANK_USERNAME
from .models import Tenant

# URLs used by this module.
TENANTS_URL = "/tenants"
TENANTS_ID_URL = TENANTS_URL + '/%s'
TENANTS_ID_USERS_URL = TENANTS_ID_URL + "/users"
TENANTS_ID_USERS_ID_URL = TENANTS_ID_USERS_URL + "/%s"


class Tenants(Setup):
    """Getting a list of tenants, and creating a tenant."""

    def test_not_logged_in(self):
        """Getting a tenant list, or creating a tenant, without being logged
        in."""

        # Try getting a tenant list with no token.
        response = self.client.get(TENANTS_URL)

        self.assertContains(response,
                            CONTENT_NO_PERMISSION,
                            status_code=HTTP_403_FORBIDDEN)

        # Try getting a tenant list with a bogus token.
        response = self.client.get(
            TENANTS_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)

        self.assertContains(response,
                            CONTENT_BAD_TOKEN,
                            status_code=HTTP_401_UNAUTHORIZED)

        # Try creating a tenant with no token.
        response = self.client.post(TENANTS_URL,
                                    json.dumps({"name": "foobar",
                                                "owner": "Debra Winger"}),
                                    content_type="application/json")

        self.assertContains(response,
                            CONTENT_NO_PERMISSION,
                            status_code=HTTP_403_FORBIDDEN)

        # Try creating a tenant with a bogus token.
        response = self.client.post(
            TENANTS_URL,
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
            response = self.client.get(
                TENANTS_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            self.assertContains(response,
                                CONTENT_NO_PERMISSION,
                                status_code=HTTP_403_FORBIDDEN)

            # Try creating a tenant.
            response = self.client.post(
                TENANTS_URL,
                json.dumps({"name": "foobar",
                            "owner": "Debra Winger"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            self.assertContains(response,
                                CONTENT_NO_PERMISSION,
                                status_code=HTTP_403_FORBIDDEN)

        # Create a user and get the authorization token.
        token = create_and_login()

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
        response = self.client.get(
            TENANTS_URL,
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
        response = self.client.get(
            TENANTS_URL,
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
        for entry in EXPECTED_CONTENT["results"]:
            response = self.client.post(
                TENANTS_URL,
                json.dumps(entry),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_201_CREATED, entry)

        # Now get the list and see if it matches what we expect.
        response = self.client.get(
            TENANTS_URL,
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
        for entry in TEST:
            response = self.client.post(
                TENANTS_URL,
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
        response = self.client.post(
            TENANTS_URL,
            json.dumps(TEST),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_201_CREATED)
        self.assertEqual(send_email.call_count, 1)

        # Now try making it again.
        response = self.client.post(
            TENANTS_URL,
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
        responses = [self.client.get(TENANTS_ID_URL % tenant.uuid.hex),
                     self.client.put(TENANTS_ID_URL % tenant.uuid.hex,
                                     json.dumps({"name": "foobar"}),
                                     content_type="application/json"),
                     self.client.delete(TENANTS_ID_URL % tenant.uuid.hex)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

        # Try getting, putting, and deleting a tenant with a bad token.
        responses = [
            self.client.get(
                TENANTS_ID_URL % tenant.uuid.hex,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.put(
                TENANTS_ID_URL % tenant.uuid.hex,
                json.dumps({"name": "foobar"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.delete(
                TENANTS_ID_URL % tenant.uuid.hex,
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
        responses = [
            self.client.get(
                TENANTS_ID_URL % tenants[0].uuid.hex,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_URL % tenants[0].uuid.hex,
                json.dumps({"name": "foobar"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_URL % tenants[0].uuid.hex,
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

        response = self.client.delete(
            TENANTS_ID_URL % tenants[0].uuid.hex,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Try deleting a tenant as a tenant_admin of the tenant being deleted.
        user.tenant = tenants[0]
        user.save()

        response = self.client.delete(
            TENANTS_ID_URL % tenants[0].uuid.hex,
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
        responses = [
            self.client.get(
                TENANTS_ID_URL % uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_URL % uuid,
                json.dumps({"name": "foobar"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_URL % uuid,
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

            response = self.client.get(
                TENANTS_ID_URL % tenant.uuid.hex,
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

            response = self.client.get(
                TENANTS_ID_URL % tenant.uuid.hex,
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
        response = self.client.put(
            TENANTS_ID_URL % tenant.uuid.hex,
            json.dumps(NEW_TENANT),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, NEW_TENANT)
        get_tenant(token, NEW_TENANT)

        # Test changing the tenant as a tenant admin.
        token = login('a', 'a')
        response = self.client.put(
            TENANTS_ID_URL % tenant.uuid.hex,
            json.dumps(NEW_TENANT),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, NEW_TENANT)
        get_tenant(token, NEW_TENANT)

    def test_delete(self):
        """Delete a tenant."""

        # Create a Django admin user, and a tenant, and a tenant_admin.
        token = create_and_login(True)
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        user = get_user_model().objects.create_user(username="Traci",
                                                    password="xxx")
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Delete the tenant.  This will also delete the users who belong to the
        # tenant.
        response = self.client.delete(
            TENANTS_ID_URL % tenant.uuid.hex,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_204_NO_CONTENT)

        # Make sure the tenant and tenant_admin no longer exist.
        self.assertEqual(Tenant.objects.count(), 0)
        self.assertFalse(get_user_model().objects.filter(username="Traci"))


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
        responses = [self.client.get(TENANTS_ID_USERS_URL % tenant.uuid.hex),
                     self.client.post(TENANTS_ID_USERS_URL % tenant.uuid.hex,
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
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
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
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
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
        responses = [
            self.client.get(
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
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

        # Get the tenant's user list and check the response. We do a partial
        # check of the uuid, date_joined, and last_login keys. They must exist,
        # and their values must be strings, and the UUID ought to be >= 32
        # characters.
        response = self.client.get(
            TENANTS_ID_USERS_URL % tenant.uuid.hex,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

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

            response = self.client.post(
                TENANTS_ID_USERS_URL % tenant.uuid.hex,
                json.dumps(TENANT_USERS[user_number]),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response,
                                        HTTP_201_CREATED,
                                        expected_result[user_number],
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
                             "YOUR_EMAIL_SITE_NAME")  # The site name
            self.assertIn("tenant", send_email.call_args[0][2]["tenant_name"])
            self.assertEqual(send_email.call_args[1],
                             {'plain_body_template_name':
                              'new_tenant_body.txt',
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
                                     (tenant.uuid.hex, user.uuid.hex)),
                     self.client.put(TENANTS_ID_USERS_ID_URL %
                                     (tenant.uuid.hex, user.uuid.hex),
                                     json.dumps({"username": "fool",
                                                 "password": "fooll",
                                                 "email": "a@b.com"}),
                                     content_type="application/json"),
                     self.client.delete(TENANTS_ID_USERS_ID_URL %
                                        (tenant.uuid.hex, user.uuid.hex)),
                     ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        # Try again with a bad authorization token.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.put(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.delete(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
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
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
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

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Try GET, PUT, and DELETE to a nonexistent tenant.
        responses = [
            self.client.get(
                TENANTS_ID_USERS_ID_URL % (BAD_UUID, user.uuid.hex),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_USERS_ID_URL % (BAD_UUID, user.uuid.hex),
                json.dumps({"username": "fool",
                            "password": "fooll",
                            "email": "a@b.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_USERS_ID_URL % (BAD_UUID, user.uuid.hex),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_get_no_user(self):
        """Get a user that does not exist from a tenant."""

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Try GETing a nonexistent user from this tenant.
        response = self.client.get(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid.hex, BAD_UUID),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_get(self):
        """Get a user."""

        # Expected results, sans tenant and uuid keys.
        expected_results = [{"username": "fred",
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

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        expected_results[0]["tenant"] = tenant.pk
        expected_results[1]["tenant"] = tenant.pk

        # Create a tenant_admin of the tenant.
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Try GETing the tenant admin.
        response = self.client.get(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid.hex, user.uuid.hex),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_results[0],
                                    extra_keys=["last_login", "date_joined"])

        # Add another user to the tenant, and get her.
        user = get_user_model().objects.create_user(username="Traci",
                                                    password='a')
        user.tenant = tenant
        user.save()

        # Try GETing the second user.
        response = self.client.get(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid.hex, user.uuid.hex),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_results[1],
                                    extra_keys=["last_login", "date_joined"])

    def test_put_no_user(self):
        """Update a user of an empty tenant, or a user that does not exist."""

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.tenant_admin = True
        user.save()

        # Try PUTing to a nonexistent user in this tenant.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, BAD_UUID),
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

        # Expected responses, sans uuid and tenant fields.
        expected_responses = [
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

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        expected_responses[0]["tenant"] = tenant.pk
        expected_responses[1]["tenant"] = tenant.pk

        # Create a tenant_admin of the tenant, and a normal user of the tenant.
        token = create_and_login()

        admin_user = get_user_model().objects.get(username=TEST_USER[0])
        admin_user.tenant = tenant
        admin_user.tenant_admin = True
        admin_user.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant
        user.save()

        # Try PUTing to the user with no username.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
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
                TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
                json.dumps(entry),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response,
                                        HTTP_200_OK,
                                        expected_responses[i],
                                        extra_keys=["last_login",
                                                    "date_joined"])

        # Try PUTing to the user on a field that's not allowed to be changed.
        # The response should be the same as the "unrecognized field" case.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
            json.dumps({"username": "Beth",
                        "billybopfoo": "blaRGH",
                        "tenant_admin": True,
                        "default_tenant_admin": True,
                        "first_name": "Michelle"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_responses[1],
                                    extra_keys=["last_login", "date_joined"])

    def test_put(self):
        """Update a user in a tenant."""

        # Expected response, sans uuid and tenant.
        expected_response = {"username": "Beth",
                             "first_name": "1",
                             "last_name": "2",
                             "email": "x@y.com",
                             "tenant_admin": False,
                             "default_tenant_admin": False}

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        expected_response["tenant"] = tenant.pk

        # Create a tenant_admin of the tenant, and a normal user of the tenant.
        token = create_and_login()

        admin_user = get_user_model().objects.get(username=TEST_USER[0])
        admin_user.tenant = tenant
        admin_user.tenant_admin = True
        admin_user.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant
        user.save()

        # Try PUTing to the user.
        response = self.client.put(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
            json.dumps({"username": "Beth",
                        "first_name": '1',
                        "last_name": '2',
                        "email": "x@y.com"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response,
                                    HTTP_200_OK,
                                    expected_response,
                                    extra_keys=["last_login", "date_joined"])

    def test_delete_default_tnnt_admin(self):
        """Try deleting the system's default tenant admin."""

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a default_tenant_admin, a tenant_admin, and a normal user.
        token = create_and_login()

        admin_user = get_user_model().objects.get(username=TEST_USER[0])
        admin_user.tenant = tenant
        admin_user.tenant_admin = True
        admin_user.save()

        default_tenant_admin = \
            get_user_model().objects.create_user(username="Amber",
                                                 password="xxx")
        default_tenant_admin.tenant = tenant
        default_tenant_admin.default_tenant_admin = True
        default_tenant_admin.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant
        user.save()

        # Try DELETE on the default_admin_user.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL %
            (tenant.uuid.hex, default_tenant_admin.uuid.hex),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 3)

    def test_delete_self(self):
        """Try deleting oneself."""

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin.
        token = create_and_login()

        admin_user = get_user_model().objects.get(username=TEST_USER[0])
        admin_user.tenant = tenant
        admin_user.tenant_admin = True
        admin_user.save()

        # Try DELETE on oneself.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, admin_user.uuid.hex),
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

        # Create a default_tenant_admin, a tenant_admin, and a normal user of
        # another tenant.
        token = create_and_login()

        admin_user = get_user_model().objects.get(username=TEST_USER[0])
        admin_user.tenant = tenant
        admin_user.tenant_admin = True
        admin_user.save()

        default_tenant_admin = \
            get_user_model().objects.create_user(username="Amber",
                                                 password="xxx")
        default_tenant_admin.tenant = tenant
        default_tenant_admin.default_tenant_admin = True
        default_tenant_admin.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant_2
        user.save()

        # Try DELETE on the normal user.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 3)

    def test_delete(self):
        """Delete a user in a tenant."""

        # Make a tenant, save its uuid.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a default_tenant_admin, a tenant_admin, and a normal user.
        token = create_and_login()

        admin_user = get_user_model().objects.get(username=TEST_USER[0])
        admin_user.tenant = tenant
        admin_user.tenant_admin = True
        admin_user.save()

        default_tenant_admin = \
            get_user_model().objects.create_user(username="Amber",
                                                 password="xxx")
        default_tenant_admin.tenant = tenant
        default_tenant_admin.default_tenant_admin = True
        default_tenant_admin.save()

        user = get_user_model().objects.create_user(username="Beth",
                                                    password='x')
        user.tenant = tenant
        user.save()

        # Try DELETE on the normal user.
        response = self.client.delete(
            TENANTS_ID_USERS_ID_URL % (tenant.uuid.hex, user.uuid.hex),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_204_NO_CONTENT)

        # Ensure we have the right number of user accounts
        self.assertEqual(get_user_model().objects.count(), 2)
