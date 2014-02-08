from elasticsearch import *
import json
from datetime import *
import pytz
import gzip

conn = Elasticsearch("10.10.11.122:9200", bulk_size=500)

#mapping_f = gzip.open("./mapping.json.gz", 'wb')
data_f = gzip.open('data.json.gz', 'wb')
template_f = gzip.open("./template.json.gz", 'wb')

template = conn.indices.get_template('logstash')
json.dump(template['logstash'], template_f)
template_f.close()

end = datetime(2014, 02, 07, 23, 59, 59, tzinfo=pytz.utc)
start = end - timedelta(weeks=52)


fq = {
    "query": {
        "filtered": {
            "filter": {
                "and": {
                    "filters":
                    [{
                        "not": {
                             "filter": {
                                "terms": {
                                    "loglevel": [
                                        "DEBUG",
                                        "AUDIT"
                                    ]
                                }
                            }
                        }
                     },
                    {
                        "not": {
                            "filter": {
                                "term": {
                                    "host.raw": "compute-1.lab.solinea.com"
                                }
                            }
                        }
                    }]
                }
            },
            "query": {
                "range": {
                    "@timestamp": {
                        "gte": start.isoformat(),
                        "lte": end.isoformat()
                    }
                }
            }
        }
    }
}

print fq


result = [conn.search(index="_all", body=fq, size=500)]

end = datetime(2014, 02, 07, 23, 59, 59, tzinfo=pytz.utc)
start = end - timedelta(weeks=4)
fq = {
    "query": {
        "filtered": {
            "filter": {
                "term": {
                    "type": "goldstone_nodeinfo"
                }
            },
            "query": {
                "range": {
                    "@timestamp": {
                        "gte": start.isoformat(),
                        "lte": end.isoformat()
                    }
                }
            }
        }
    }
}

result.append(conn.search(index="_all", body=fq, size=500))
json.dump(result, data_f)
data_f.close()
