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
import requests
import logging
import json
from .models import ApiPerfData
from goldstone.utils import _get_client, _get_keystone_client, stored_api_call

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_glance_api(self):
    """
    Call the image list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL to call.  If there are
    images returned, then calls the image-show command on the first one,
    otherwise uses the results from image list to inserts a record
    in the DB.
    """
    result = stored_api_call("glance", "image", "/v2/images")
    logger.debug(_get_client.cache_info())

    # check for existing volumes. if they exist, redo the call with a single
    # volume for a more consistent result.
    if result['reply'].status_code == requests.codes.ok:
        body = json.loads(result['reply'].text)
        if 'images' in body and len(body['images']) > 0:
            result = stored_api_call("glance", "image",
                                     "/v2/images/" + body['images'][0]['id'])
            logger.debug(_get_client.cache_info())

    api_db = ApiPerfData()
    rec_id = api_db.post(result['db_record'])
    logger.debug("[time_glance_api] id = %s", rec_id)
    return {
        'id': rec_id,
        'record': result['db_record']
    }