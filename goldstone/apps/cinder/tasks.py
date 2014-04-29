from __future__ import absolute_import

# Copyright 2014 Solinea, Inc.
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

__author__ = 'John Stanford'

from goldstone.celery import app as celery_app
import logging
from .models import ApiPerfData
from goldstone.utils import _get_client, _get_keystone_client, stored_api_call
from django.conf import settings
from datetime import datetime
import requests
import json


logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_cinder_api(self):
    """
    Call the service list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL and inserts a record
    in the DB.
    """
    result = stored_api_call("cinder", "volume", "/os-services")
    logger.debug(_get_client.cache_info())
    api_db = ApiPerfData()
    rec_id = api_db.post(result['db_record'])
    logger.debug("[time_cinder_api] id = %s", rec_id)
    return {
        'id': rec_id,
        'record': result['db_record']
    }
