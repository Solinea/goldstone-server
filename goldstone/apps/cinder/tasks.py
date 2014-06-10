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

__author__ = 'John Stanford'

from goldstone.celery import app as celery_app
import logging
from goldstone.utils import _get_client, _get_cinder_client, stored_api_call, \
    to_es_date
from .models import *
from datetime import datetime
import pytz

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


def _update_cinder_records(rec_type, region, db, items):

    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            rec_type: [item.__dict__['_info'] for item in items]}
    try:
        db.post(body)
    except Exception as e:
        logging.exception(e)
        logger.warn("failed to index cinder %s", rec_type)


@celery_app.task(bind=True)
def discover_cinder_topology(self):
    cinder_access = _get_cinder_client()
    cl = cinder_access['client']
    reg = cinder_access['region']

    _update_cinder_records("services",  reg, ServiceData(),
                           cl.services.list())
    _update_cinder_records("volumes",  reg, VolumeData(),
                           cl.volumes.list())
    _update_cinder_records("backups",  reg, BackupData(),
                           cl.backups.list())
    _update_cinder_records("snapshots",  reg, SnapshotData(),
                           cl.volume_snapshots.list())
    _update_cinder_records("volume_types",  reg, VolTypeData(),
                           cl.volume_types.list())
    _update_cinder_records("encryption_types",  reg, EncryptionTypeData(),
                           cl.volume_encryption_types.list())
    _update_cinder_records("transfers",  reg, TransferData(),
                           cl.transfers.list())
