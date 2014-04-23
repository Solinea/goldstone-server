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

from elasticsearch import *
import json
from datetime import *
import pytz
import gzip

conn = Elasticsearch("10.10.11.121:9200", bulk_size=500)

start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
end = datetime.now(tz=pytz.utc)

data_f = gzip.open('data.json.gz', 'wb')
template_f = gzip.open("./template.json.gz", 'wb')

template = conn.indices.get_template('logstash')
json.dump(template['logstash'], template_f)
template_f.close()

# get some general events
fq = {
    "query": {
        "range": {
            "@timestamp": {
                "gte": start.isoformat(),
                "lte": end.isoformat()
            }
        }
    }
}

print "query = " + json.dumps(fq)

result = [conn.search(index="_all", doc_type='syslog', body=fq,
                      size=1000),
          conn.search(index="_all", doc_type="nova_claims_summary_phys",
                      body=fq, size=1000, sort='@timestamp:desc'),
          conn.search(index="_all", doc_type="nova_claims_summary_virt",
                      body=fq, size=1000, sort='@timestamp:desc'),
          conn.search(index="_all", doc_type="nova_spawn_start",
                      body=fq, size=1000, sort='@timestamp:desc'),
          conn.search(index="_all", doc_type="nova_spawn_finish",
                      body=fq, size=1000, sort='@timestamp:desc'),
          conn.search(index="_all", doc_type="nova_hypervisor_stats",
                      body=fq, size=1000, sort='@timestamp:desc'),
          conn.search(index="_all", doc_type="openstack_api_stats",
                      body=fq, size=1000, sort='@timestamp:desc')]

print "exporting " + str(len(result)) + " sets"


json.dump(result, data_f)

data_f.close()
