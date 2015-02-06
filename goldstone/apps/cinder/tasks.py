"""Cinder tasks."""
# Copyright 2014 - 2015 Solinea, Inc.
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
from __future__ import absolute_import

from datetime import datetime
import logging

import pytz

from goldstone.celery import app as celery_app
from goldstone.utils import stored_api_call, to_es_date
from .models import ApiPerfData, ServicesData, VolumesData, BackupsData, \
    SnapshotsData, VolTypesData, EncryptionTypesData, TransfersData

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_cinder_api(self):
    """Call the service list command for the test tenant.

    Retrieves the endpoint from keystone, then constructs the URL and inserts a
    record in the DB.

    """
    from goldstone.utils import get_client

    result = stored_api_call("cinder", "volume", "/os-services")
    logger.debug(get_client.cache_info())

    api_db = ApiPerfData()
    rec_id = api_db.post(result['db_record'])
    logger.debug("[time_cinder_api] id = %s", rec_id)

    return {'id': rec_id, 'record': result['db_record']}


def _update_cinder_records(rec_type, region, database, items):

    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            rec_type: [item.__dict__['_info'] for item in items]}
    try:
        database.post(body)
    except Exception:             # pylint: disable=W0703
        logger.exception("failed to index cinder %s", rec_type)


@celery_app.task(bind=True)
def discover_cinder_topology(self):
    from goldstone.utils import get_cinder_client

    cinder_access = get_cinder_client()
    cinderclient = cinder_access['client']
    reg = cinder_access['region']

    _update_cinder_records("services", reg, ServicesData(),
                           cinderclient.services.list())
    _update_cinder_records("volumes", reg, VolumesData(),
                           cinderclient.volumes.list())
    _update_cinder_records("backups", reg, BackupsData(),
                           cinderclient.backups.list())
    _update_cinder_records("snapshots", reg, SnapshotsData(),
                           cinderclient.volume_snapshots.list())
    _update_cinder_records("volume_types", reg, VolTypesData(),
                           cinderclient.volume_types.list())
    _update_cinder_records("encryption_types", reg, EncryptionTypesData(),
                           cinderclient.volume_encryption_types.list())
    _update_cinder_records("transfers", reg, TransfersData(),
                           cinderclient.transfers.list())
