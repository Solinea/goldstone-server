"""Keystone tasks."""
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
from goldstone.apps.api_perf.utils import time_api_call

from goldstone.celery import app as celery_app
import logging
from datetime import datetime
from .models import EndpointsData, RolesData, ServicesData, \
    TenantsData, UsersData
from goldstone.utils import get_keystone_client, to_es_date, \
    get_region_for_keystone_client

logger = logging.getLogger(__name__)


@celery_app.task()
def time_token_post_api():
    """
    Call the token url via http rather than the python client so we can get
    a full set of data for the record in the DB.  This will make things
    easier to model.
    """
    from django.conf import settings
    import json

    user = settings.OS_USERNAME
    passwd = settings.OS_PASSWORD
    url = settings.OS_AUTH_URL + "/tokens"
    payload = {"auth": {"passwordCredentials": {"username": user,
                                                "password": passwd}}}
    headers = {'content-type': 'application/json'}

    return time_api_call('keystone.token.post',
                         url,
                         method='POST',
                         data=json.dumps(payload),
                         headers=headers)


def _update_keystone_records(rec_type, region, database, items):
    import pytz

    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            rec_type: [item.to_dict() for item in items]}
    try:
        database.post(body)
    except Exception:           # pylint: disable=W0703
        logging.exception("failed to index keystone %s", rec_type)


@celery_app.task(bind=True)
def discover_keystone_topology(self):

    access = get_keystone_client()
    client = access['client']
    reg = get_region_for_keystone_client(client)

    _update_keystone_records("endpoints",
                             reg,
                             EndpointsData(),
                             client.endpoints.list())
    _update_keystone_records("roles", reg, RolesData(), client.roles.list())
    _update_keystone_records("services",
                             reg,
                             ServicesData(),
                             client.services.list())
    _update_keystone_records("tenants",
                             reg,
                             TenantsData(),
                             client.tenants.list())
    _update_keystone_records("users", reg, UsersData(), client.users.list())
