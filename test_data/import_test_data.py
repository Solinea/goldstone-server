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
        rv = conn.index('logstash_test', 'logs', event['_source'])
        print "result: ", rv

conn.indices.refresh(["logstash_test"])

q = {"query": {"match_all": {}}}
rs = conn.search(body=q, index="_all")

print("%d docs inserted" % rs['hits']['total'])
