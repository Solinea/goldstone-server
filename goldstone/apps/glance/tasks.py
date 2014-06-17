from __future__ import absolute_import
# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from datetime import datetime
import pytz

__author__ = 'John Stanford'

from goldstone.celery import app as celery_app
import requests
import logging
import json
from .models import ApiPerfData, ImagesData
from goldstone.utils import _get_client, stored_api_call, \
    to_es_date, _get_glance_client

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
    if result['reply'] is not None and \
            result['reply'].status_code == requests.codes.ok:
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


def _update_glance_image_records(cl, region):
    db = ImagesData()
    il = cl.images.list()
    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            "images": [i for i in il]}
    try:
        db.post(body)
    except Exception as e:
        logging.exception(e)
        logger.warn("failed to index glance images")


@celery_app.task(bind=True)
def discover_glance_topology(self):
    glance_access = _get_glance_client()
    _update_glance_image_records(glance_access['client'],
                                 glance_access['region'])
