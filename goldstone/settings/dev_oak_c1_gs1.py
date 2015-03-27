from .development import *         # pylint: disable=W0614,W0401

#
# override ES settings
#
ES_HOST = "10.10.10.201"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}

MOCK_DATA = False
