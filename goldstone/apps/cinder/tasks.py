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
import pytz

__author__ = 'John Stanford'

from goldstone.celery import app as celery_app
import logging
from .models import ApiPerfData
from goldstone.utils import _get_client, _get_cinder_client, stored_api_call, \
    to_es_date
from .models import ServiceData, VolumeData
from datetime import datetime

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


def _update_cinder_service_records(cl, region):
    db = ServiceData()
    sl = cl.services.list()
    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            "services": [s.__dict__['_info'] for s in sl]}
    try:
        db.post(body)
    except Exception as e:
        logging.exception(e)
        logger.warn("failed to index cinder services")


def _update_cinder_volume_records(cl, region):
    db = VolumeData()
    vl = cl.volumes.list()
    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            "volumes": [v.__dict__['_info'] for v in vl]}
    try:
        db.post(body)
    except Exception as e:
        logging.exception(e)
        logger.warn("failed to index cinder volumes")


@celery_app.task(bind=True)
def discover_cinder_topology(self):
    cinder_access = _get_cinder_client()
    _update_cinder_service_records(cinder_access['client'],
                                   cinder_access['region'])
    _update_cinder_volume_records(cinder_access['client'],
                                  cinder_access['region'])
