"""Cinder tasks."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from __future__ import absolute_import
import logging
from goldstone.celery import app as celery_app
from goldstone.utils import to_es_date
from .models import ServicesData, VolumesData, BackupsData, SnapshotsData, \
    VolTypesData, EncryptionTypesData, TransfersData

logger = logging.getLogger(__name__)


def _update_cinder_records(rec_type, region, database, items):
    """Post a cinder record to Elasticsearch

    Construct the JSON body and attempt to index a new document into the
    Elasticsearch database.

    """
    import arrow
    body = {"@timestamp": to_es_date(arrow.utcnow().datetime),
            "region": region,
            rec_type: [item.__dict__['_info'] for item in items]}
    try:
        database.post(body)
    except Exception:             # pylint: disable=W0703
        logger.exception("failed to index cinder %s", rec_type)


@celery_app.task()
def discover_cinder_topology():
    """Interrogate the OpenStack API for config info about cinder

    Get each of the resource types and call a method to index
    the documents into ES.

    """
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
