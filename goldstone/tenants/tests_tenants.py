"""Unit tests for /tenants and /tenants/<id> end points."""
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
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, check_response_without_uuid, \
    TEST_USER, CONTENT_NO_PERMISSION, CONTENT_UNIQUE_NAME, \
    CONTENT_PERMISSION_DENIED, BAD_TOKEN
from .models import Tenant

# URLs used by this module.
TENANTS_URL = "/tenants"
TENANTS_ID_URL = TENANTS_URL + '/%s'


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
        """Getting a tenant list, or creating a tenant, as a normal user."""

        # Create a user and get the authorization token.
        token = create_and_login()

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
            json.dumps({"name": "foobar", "owner": "Debra Winger"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_NO_PERMISSION,
                            status_code=HTTP_403_FORBIDDEN)

    def test_get_no_list(self):
        """Get a tenant list when no tenant yet exists."""

        EXPECTED_CONTENT = \
            '{"count":0,"next":null,"previous":null,"results":[]}'

        # Create a user, save the authorization token, and make the user a
        # Django admin.
        token = create_and_login(is_superuser=True)

        # Try getting the list.
        response = self.client.get(
            TENANTS_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            EXPECTED_CONTENT,
                            status_code=HTTP_200_OK)

    def test_get_django_admin(self):
        """Get a tenant list when tenants exist, as a Django admin."""

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

        # Create a Django admin user and log her in.
        token = create_and_login(is_superuser=True)

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

    def test_get_tenant_admin(self):
        """Get a tenant list when tenants exist, as a tenant_admin."""

        # The expected content, sans uuids.
        EXPECTED_CONTENT = {'count': 1,
                            'next': None,
                            'previous': None,
                            'results': [{'name': 'tenant 1',
                                         'owner': 'John',
                                         'owner_contact': ''}],
                            }

        # The tenants we'll create. The first one will be owned by the
        # tenant_admin, and the rest will not.
        TENANTS = [{"name": EXPECTED_CONTENT["results"][0]["name"],
                    "owner": EXPECTED_CONTENT["results"][0]["owner"]},
                   {"name": "Mary Louise", "owner": "Parker"},
                   {"name": "Angelina", "owner": "Jolie"},
                   {"name": "Debra", "owner": "Winger"},
                   ]

        # Make four tenants.
        tenants = [Tenant.objects.create(**x) for x in TENANTS]

        # Create a tenant_admin user and log her in.
        token = create_and_login(tenant=tenants[0])

        # Get the list of tenants. Only one being adminstered by the
        # tenant_admin should be in the list.
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
        from django.conf import settings

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
        token = create_and_login(is_superuser=True)

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
                settings.DJOSER["SITE_NAME"])
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
        token = create_and_login(is_superuser=True)

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
        token = create_and_login(is_superuser=True)

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

        # pylint: disable=E1101
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
        responses = [self.client.get(TENANTS_ID_URL % tenant.uuid),
                     self.client.put(TENANTS_ID_URL % tenant.uuid,
                                     json.dumps({"name": "foobar"}),
                                     content_type="application/json"),
                     self.client.delete(TENANTS_ID_URL % tenant.uuid)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

        # Try getting, putting, and deleting a tenant with a bad token.
        responses = [
            self.client.get(
                TENANTS_ID_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.put(
                TENANTS_ID_URL % tenant.uuid,
                json.dumps({"name": "foobar"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.delete(
                TENANTS_ID_URL % tenant.uuid,
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
                TENANTS_ID_URL % tenants[0].uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_URL % tenants[0].uuid,
                json.dumps({"name": "foobar"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_URL % tenants[0].uuid,
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
            TENANTS_ID_URL % tenants[0].uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Try deleting a tenant as a tenant_admin of the tenant being deleted.
        user.tenant = tenants[0]
        user.save()

        response = self.client.delete(
            TENANTS_ID_URL % tenants[0].uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_no_tenant(self):
        """Getting a tenant list, changing a tenant's attributes, or deleting a
        tenant, when the tenant doesn't exist."""

        # Create a Django admin user.
        token = create_and_login(is_superuser=True)

        # Make a tenant, save its uuid, then delete it.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        uuid = tenant.uuid
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
                TENANTS_ID_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_200_OK, EXPECTED_RESULT)

        # Make a tenant
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a Django admin user, and a normal user who's a tenant_admin of
        # the tenant.
        token = create_and_login(is_superuser=True)
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
                TENANTS_ID_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_200_OK, expected)

        # Make a tenant
        tenant = Tenant.objects.create(**INITIAL_TENANT)

        # Create a Django admin user, and a normal user who's a tenant_admin of
        # the tenant.
        token = create_and_login(is_superuser=True)
        get_user_model().objects.create_user("a",
                                             "a@b.com",
                                             "a",
                                             tenant=tenant,
                                             tenant_admin=True)

        # Test changing the tenant as a Django admin.
        response = self.client.put(
            TENANTS_ID_URL % tenant.uuid,
            json.dumps(NEW_TENANT),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, NEW_TENANT)
        get_tenant(token, NEW_TENANT)

        # Test changing the tenant as a tenant admin.
        token = login('a', 'a')
        response = self.client.put(
            TENANTS_ID_URL % tenant.uuid,
            json.dumps(NEW_TENANT),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, NEW_TENANT)
        get_tenant(token, NEW_TENANT)

    def test_delete(self):
        """Delete a tenant, Django admin is not in the tenant."""

        # Create a Django admin user, and a tenant, and a tenant_admin.
        token = create_and_login(is_superuser=True)
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
            TENANTS_ID_URL % tenant.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_204_NO_CONTENT)

        # Make sure the tenant and tenant_admin no longer exist, and the Django
        # admin still does.
        self.assertEqual(Tenant.objects.count(), 0)
        self.assertFalse(get_user_model().objects
                         .filter(username="Traci").exists())
        self.assertTrue(get_user_model().objects
                        .filter(username=TEST_USER[0]).exists())

    def test_delete_django_admin(self):
        """Delete a tenant, where the Django admin belongs to the tenant.

        The Django admin account should not be deleted.

        """

        # Create a Django admin user and a tenant.
        token = create_and_login(is_superuser=True)
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Make the Django admin a tenant member.
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.save()

        # Make a user who's a tenant member, and one who's not.
        get_user_model().objects.create_user(username="John",
                                             password="xxx",
                                             tenant=tenant)
        get_user_model().objects.create_user(username="B", password="x")

        # Delete the tenant.  This should delete the users who belong to the
        # tenant, but not the Django admin.
        response = self.client.delete(
            TENANTS_ID_URL % tenant.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_204_NO_CONTENT)

        # Make sure the tenant and non-Django admin tenant members are gone,
        # and the Django admin and non-members are still here. The Django admin
        # should belong to no tenant.
        self.assertEqual(Tenant.objects.count(), 0)
        self.assertEqual(get_user_model().objects.count(), 2)

        self.assertTrue(get_user_model().objects
                        .filter(username=TEST_USER[0]).exists())
        self.assertIsNone(get_user_model().objects
                          .get(username=TEST_USER[0]).tenant)
        self.assertTrue(get_user_model().objects.filter(username="B").exists())
        self.assertFalse(get_user_model().objects
                         .filter(username="John").exists())

    def test_delete_default_tenant(self):
        """Delete a tenant, when the default_tenant_admin belongs to the
        tenant.

        The default_tenant_admin should not be deleted.

        """

        # Create a Django admin user and a tenant.
        token = create_and_login(is_superuser=True)
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Make a user who's a tenant member and default_tenant_admin, and one
        # who's not.
        get_user_model().objects.create_user(username="John",
                                             password="xxx",
                                             tenant=tenant,
                                             default_tenant_admin=True,
                                             tenant_admin=True)
        get_user_model().objects.create_user(username="B", password="x")

        # Delete the tenant.  This should delete the users who belong to the
        # tenant, but not the default_tenant_admin.
        response = self.client.delete(
            TENANTS_ID_URL % tenant.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_204_NO_CONTENT)

        # Check who's still here.
        self.assertEqual(Tenant.objects.count(), 0)
        self.assertEqual(get_user_model().objects.count(), 3)

        self.assertTrue(get_user_model().objects
                        .filter(username=TEST_USER[0]).exists())
        self.assertIsNone(get_user_model().objects
                          .get(username=TEST_USER[0]).tenant)
        self.assertTrue(get_user_model().objects.filter(username="B").exists())
        self.assertIsNone(get_user_model().objects.get(username="B").tenant)
        self.assertTrue(get_user_model().objects
                        .filter(username="John").exists())
