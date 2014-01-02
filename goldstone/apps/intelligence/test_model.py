# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from unittest import TestCase

from pyes import *


class TestModel(TestCase):

    index_name = 'test_logstash'
    document_type = 'logs'
    conn = ES(bulk_size=1000)

    def setUp(self):
        #super(BulkTestCase, self).setUp()

        mapping = {
            u"@timestamp": {"type": "date","format": "dateOptionalTime"},
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

        self.conn.indices.delete_index(self.index_name)
        self.conn.indices.create_index(self.index_name)
        self.conn.indices.put_mapping(self.document_type, {'properties': mapping}, self.index_name)
        data = json.load(open("../../../etc/sample_es_data.json"))
        for rec in data:
            self.conn.index(rec)
        self.conn.indices.refresh(self.index_name)

        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        print("%d" %rs.count())
        self.assertEqual(1000, rs.count())

if __name__ == '__main__':
    TestModel.setUp()

