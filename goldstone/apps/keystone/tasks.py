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
from keystoneclient.v2_0 import client
import requests
from urllib2 import urlparse
import logging
from datetime import datetime
import json
from .models import ApiPerfData
from goldstone.utils import _construct_api_rec
logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_keystone_api(self):
    """
    Call the token url via http rather than the python client so we can get
    a full set of data for the record in the DB.  This will make things
    easier to model.  Call is equivalent to:

    curl -H "Content-type: application/json" -d '{
        "auth":{"passwordCredentials":
            {"username": "user", "password": "passwd"}}}'
        http://10.10.11.20:35357/v2.0/tokens
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
