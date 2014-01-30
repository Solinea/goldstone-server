from elasticsearch import *
import json
from datetime import *
import pytz
import gzip

conn = Elasticsearch("10.10.11.121:9200", bulk_size=500)

mapping_f = gzip.open("./mapping.json.gz", 'wb')
data_f = gzip.open('data.json.gz', 'wb')

mapping = conn.indices.get_mapping(index="_all", doc_type='openstack_log')
json.dump(mapping, mapping_f)
mapping_f.close()

end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
start = end - timedelta(weeks=4)


fq = {
    "query": {
        "filtered": {
            "query": {
                "range": {
                    "@timestamp": {
                        "gte": start.isoformat(),
                        "lte": end.isoformat()
                    }
                }
            },
            "filter": {
                "term": {
                    "host": "controller.lab.solinea.com"
                }
            }
        }
    }
}

result = conn.search(index="_all", body=fq, size=500)
json.dump(result, data_f)
data_f.close()
