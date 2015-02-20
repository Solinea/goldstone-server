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
import json
import logging

import requests
import pytz
from goldstone.apps.api_perf.utils import openstack_api_request_base, \
    time_api_call

from .models import ImagesData

from goldstone.celery import app as celery_app
from goldstone.utils import to_es_date


logger = logging.getLogger(__name__)


@celery_app.task()
def time_image_list_api():
    """
    Call the image list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL to call.  If there are
    images returned, then calls the image-show command on the first one,
    otherwise uses the results from image list to inserts a record
    in the DB.
    """

    precursor = openstack_api_request_base("image", "/v2/images")
    return time_api_call('glance.image.list',
                         precursor['url'],
                         headers=precursor['headers'])


def _update_glance_image_records(client, region):

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


@celery_app.task(bind=True)
def discover_glance_topology(self):
    from goldstone.utils import get_glance_client

    glance_access = get_glance_client()
    _update_glance_image_records(glance_access['client'],
                                 glance_access['region'])
