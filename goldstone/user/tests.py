"""Custom User model tests."""
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
from django.test import SimpleTestCase, Client
from rest_framework.status import *

from goldstone.user.models import User

# Define the URLs and payloads used in this module's testing.
USER_URL = "/user"
AUTHENTICATION_HEADER = ''


class NoAccess(SimpleTestCase):
    """The user attempts access without being logged in, or presenting a bad
    authentication token."""

    def test_get_nologin(self):
        """Getting while not logged in."""

        EXPECTED_CONTENT = \
            '{"detail":"Authentication credentials were not provided."}'
        client = Client()
        response = client.get(USER_URL)

        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.content, EXPECTED_CONTENT)

    def test_get_badtoken(self):
        pass

    def test_put_nologin(self):
        pass

    def test_put_badtoken(self):
        pass


# class Get(SimpleTestCase):
#     pass


# class Put(SimpleTestCase):
#     pass


# class BadPut(SimpleTestCase):
#     pass
