"""Development settings, with Elasticsearch remote and PostgreSQL local."""
from .development import *           # pylint: disable=W0614,W0401

#
# override ES settings
#
ES_HOST = "10.10.20.201"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}
