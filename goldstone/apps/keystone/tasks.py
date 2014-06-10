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

import pytz

__author__ = 'John Stanford'

from django.conf import settings
from goldstone.celery import app as celery_app
import requests
import logging
from datetime import datetime
import json
from .models import ApiPerfData, ServiceData, EndpointData
from goldstone.utils import _construct_api_rec, _decompose_url, \
    _get_keystone_client, get_region_for_keystone_client, utc_timestamp, \
    to_es_date

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_keystone_api(self):
    """
    Call the token url via http rather than the python client so we can get
    a full set of data for the record in the DB.  This will make things
    easier to model.
    """
    user = settings.OS_USERNAME
    passwd = settings.OS_PASSWORD
    url = settings.OS_AUTH_URL + "/tokens"
    payload = {"auth": {"passwordCredentials": {"username": user,
                                                "password": passwd}}}
    headers = {'content-type': 'application/json'}
    self.reply = requests.post(url, data=json.dumps(payload),
                               headers=headers)
    t = datetime.utcnow()
    rec = _construct_api_rec(self.reply, "keystone", t)
    apidb = ApiPerfData()
    rec_id = apidb.post(rec)
    return {
        'id': rec_id,
        'record': rec
    }


def _update_keystone_service_records(cl):
    db = ServiceData()
    sl = [s.to_dict() for s in cl.services.list()]
    region = get_region_for_keystone_client(cl)
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            "services": sl}
    try:
        db.post(body)
    except Exception as e:
        logging.exception(e)
        logger.warn("failed to index keystone services")


def _update_keystone_endpoint_records(cl):
    db = EndpointData()
    el = [e.to_dict() for e in cl.endpoints.list()]
    for ep in el:
        ep['adminurl_detail'] = _decompose_url(ep['adminurl'])
        ep['internalurl_detail'] = _decompose_url(ep['internalurl'])
        ep['publicurl_detail'] = _decompose_url(ep['publicurl'])

    try:

        logger.debug("endpoint list = %s", json.dumps(el))
        db.post({"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
                 "endpoints": el})
    except Exception as e:
        logging.exception(e)
        logger.warn("failed to index keystone endpoint list")


@celery_app.task(bind=True)
def discover_keystone_topology(self):
    keystone_access = _get_keystone_client()
    c = keystone_access['client']
    _update_keystone_service_records(c)
    _update_keystone_endpoint_records(c)
