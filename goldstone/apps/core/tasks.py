# Copyright '2014' Solinea, Inc.
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

__author__ = 'stanford'

from goldstone.celery import app as celery_app
from django.conf import settings
from elasticsearch import *
import os
import json
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def create_daily_index(self, server=settings.ES_SERVER,
                                 basename='goldstone'):
    """
    Create a new index in ElasticSearch and set up
    an alias for goldstone to point to the latest index.
    """
    now = date.today()
    yesterday = date.today() - timedelta(days=1)

    index_name = basename + "-" + now.strftime("%Y.%m.%d")
    prev_index_name = basename + "-" + yesterday.strftime("%Y.%m.%d")
    conn = Elasticsearch(server, bulk_size=500)
    template_f = open(os.path.join(os.path.dirname(__file__), "..", "..",
                      "..", "external", "elasticsearch", "templates",
                      "goldstone.json"), 'rb')
    template = json.load(template_f)

    conn.indices.create(index_name, body=template)
    if conn.indices.exists_alias(basename):
        conn.indices.get_alias(name=basename)
        conn.indices.update_aliases({
            "actions": [
                {"remove": { "index": "_all", "alias": basename}},
                {"add": {"index": index_name, "alias": basename}}
            ]
        })
    else:
        conn.indices.put_alias(basename, index_name)


