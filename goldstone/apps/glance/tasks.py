"""Glance tasks."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from __future__ import absolute_import
from datetime import datetime
import logging
import pytz
from .models import ImagesData
from goldstone.celery import app as celery_app
from goldstone.utils import get_cloud


def _update_glance_image_records(client, region):
    from goldstone.utils import to_es_date

    data = ImagesData()
    images_list = client.images.list()

    # Image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            "images": [i for i in images_list]}
    try:
        data.post(body)
    except Exception:          # pylint: disable=W0703
        logging.exception("failed to index glance images")


@celery_app.task()
def discover_glance_topology():
    from goldstone.utils import get_glance_client

    # Get the system's sole OpenStack cloud.
    cloud = get_cloud()
    glance_access = get_glance_client(cloud.username,
                                      cloud.password,
                                      cloud.tenant_name,
                                      cloud.auth_url)

    _update_glance_image_records(glance_access['client'],
                                 glance_access['region'])
