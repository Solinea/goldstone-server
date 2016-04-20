"""TopologyView app unit tests."""
# Copyright 2016 Solinea, Inc.
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
from django.test import TestCase
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED

from goldstone.core.models import AlertDefinition, SavedSearch
from goldstone.core.tasks import process_alerts
from goldstone.test_utils import Setup, create_and_login, AUTHORIZATION_PAYLOAD


class TaskTests(TestCase):
    """ Test core tasks class model"""

    fixtures = ['core_initial_data.yaml']

    @patch('goldstone.core.tasks.AlertDefinition.evaluate')
    @patch("goldstone.core.tasks.logger.exception")
    def test_process_alerts(self, mock_logger, mock_evaluate):

        ss = SavedSearch.objects.all()[0]
        ad = AlertDefinition(name=ss.name, search=ss)
        ad.save()

        mock_evaluate.return_value = None
        alert_def_count = AlertDefinition.objects.count()

        process_alerts()

        self.assertEqual(mock_evaluate.call_count, alert_def_count)

        mock_evaluate.side_effect = Exception

        process_alerts()

        self.assertTrue(mock_logger.called)


class AuthToken(Setup):
    """Test authorization token expiration."""

    fixtures = ['core_initial_data.yaml']

    def test_expiration(self):
        """The authorization tokens expire."""
        from .tasks import expire_auth_tokens

        # Create a user.
        token = create_and_login()

        response = self.client.get(
            "/core/saved_search/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Call the token-expiration task, then try to do an API call again. It
        # should fail because of the tokens' expiration.
        expire_auth_tokens()

        response = self.client.get(
            "/core/saved_search/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)
