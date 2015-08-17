"""User add-on unit tests.

Tests:
    /addons/
    /addons/verify/

"""
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
from mock import Mock, patch
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST

from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD
from .models import Addon as AddonTable

# URLs for the tests.
APP_URL = "/addons/"
VERIFY_URL = APP_URL + "verify/"


class Addons(Setup):
    """The returning of information about user-installed add-ons."""

    def test_none(self):
        """No add-ons are installed."""

        # The test runner should have emptied the table before the test.

        # Create a user.
        token = create_and_login()

        response = self.client.get(
            APP_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        self.assertContains(response, "[]", status_code=HTTP_200_OK)

    def test_some(self):
        """Some add-ons are installed."""

        # Create two Addon rows.
        app1 = AddonTable.objects.create(name="test1",
                                         version="1.001",
                                         manufacturer="Foonly, Inc.",
                                         url_root="dolphin",
                                         notes="test application")
        app2 = AddonTable.objects.create(name="test2",
                                         version="2.a(4)",
                                         manufacturer="Solinea",
                                         url_root="test2",
                                         notes="another test application")

        # Create a user.
        token = create_and_login()

        response = self.client.get(
            APP_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # values. pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        content = json.loads(response.content)

        # We delete the date keys from the returned rows, as they are
        # auto-generated.
        for entry in content:
            del entry["updated_date"]
            del entry["installed_date"]

        # Create the expected dicts, which requires removing the auto-generated
        # date and db/django keys.
        app1 = app1.__dict__
        app2 = app2.__dict__
        for entry in [app1, app2]:
            del entry["updated_date"]
            del entry["installed_date"]
            del entry["_state"]
            del entry["id"]

        self.assertEqual(2, len(content))
        self.assertIn(app1, content)
        self.assertIn(app2, content)


class AddonsVerify(Setup):
    """Test the /verify/ API."""

    def setUp(self):
        """Run before every test."""

        super(AddonsVerify, self).setUp()
        AddonTable.objects.all().delete()

    def test_none(self):
        """No add-ons are installed."""

        # The test runner should have emptied the table before the test.

        # Create a user.
        token = create_and_login()

        response = self.client.get(
            VERIFY_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.  No bad rows = empty list returned.
        self.assertContains(response, "[]", status_code=HTTP_200_OK)

    def test_allbad(self):
        """Some add-ons are installed, and they all are bad."""

        # Create two Addon rows.
        app1 = AddonTable.objects.create(name="test1",
                                         version="1.001",
                                         manufacturer="Foonly, Inc.",
                                         url_root="dolphin",
                                         notes="test application")
        app2 = AddonTable.objects.create(name="test2",
                                         version="2.a(4)",
                                         manufacturer="Solinea",
                                         url_root="test2",
                                         notes="another test application")

        # Create a user.
        token = create_and_login()

        response = self.client.get(
            VERIFY_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # values. pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        content = json.loads(response.content)

        self.assertEqual(2, len(content))
        self.assertIn(str(app1), content)
        self.assertIn(str(app2), content)

    def test_somebad(self):
        """Some add-ons are installed, and some are bad."""

        def side_effect(*args, **_):
            """Raise an exception for Django's URL resolver, sometimes."""
            from django.core.urlresolvers import Resolver404

            if args[0] != "/test3/":
                raise Resolver404

        # Create three Addon rows.
        app1 = AddonTable.objects.create(name="test1",
                                         version="1.001",
                                         manufacturer="Foonly, Inc.",
                                         url_root="dolphin",
                                         notes="test application")
        app2 = AddonTable.objects.create(name="test2",
                                         version="2.a(4)",
                                         manufacturer="Solinea",
                                         url_root="test2",
                                         notes="another test application")
        AddonTable.objects.create(name="test3",
                                  version="45",
                                  manufacturer="Mozilla",
                                  url_root="test3",
                                  notes="the real mccoy")

        # Make the thrid "good" by mocking out the Django URL resolver.
        mock_resolver = Mock()
        mock_resolver.side_effect = side_effect

        # Create a user.
        token = create_and_login()

        with patch("goldstone.addons.models.resolve", mock_resolver):
            response = self.client.get(
                VERIFY_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # There should be only two rows in the return value.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_400_BAD_REQUEST)

        content = json.loads(response.content)

        self.assertEqual(2, len(content))
        self.assertIn(str(app1), content)
        self.assertIn(str(app2), content)

    def test_allgood(self):
        """Some add-ons are installed, and all are good."""

        # Create three Addon rows.
        AddonTable.objects.create(name="test1",
                                  version="1.001",
                                  manufacturer="Foonly, Inc.",
                                  url_root="dolphin",
                                  notes="test application")
        AddonTable.objects.create(name="test2",
                                  version="2.a(4)",
                                  manufacturer="Solinea",
                                  url_root="test2",
                                  notes="another test application")
        AddonTable.objects.create(name="test3",
                                  version="45",
                                  manufacturer="Mozilla",
                                  url_root="test3",
                                  notes="the real mccoy")

        # Make all of them "good" apps by mocking out the Django URL resolver.
        mock_resolver = Mock()

        # Create a user.
        token = create_and_login()

        with patch("goldstone.addons.models.resolve", mock_resolver):
            response = self.client.get(
                VERIFY_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.  No bad rows = empty list returned.
        self.assertContains(response, "[]", status_code=HTTP_200_OK)
