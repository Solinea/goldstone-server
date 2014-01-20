from pyes import *
import json
import gzip

conn = ES("localhost:9200", bulk_size=1000)
conn.indices.delete_index_if_exists("log_samples")
conn.indices.create_index("log_samples")
mapping = {
            u"@timestamp": {"type": "date", "format": "dateOptionalTime"},
            u"@version": {"type": u"string"},
            u"_message": {"type": u"string"},
            u"component": {"type": u"string"},
            u"host": {"type": u"string"},
            u"loglevel": {"type": u"string"},
            u"message": {"type": u"string"},
            u"path": {"type": u"string"},
            u"pid": {"type": u"string"},
            u"program": {"type": u"string"},
            u"received_at": {"type": u"string"},
            u"separator": {"type": u"string"},
            u"tags": {"type": u"string"},
            u"type": {"type": u"string"}
        }

conn.indices.put_mapping("logs", {'properties': mapping}, "log_samples")

data_f = gzip.open('sample_es_data.json.gz', 'r')
docs = json.load(data_f)
for doc in docs['hits']['hits']:
    conn.index(doc, 'log_samples', 'logs', bulk=True)

conn.refresh()

q = MatchAllQuery().search()
rs = conn.search(q, indices=['log_samples'])

print("%d docs inserted" %rs.count())
