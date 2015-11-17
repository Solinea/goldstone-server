"""Glance tasks."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from __future__ import absolute_import
import logging
from goldstone.celery import app as celery_app
from goldstone.utils import get_glance_client

logger = logging.getLogger(__name__)


def _update_glance_image_records(client, region):
    """Do the work for the discover_glance_topology task."""
    from goldstone.utils import to_es_date
    from .models import ImagesData
    import arrow

    images_list = client.images.list()

    # Image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(arrow.utcnow().datetime),
            "region": region,
            "images": [i for i in images_list]}

    data = ImagesData()

    try:
        data.post(body)
    except Exception:          # pylint: disable=W0703
        logging.exception("failed to index glance images")


@celery_app.task()
def discover_glance_topology():
    """Update Goldstone's glance data."""

    # Get the system's sole OpenStack cloud.
    glance_access = get_glance_client()

    _update_glance_image_records(glance_access['client'],
                                 glance_access['region'])
