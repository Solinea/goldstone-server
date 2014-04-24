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
import gzip

conn = Elasticsearch("localhost:9200", bulk_size=500)
template_f = gzip.open('./template.json.gz', 'rb')
template = json.load(template_f)

try:
    conn.indices.delete("_all")
finally:
    {}

conn.indices.create("logstash_test", body=template)
data_f = gzip.open('./data.json.gz', 'r')
data = json.load(data_f)
for dataset in data:
    for event in dataset['hits']['hits']:
        print "indexing event: ", event
        rv = conn.index('logstash_test', event['_type'], event['_source'])
        print "result: ", rv

conn.indices.refresh(["logstash_test"])

q = {"query": {"match_all": {}}}
rs = conn.search(body=q, index="_all")

print("%d docs inserted" % rs['hits']['total'])
