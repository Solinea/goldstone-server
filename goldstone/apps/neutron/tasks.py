"""Neutron app tasks."""
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

import json
import logging
import requests
from goldstone.apps.api_perf.utils import time_api_call, \
    openstack_api_request_base

from goldstone.celery import app as celery_app



logger = logging.getLogger(__name__)


def time_agent_show_api(url, headers):
    """

    :return:
    """
    return time_api_call('neutron.agent.show', url, headers=headers)


@celery_app.task()
def time_agent_list_api():
    """
    Call the agent list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL to call.  If there are
    agents returned, then calls the agent-show command on the first one,
    otherwise uses the results from agent list to inserts a record
    in the DB.
    """

    agent_list_precursor = openstack_api_request_base("network",
                                                      "/v2.0/agents")
    result = time_api_call('neutron.agent.list',
                           agent_list_precursor['url'],
                           headers=agent_list_precursor['headers'])

    # check for existing volumes. if they exist, redo the call with a single
    # volume for a more consistent result.
    if result['response'] is not None and \
            result['response'].status_code == requests.codes.ok:
        body = json.loads(result['response'].text)
        if 'agents' in body and len(body['agents']) > 0:
            show_result = time_agent_show_api(
                agent_list_precursor['url'] + str(body['agents'][0]['id']),
                agent_list_precursor['headers'])
            result = [result, show_result]

    return result

