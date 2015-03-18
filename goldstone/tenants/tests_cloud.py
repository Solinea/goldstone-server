"""Unit tests for /tenants/<id>/cloud endpoints."""
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
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, \
    HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_403_FORBIDDEN, \
    HTTP_204_NO_CONTENT
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD, CONTENT_BAD_TOKEN, CONTENT_NO_CREDENTIALS, \
    check_response_without_uuid, TEST_USER, CONTENT_PERMISSION_DENIED, \
    BAD_TOKEN, BAD_UUID
from .models import Tenant, Cloud
from .tests_tenants import TENANTS_ID_URL

# HTTP response content.
CONTENT_MISSING_OS_USERNAME = '"username":["This field is required."]'
CONTENT_MISSING_OS_NAME = '"tenant_name":["This field is required."]'
CONTENT_MISSING_OS_PASSWORD = '"password":["This field is required."]'
CONTENT_MISSING_OS_URL = '"auth_url":["This field is required."]'

# URLs used by this module.
TENANTS_ID_CLOUD_URL = TENANTS_ID_URL + "/cloud"
TENANTS_ID_CLOUD_ID_URL = TENANTS_ID_CLOUD_URL + "/%s"


class TenantsIdCloud(Setup):
    """Listing the OpenStack clouds of a tenant, and creating a new OpenStack
    cloud in a tenant."""

    def test_not_logged_in(self):
        """Getting the tenant clouds, or creating a tenant cloud, without being
        logged in."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Try the GET and POST without an authorization token.
        responses = \
            [self.client.get(TENANTS_ID_CLOUD_URL % tenant.uuid),
             self.client.post(TENANTS_ID_CLOUD_URL % tenant.uuid,
                              json.dumps({"tenant_name": 'a',
                                          "username": 'b',
                                          "password": 'c',
                                          "auth_url":
                                          "http://d.com"}),
                              content_type="application/json")]

        for response in responses:
            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        # Try the GET and POST with a bad authorization token.
        responses = [
            self.client.get(
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.post(
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                json.dumps({"tenant_name": 'a',
                            "username": 'b',
                            "password": 'c',
                            "auth_url": "http://d.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_BAD_TOKEN,
                                status_code=HTTP_401_UNAUTHORIZED)

    def test_no_access(self):
        """Getting the tenant clouds, or creating a tenant cloud, without being
        a tenant admin."""

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
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.post(
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                json.dumps({"tenant_name": 'a',
                            "username": 'b',
                            "password": 'c',
                            "auth_url": "http://d.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_no_tenant(self):
        """Getting a tenant, or creating a cloud in a tenant, when the tenant
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
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.post(
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                json.dumps({"tenant_name": 'a',
                            "username": 'b',
                            "password": 'c',
                            "auth_url": "http://d.com"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_get(self):
        """List a tenant's clouds."""

        # The clouds in this test.
        TENANT_CLOUD = [{"tenant_name": 'a',
                         "username": 'b',
                         "password": 'c',
                         "auth_url": "http://d.com"},
                        {"tenant_name": "ee",
                         "username": "ffffffffuuuuu",
                         "password": "gah",
                         "auth_url": "http://route66.com"},
                        {"tenant_name": "YUNO",
                         "username": "YOLO",
                         "password": "ZOMG",
                         "auth_url": "http://lol.com"},
                        ]

        OTHER_CLOUD = [{"tenant_name": "lisa",
                        "username": "sad lisa lisa",
                        "password": "on the road",
                        "auth_url": "http://tofindout.com"},
                       {"tenant_name": "left",
                        "username": "right",
                        "password": "center",
                        "auth_url": "http://down.com"},
                       ]

        EXPECTED_RESULT = TENANT_CLOUD

        # Make a tenant
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create clouds in this tenant.
        for entry in TENANT_CLOUD:
            Cloud.objects.create(tenant=tenant, **entry)

        # Create clouds that don't belong to the tenant.
        tenant_2 = Tenant.objects.create(name='boris',
                                         owner='John',
                                         owner_contact='206.867.5309')

        for entry in OTHER_CLOUD:
            entry["tenant"] = tenant_2
            Cloud.objects.create(**entry)

        # Log in as the tenant_admin.
        token = create_and_login(tenant=tenant)

        # Get the tenant's cloud list and check the response. We do a partial
        # check of the uuid key. It must exist, and its value must be a string
        # that's >= 32 characters.
        response = self.client.get(
            TENANTS_ID_CLOUD_URL % tenant.uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        response_content = json.loads(response.content)

        for entry in response_content["results"]:
            self.assertIsInstance(entry["uuid"], basestring)
            self.assertGreaterEqual(len(entry["uuid"]), 32)

            del entry["uuid"]

        self.assertItemsEqual(response_content["results"], EXPECTED_RESULT)

    def test_post(self):
        """Create an OpenStack cloud in a tenant."""

        # The clouds in this test.
        TENANT_CLOUD = [{"tenant_name": 'a',
                         "username": 'b',
                         "password": 'c',
                         "auth_url": "http://d.com"},
                        {"tenant_name": "ee",
                         "username": "ffffffffuuuuu",
                         "password": "gah",
                         "auth_url": "http://route66.com"},
                        ]

        # Make a tenant
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a user who's the tenant_admin of this tenant, and log him in.
        token = create_and_login(tenant=tenant)

        # Create OpenStack clouds in this tenant, and check the results.
        for entry in TENANT_CLOUD:
            response = self.client.post(
                TENANTS_ID_CLOUD_URL % tenant.uuid,
                json.dumps(entry),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_201_CREATED, entry)


class TenantsIdCloudId(Setup):
    """Retrieve a particular OpenStack cloud from a tenant, update an OpenStack
    cloud in a tenant, and delete an OpenStack cloud from a tenant."""

    def test_not_logged_in(self):
        """The client is not logged in."""

        # Make a tenant, and put one OpenStack cloud in it.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')
        cloud = Cloud.objects.create(tenant_name="ee",
                                     username="ffffffffuuuuu",
                                     password="gah",
                                     auth_url="http://route66.com",
                                     tenant=tenant)

        # Try GET, PUT, and DELETE without an authorization token.
        responses = [self.client.get(TENANTS_ID_CLOUD_ID_URL %
                                     (tenant.uuid, cloud.uuid)),
                     self.client.put(TENANTS_ID_CLOUD_ID_URL %
                                     (tenant.uuid, cloud.uuid),
                                     json.dumps({"username": "fool"}),
                                     content_type="application/json"),
                     self.client.delete(TENANTS_ID_CLOUD_ID_URL %
                                        (tenant.uuid, cloud.uuid)),
                     ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_NO_CREDENTIALS,
                                status_code=HTTP_401_UNAUTHORIZED)

        # Try again with a bad authorization token.
        responses = [
            self.client.get(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.put(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                json.dumps({"username": "fool"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
            self.client.delete(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % BAD_TOKEN),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_BAD_TOKEN,
                                status_code=HTTP_401_UNAUTHORIZED)

    def test_no_access(self):
        """The client isn't an authorized user."""

        # Make a tenant, put an OpenStack cloud in it.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')
        cloud = Cloud.objects.create(tenant_name="ee",
                                     username="ffffffffuuuuu",
                                     password="gah",
                                     auth_url="http://route66.com",
                                     tenant=tenant)

        # Create a normal user who's a member of the tenant, but *not* a
        # tenant_admin
        token = create_and_login()
        user = get_user_model().objects.get(username=TEST_USER[0])
        user.tenant = tenant
        user.save()

        # Try GET, PUT, and DELETE.
        responses = [
            self.client.get(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                json.dumps({"username": "fool"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

        # Ensure the cloud wasn't deleted.
        self.assertEqual(Cloud.objects.count(), 1)

    def test_no_tenant(self):
        """Getting a cloud, updating a cloud, or deleting a cloud, when the
        tenant doesn't exist."""

        # Make a tenant, put an OpenStack cloud in it.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')
        cloud = Cloud.objects.create(tenant_name="ee",
                                     username="ffffffffuuuuu",
                                     password="gah",
                                     auth_url="http://route66.com",
                                     tenant=tenant)

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try GET, PUT, and DELETE to a nonexistent tenant.
        responses = [
            self.client.get(
                TENANTS_ID_CLOUD_ID_URL % (BAD_UUID, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.put(
                TENANTS_ID_CLOUD_ID_URL % (BAD_UUID, cloud.uuid),
                json.dumps({"password": "fool"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
            self.client.delete(
                TENANTS_ID_CLOUD_ID_URL % (BAD_UUID, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token),
        ]

        for response in responses:
            self.assertContains(response,
                                CONTENT_PERMISSION_DENIED,
                                status_code=HTTP_403_FORBIDDEN)

    def test_get_no_cloud(self):
        """Get an OpenStack cloud that does not exist from a tenant."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try GETing a nonexisten cloud from this tenant.
        response = self.client.get(
            TENANTS_ID_CLOUD_ID_URL %
            (tenant.uuid, BAD_UUID),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_get(self):
        """Get a specific OpenStack cloud from a tenant."""

        # The clouds in this test.
        TENANT_CLOUD = [{"tenant_name": 'a',
                         "username": 'b',
                         "password": 'c',
                         "auth_url": "http://d.com"},
                        {"tenant_name": "ee",
                         "username": "ffffffffuuuuu",
                         "password": "gah",
                         "auth_url": "http://route66.com"},
                        ]

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # For every test cloud...
        for entry in TENANT_CLOUD:
            # Make it.
            cloud = Cloud.objects.create(tenant=tenant, **entry)

            # Try GETting it.
            response = self.client.get(
                TENANTS_ID_CLOUD_ID_URL %
                (tenant.uuid, cloud.uuid),
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            check_response_without_uuid(response, HTTP_200_OK, entry)

    def test_put_no_cloud(self):
        """Update a non-existent OpenStack cloud of a tenant."""

        # Make a tenant.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try PUTing to a nonexistent OpenStack cloud in this tenant.
        response = self.client.put(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, BAD_UUID),
            json.dumps({"tenant_name": "fool"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

    def test_put_bad_fields(self):
        """Update an OpenStack cloud with missing fields, unrecognized fields,
        or a field that's not allowed to be changed by the tenant_admin."""

        # The cloud in this test.
        TENANT_CLOUD = {"tenant_name": 'a',
                        "username": 'b',
                        "password": 'c',
                        "auth_url": "http://d.com"}

        # Make a tenant, put an OpenStack cloud in it.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')
        cloud = Cloud.objects.create(tenant=tenant, **TENANT_CLOUD)

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try PUTing to the cloud with no fields.
        response = self.client.put(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        for content in [CONTENT_MISSING_OS_USERNAME, CONTENT_MISSING_OS_NAME,
                        CONTENT_MISSING_OS_PASSWORD, CONTENT_MISSING_OS_URL]:
            self.assertContains(response,
                                content,
                                status_code=HTTP_400_BAD_REQUEST)

        # Try PUTing to the cloud with no change, and with a change to an
        # unrecognized field.
        response = self.client.put(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud.uuid),
            json.dumps(TENANT_CLOUD),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, TENANT_CLOUD)

        bad_field = TENANT_CLOUD.copy()
        bad_field["forkintheroad"] = "Traci"

        response = self.client.put(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud.uuid),
            json.dumps(bad_field),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, TENANT_CLOUD)

        # Try PUTing to a cloud on a field that's not allowed to be changed.
        # The response should be the same as the "unrecognized field" case.
        bad_field = TENANT_CLOUD.copy()
        bad_field["uuid"] = BAD_UUID

        response = self.client.put(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud.uuid),
            json.dumps(bad_field),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, TENANT_CLOUD)

    def test_put(self):
        """Update an Openstack cloud in a tenant."""

        # The cloud in this test.
        TENANT_CLOUD = {"tenant_name": 'a',
                        "username": 'b',
                        "password": 'c',
                        "auth_url": "http://d.com"}

        EXPECTED_RESPONSE = TENANT_CLOUD.copy()
        EXPECTED_RESPONSE["password"] = "fffffffffuuuuuuu"

        # Make a tenant, put an OpenStack cloud in it.
        tenant = Tenant.objects.create(name='tenant 1',
                                       owner='John',
                                       owner_contact='206.867.5309')
        cloud = Cloud.objects.create(tenant=tenant, **TENANT_CLOUD)

        # Create a tenant_admin of the tenant.
        token = create_and_login(tenant=tenant)

        # Try PUTing to the cloud.
        response = self.client.put(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud.uuid),
            json.dumps(EXPECTED_RESPONSE),
            content_type="application/json",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        check_response_without_uuid(response, HTTP_200_OK, EXPECTED_RESPONSE)

        # Double-check that the Cloud row was updated.
        self.assertEqual(Cloud.objects.count(), 1)
        self.assertEqual(Cloud.objects.all()[0].password,
                         EXPECTED_RESPONSE["password"])

    def test_delete_not_member(self):
        """Try deleting a cloud of another tenant."""

        # The clouds in this test.
        TENANT_CLOUD = [{"tenant_name": 'a',
                         "username": 'b',
                         "password": 'c',
                         "auth_url": "http://d.com"},
                        {"tenant_name": "ee",
                         "username": "ffffffffuuuuu",
                         "password": "gah",
                         "auth_url": "http://route66.com"},
                        ]

        # Make two tenant+cloud pairs
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        tenant_2 = Tenant.objects.create(name='tenant_2',
                                         owner='John',
                                         owner_contact='206.867.5309')
        Cloud.objects.create(tenant=tenant, **TENANT_CLOUD[0])
        cloud_2 = Cloud.objects.create(tenant=tenant_2, **TENANT_CLOUD[1])

        # Create a tenant_admin of the first tenant.
        token = create_and_login(tenant=tenant)

        # Try DELETE on the second (other) tenant's cloud.
        response = self.client.delete(
            TENANTS_ID_CLOUD_ID_URL %
            (tenant_2.uuid, cloud_2.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response,
                            CONTENT_PERMISSION_DENIED,
                            status_code=HTTP_403_FORBIDDEN)

        # Ensure we have the right number of OpenStack clouds.
        self.assertEqual(Cloud.objects.count(), 2)

    def test_delete(self):
        """Delete an OpenStack cloud from a tenant."""

        # The clouds in this test.
        TENANT_CLOUD = [{"tenant_name": 'a',
                         "username": 'b',
                         "password": 'c',
                         "auth_url": "http://d.com"},
                        {"tenant_name": "ee",
                         "username": "ffffffffuuuuu",
                         "password": "gah",
                         "auth_url": "http://route66.com"},
                        ]

        # Make a tenant with two clouds.
        tenant = Tenant.objects.create(name='tenant',
                                       owner='John',
                                       owner_contact='206.867.5309')
        cloud = Cloud.objects.create(tenant=tenant, **TENANT_CLOUD[0])
        cloud_2 = Cloud.objects.create(tenant=tenant, **TENANT_CLOUD[1])

        # Create a tenant_admin.
        token = create_and_login(tenant=tenant)

        # DELETE one cloud, check, DELETE the other cloud, check.
        response = self.client.delete(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud_2.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_204_NO_CONTENT)

        # Ensure we have the right number of Clouds.
        self.assertEqual(Cloud.objects.count(), 1)
        self.assertEqual(Cloud.objects.all()[0].tenant_name,
                         TENANT_CLOUD[0]["tenant_name"])

        response = self.client.delete(
            TENANTS_ID_CLOUD_ID_URL % (tenant.uuid, cloud.uuid),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertContains(response, '', status_code=HTTP_204_NO_CONTENT)

        # Ensure we have the right number of Clouds.
        self.assertEqual(Cloud.objects.count(), 0)
