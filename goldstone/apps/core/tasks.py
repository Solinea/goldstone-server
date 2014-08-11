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

__author__ = 'stanford'

from goldstone.celery import app as celery_app
from django.conf import settings
from elasticsearch import *
import os
import json
from datetime import date, timedelta
import logging
from subprocess import check_call

logger = logging.getLogger(__name__)


def _delete_indices(prefix, cutoff,
                    es_host=settings.ES_HOST,
                    es_port=settings.ES_PORT
                    ):
    cmd = "curator --host %s --port %s delete --prefix '%s' --older-than %d" %\
          (es_host, es_port, prefix, cutoff)
    return check_call(cmd.split())


def _create_daily_index(server=settings.ES_SERVER, basename='goldstone'):
    """
    Create a new index in ElasticSearch and set up
    an alias for goldstone to point to the latest index.
    """
    now = date.today()
    index_name = basename + "-" + now.strftime("%Y.%m.%d")
    conn = Elasticsearch(server, bulk_size=500)
    template_f = open(os.path.join(os.path.dirname(__file__),
                                   "goldstone_es_template.json"), 'rb')
    template = json.load(template_f)

    try:
        conn.indices.create(index_name, body=template)
    except:
        logger.exception("got an exception creating daily index")
        raise
    else:
        if conn.indices.exists_alias(basename):
            return conn.indices.update_aliases({
                "actions": [
                    {"remove": {"index": "_all", "alias": basename}},
                    {"add": {"index": index_name, "alias": basename}}
                ]
            })
        else:
            return conn.indices.put_alias(basename, index_name)


@celery_app.task(bind=True)
def manage_es_indices(self,
                      es_host=settings.ES_HOST,
                      es_port=settings.ES_PORT):
    """
    Create a daily goldstone index, cull old goldstone and logstash indices
    :param es_host:
    :param es_port:
    :return: (Boolean, Boolean, Boolean)
    """
    result = []
    try:
        _create_daily_index(basename='goldstone')
        result.append(True)
    except:
        logger.exception("exception creating daily goldstone index")
        result.append(False)

    try:
        if settings.ES_GOLDSTONE_RETENTION is not None:
            _delete_indices("goldstone-",
                            settings.ES_GOLDSTONE_RETENTION,
                            es_host, es_port)
            result.append(True)
    except:
        logger.exception("exception deleting old goldstone indices")
        result.append(False)

    try:
        if settings.ES_LOGSTASH_RETENTION is not None:
            _delete_indices("logstash-",
                            settings.ES_LOGSTASH_RETENTION,
                            es_host, es_port)
            result.append(True)
    except:
        logger.exception("exception deleting old logstash indices")
        result.append(False)

    return tuple(result)
