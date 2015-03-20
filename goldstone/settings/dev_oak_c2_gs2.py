"""Use the gs2 server, which is running a non-master branch, like GOLD-686.

Elasticsearch is remote and PostgreSQL is local.

"""
from .development import *       # pylint: disable=W0614,W0401

#
# override ES settings
#
ES_HOST = "10.10.20.202"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}

# ElasticUtils Settings
ES_URLS = [ES_HOST + ":" + ES_PORT]
