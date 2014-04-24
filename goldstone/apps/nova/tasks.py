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

from django.conf import settings
from goldstone.celery import app as celery_app
from novaclient.v1_1 import client
import logging
import json
import requests
from datetime import datetime
from .models import AvailabilityZoneData, HypervisorStatsData, ApiPerfData
from goldstone.utils import _get_keystone_client, stored_api_call


logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def nova_az_list(self):
    nt = client.Client(settings.OS_USERNAME, settings.OS_PASSWORD,
                       settings.OS_TENANT_NAME, settings.OS_AUTH_URL,
                       service_type="compute")
    response = {'zones': [z.to_dict() for z in nt.availability_zones.list()]}
    t = datetime.utcnow()
    response['@timestamp'] = t.strftime(
        "%Y-%m-%dT%H:%M:%S." + str(int(round(t.microsecond/1000))) + "Z")
    response['task_id'] = self.request.id
    logger.debug("[nova_az_list] response = %s", json.dumps(response))
    azdb = AvailabilityZoneData()
    id = azdb.post(response)
    logger.debug("[nova_az_list] id = %s", id)


@celery_app.task(bind=True)
def nova_hypervisors_stats(self):
    nt = client.Client(settings.OS_USERNAME, settings.OS_PASSWORD,
                       settings.OS_TENANT_NAME, settings.OS_AUTH_URL,
                       service_type="compute")
    response = nt.hypervisors.statistics()._info
    t = datetime.utcnow()
    response['@timestamp'] = t.strftime(
        "%Y-%m-%dT%H:%M:%S." + str(int(round(t.microsecond/1000))) + "Z")
    response['task_id'] = self.request.id
    hvdb = HypervisorStatsData()
    id = hvdb.post(response)
    logger.info("[hypervisor_stats] id = %s", id)


@celery_app.task(bind=True)
def time_nova_api(self):
    """
    Call the hypervisor list command, and if there are hypervisors, calls the
    hypervisor show command.  Inserts record with hypervisor show preferred.
    """
    result = stored_api_call("nova", "compute", "/os-hypervisors")
    logger.debug(_get_keystone_client.cache_info())

    # check for existing hypervisors. if they exist, redo the call with a
    # single hypervisor for a more consistent result.
    if result['reply'].status_code == requests.codes.ok:
        body = json.loads(result['reply'].text)
        if 'hypervisors' in body and len(body['hypervisors']) > 0:
            result = stored_api_call("nova", "compute",
                                     "/os-hypervisors/" +
                                     str(body['hypervisors'][0]['id']))
            logger.debug(_get_keystone_client.cache_info())

    api_db = ApiPerfData()
    rec_id = api_db.post(result['db_record'])
    logger.debug("[time_nova_api] id = %s", rec_id)
    return {
        'id': rec_id,
        'record': result['db_record']
    }
