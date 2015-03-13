"""Logging tests."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
# http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from contextlib import nested
from django.test import SimpleTestCase
from mock import patch
from .models import LogData


class LogDataModelTests(SimpleTestCase):
    """Tests for the LogData model"""

    def test_field_has_raw_true(self):
        """field_has_raw should return true if mapping has a raw field"""
        # py26 support
        with nested(
                patch("goldstone.apps.logging.models.most_recent_index"),
                patch.object(LogData, "get_field_mapping")) \
                as (mre, gfm):

            field = 'field'
            mre.return_value = 'index'
            gfm.return_value = {'index': {'mappings': {
            'syslog': {field: {'mapping': {field: {'fields': {
                'raw': True}}}}}}}}

            result = LogData.field_has_raw('field')
            self.assertTrue(mre.called)
            self.assertTrue(gfm.called)
            self.assertTrue(result)

    def test_field_has_raw_false(self):
        """field_has_raw should return true if mapping has a raw field"""
        # py26 support
        with nested(
                patch("goldstone.apps.logging.models.most_recent_index"),
                patch.object(LogData, "get_field_mapping")) \
                as (mre, gfm):

            field = 'field'
            mre.return_value = 'index'
            gfm.return_value = {'index': {'mappings': {
            'syslog': {field: {'mapping': {field: {'fields': {
                'not_raw': True}}}}}}}}

    def test_field_has_raw_keyerror(self):
        """field_has_raw should return true if mapping has a raw field"""
        # py26 support
        with nested(
                patch("goldstone.apps.logging.models.most_recent_index"),
                patch.object(LogData, "get_field_mapping")) \
                as (mre, gfm):

            field = 'field'
            mre.return_value = 'index'
            gfm.side_effect = KeyError

            with self.assertRaises(KeyError):
                result = LogData.field_has_raw('field')
                self.assertTrue(mre.called)
                self.assertTrue(gfm.called)

