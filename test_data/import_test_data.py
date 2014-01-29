from elasticsearch import *
import json
import gzip

conn = Elasticsearch("localhost:9200", bulk_size=500)
if conn.indices.exists("log_samples"):
    conn.indices.delete("log_samples")

idx_body = {'settings': {
            'index.analysis.analyzer.default.stopwords': '_none_',
            'index.refresh_interval': '5s',
            'index.analysis.analyzer.default.type': 'standard'
        }}
mapping_f = gzip.open('./mapping.json.gz', 'rb')
idx_body['mappings'] = json.load(mapping_f)
conn.indices.create("log_samples", body=idx_body)
data_f = gzip.open('./data.json.gz', 'r')
data = json.load(data_f)
for event in data['hits']['hits']:
    print "indexing event: ", event
    rv = conn.index('log_samples', 'logs', event['_source'])
    print "result: ", rv

conn.indices.refresh(["log_samples"])

q = {"query": {"match_all": {}}}
rs = conn.search(body=q, index="_all")

print("%d docs inserted" % rs['hits']['total'])
