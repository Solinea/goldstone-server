from pyes import *
import pickle
import json
from datetime import *
import pytz
import gzip

conn = ES("10.10.11.121:9200", bulk_size=1000)
indices = managers.Indices(conn)
idx_list = [i for i in indices.get_indices()]
last_idx = idx_list[len(idx_list)-1]
mapping_f = open("./mapping.pkl", 'wb')
data_f = gzip.open('data.json.gz', 'wb')

mapping = conn.indices.get_mapping(doc_type='openstack_log', indices=last_idx, raw=True)
#print json.dumps(mapping)

pickle.dump(mapping, mapping_f)
mapping_f.close()

end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
start = end - timedelta(weeks=4)

# tried several combinations of filters to weed out some 
# types of messages that made the logs to homogenous.
# fail for now.
#tf1 = TermFilter('host', 'compute-1.lab.solinea.com')
#tf2 = TermFilter('loglevel', 'audit')
#filt = ORFilter([NotFilter(tf1), NotFilter(tf2)])

filt = TermFilter('host', 'controller.lab.solinea.com')

q = RangeQuery(qrange=ESRange('@timestamp', start.isoformat(), end.isoformat()))

fq = FilteredQuery(q, filt)

rs = conn.search(fq.search(), size=500)

data = [r for r in rs]

json.dump(data, data_f)

data_f.close()
