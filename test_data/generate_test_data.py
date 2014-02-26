from elasticsearch import *
import json
from datetime import *
import pytz
import gzip

conn = Elasticsearch("10.10.11.121:9200", bulk_size=500)

end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)
start = end - timedelta(weeks=2)

data_f = gzip.open('data.json.gz', 'wb')
template_f = gzip.open("./template.json.gz", 'wb')

template = conn.indices.get_template('logstash')
json.dump(template['logstash'], template_f)
template_f.close()

# get some general events
fq = {
    "query": {
        "filtered": {
            "filter": {
                "and": {
                    "filters": [
                        {
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
                                        "host.raw": "compute-1"
                                    }
                                }
                            }
                        }
                    ]
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

result = [conn.search(index="_all", body=fq, size=500)]

fq = {
    "query": {
        "filtered": {
            "filter": {
                "term": {
                    "loglevel": "INFO"
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

result.append(conn.search(index="_all", body=fq, size=1000))

fq = {
    "query": {
        "filtered": {
            "filter": {
                "term": {
                    "type": "nova_claims_summary_phys"
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

result.append(conn.search(index="_all", body=fq, size=1000))

fq = {
    "query": {
        "filtered": {
            "filter": {
                "term": {
                    "type": "nova_claims_summary_virt"
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

result.append(conn.search(index="_all", body=fq, size=1000))

json.dump(result, data_f)
data_f.close()
