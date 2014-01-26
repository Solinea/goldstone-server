from pyes import *
import json
import gzip
import pickle

conn = ES("localhost:9200", bulk_size=500)
conn.indices.delete_index_if_exists("log_samples")
conn.indices.create_index("log_samples")


mapping_f = open('./mapping.pkl', 'rb')
data_f = gzip.open('./data.txt.gz', 'r')
mapping = pickle.load(mapping_f)

rv = conn.indices.put_mapping("logs", mapping, "log_samples")
print rv

data = json.load(data_f)
for event in data:
    print event
    rv = conn.index(event, 'log_samples', 'logs', bulk=True)
    print rv 

conn.indices.refresh(["log_samples"])

q = MatchAllQuery().search()
rs = conn.search(q, indices=['log_samples'])

print("%d docs inserted" %rs.count())
