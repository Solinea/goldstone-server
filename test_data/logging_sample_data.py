# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf import settings
from goldstone.glogging.models import LoggingNode
from goldstone.glogging.serializers import LoggingNodeSerializer
from rest_framework.renderers import JSONRenderer
import logging
import random
import os
import uuid
import time
import json

from datetime import datetime, timedelta
import pytz

from faker import Faker


fake = Faker()

logger = logging.getLogger(__name__)


def _fake_date(earliest=datetime.now(tz=pytz.utc) - timedelta(minutes=30),
               latest=datetime.now(tz=pytz.utc)):

    earliest_ts = time.mktime(earliest.timetuple())
    latest_ts = time.mktime(latest.timetuple())

    return datetime.fromtimestamp(
        random.randint(earliest_ts, latest_ts),
        tz=pytz.utc
    )


def _fake_log_increment(prob, max=100):

    if random.randint(prob - 100, prob) > 0:
        return random.randint(0, max)
    else:
        return 0


def _fake_last_seen_method(current_method=None):
    methods = ['LOGS', 'PING']

    if current_method is 'PING':
        if random.randint(-5, 95) > 0:
            return 'PING'
        else:
            return 'LOGS'
    else:
        if random.randint(-5, 95) > 0:
            return 'LOGS'
        else:
            return 'PING'


def _fake_admin_disabled(last_seen, currently_disabled):
    if last_seen > datetime.now(tz=pytz.utc) - timedelta(minutes=2):
        # 5% chance that a fresh node will be disabled
        return random.randint(-95, 5) > 0

    if currently_disabled:
        # 95% chance that currently disabled nodes will stay that way
        return random.randint(-5, 95) > 0


def _gen_node(current_node=None):

    node = current_node

    if node is None:
        node = LoggingNode(name=fake.name())
        node.polymorphic_ctype_id = 14L
        node.resource_ptr_id = 1
        node.entity_ptr_id = 1
        node.uuid = str(uuid.uuid4())
        node.created = datetime.now(tz=pytz.utc)
        node.updated = node.created
        if random.randint(-10, 90) > 0:
            node.last_seen = datetime.now(tz=pytz.utc)
        else:
            node.last_seen = _fake_date(
                earliest=datetime.now(tz=pytz.utc) - timedelta(minutes=2))
        node.last_seen_method = _fake_last_seen_method()
        node.error_count = _fake_log_increment(10, max=1000)
        node.warning_count = _fake_log_increment(10, max=1000)
        node.info_count = _fake_log_increment(75, max=1000)
        node.audit_count = _fake_log_increment(95, max=1000)
        node.debug_count = _fake_log_increment(5, max=1000)

    else:
        node.updated = datetime.now(tz=pytz.utc)

        if node.last_seen < datetime.now(tz=pytz.utc) - timedelta(minutes=2):
            # this host hasn't been seen for a while, let's give it a
            # 20% chance of coming back
            if random.randint(-80, 20) >= 0:
                node.last_seen = datetime.now(tz=pytz.utc)

            else:
                node.last_seen = _fake_date(
                    earliest=node.last_seen - timedelta(minutes=5),
                    latest=node.last_seen)
        else:
            # let's give this host a 90% chance of continuing availability
            if random.randint(-10, 90) >= 0:
                node.last_seen = datetime.now(tz=pytz.utc)
            else:
                node.last_seen = _fake_date(
                    earliest=node.last_seen - timedelta(minutes=5),
                    latest=node.last_seen)

        node.error_count += _fake_log_increment(10, max=100)
        node.warning_count += _fake_log_increment(10, max=100)
        node.info_count += _fake_log_increment(75, max=100)
        node.audit_count += _fake_log_increment(95, max=100)
        node.debug_count += _fake_log_increment(5, max=100)
        node.last_seen_method = _fake_last_seen_method(node.last_seen_method)

    node.admin_disabled = _fake_admin_disabled(node.last_seen,
                                               node.admin_disabled)

    return node


def _serialize_nodes(nodes):
    result = []
    for n in nodes:
        s = LoggingNodeSerializer(n)
        result.append(JSONRenderer().render(s.data))

    return result


def _gen_model_data(current=None):

    if current is None:
        nodes = []
        node_count = random.randint(100, 1000)
        for _ in xrange(node_count + 1):
            nodes.append(_gen_node())

    else:
        nodes = [_gen_node(n) for n in current]
        new_count = random.randint(len(nodes), len(nodes) + 10) - len(nodes)
        for _ in xrange(0, new_count):
            nodes.append(_gen_node())

    return nodes


def generate(dataset_count):

    nodes = None

    for i in xrange(1, dataset_count + 1):
        nodes = _gen_model_data(nodes)

        fn = "logging_nodes." + str(i) + ".json"
        try:
            fn = os.path.join(os.path.dirname(__file__),
                              "..", "..", "..", "test_data",
                              "logging_nodes." + str(i) + ".json")
        except NameError:
            pass

        with open(fn, 'w') as outfile:
            json.dump(_serialize_nodes(nodes), outfile,
                      sort_keys=True, indent=4, ensure_ascii=False)


if __name__ == "__main__":
    generate(10)
