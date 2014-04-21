__author__ = 'stanford'

from django.test import TestCase, SimpleTestCase
from django.conf import settings
from goldstone.models import GSConnection
from elasticsearch import *
import gzip
import os
import json
from goldstone.utils import _stored_api_call, _get_keystone_client, \
    _construct_api_rec, GoldstoneAuthError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class PrimeData(TestCase):
    # this should run before all SimpleTestCase methods.
    INDEX_NAME = 'logstash-test'
    DOCUMENT_TYPE = 'logs'
    conn = Elasticsearch(settings.ES_SERVER)
    template_f = gzip.open(os.path.join(os.path.dirname(__file__), "apps",
                                        "..", "..", "test_data",
                                        "template.json.gz"), 'rb')
    template = json.load(template_f)

    try:
        conn.indices.delete("_all")
    finally:
        {}

    conn.indices.create(INDEX_NAME, body=template)

    q = {"query": {"match_all": {}}}
    data_f = gzip.open(os.path.join(os.path.dirname(__file__), "apps", "..",
                                    "..", "test_data", "data.json.gz"))
    data = json.load(data_f)
    for dataset in data:
        for event in dataset['hits']['hits']:
            rv = conn.index(INDEX_NAME, event['_type'],
                            event['_source'])

    conn.indices.refresh([INDEX_NAME])
    q = {"query": {"match_all": {}}}
    rs = conn.search(body=q, index="_all")


class GSConnectionModel(SimpleTestCase):

    def test_connection(self):
        conn1 = GSConnection().conn
        conn2 = GSConnection(settings.ES_SERVER).conn
        q = {"query": {"match_all": {}}}
        r1 = conn1.search(body=q)
        self.assertIsNotNone(r1)
        r2 = conn2.search(body=q)
        self.assertIsNotNone(r2)


class UtilsTests(SimpleTestCase):

    def test_get_keystone_client(self):
        self.assertRaises(GoldstoneAuthError,
                          _get_keystone_client, user='abc')
        self.assertRaises(GoldstoneAuthError,
                          _get_keystone_client, passwd='abc')
        self.assertRaises(GoldstoneAuthError,
                          _get_keystone_client, tenant='no-tenant')
        self.assertRaises(GoldstoneAuthError,
                          _get_keystone_client,
                          auth_url='http://www.solinea.com')
        reply = _get_keystone_client()
        self.assertIn('client', reply)
        self.assertIn('hex_token', reply)

    def test_stored_api_call(self):
        component = 'nova'
        endpoint = 'compute'
        bad_endpoint = 'xyz'
        path = '/os-hypervisors'
        bad_path = '/xyz'

        self.assertRaises(LookupError, _stored_api_call, component,
                          bad_endpoint, path)
        bad_path_call = _stored_api_call(component, endpoint, bad_path)
        self.assertIn('reply', bad_path_call)
        self.assertIn('db_record', bad_path_call)
        self.assertEquals(bad_path_call['db_record']['response_status'], 404)
        good_call = _stored_api_call(component, endpoint, path)
        self.assertIn('reply', good_call)
        self.assertIn('db_record', good_call)
        self.assertEquals(good_call['db_record']['response_status'], 200)

    def test_construct_api_rec(self):
        component = 'abc'
        endpoint = 'compute'
        path = '/os-hypervisors'
        good_call = _stored_api_call(component, endpoint, path)
        self.assertIn('reply', good_call)
        reply = good_call['reply']
        self.assertIn('db_record', good_call)
        ts = datetime.utcnow()
        rec = _construct_api_rec(reply, component, ts)
        self.assertIn('response_time', rec)
        self.assertEqual(rec['response_time'],
                         reply.elapsed.total_seconds())
        self.assertIn('response_status', rec)
        self.assertEqual(rec['response_status'], reply.status_code)
        self.assertIn('response_length', rec)
        self.assertEqual(rec['response_length'],
                         int(reply.headers['content-length']))
        self.assertIn('component', rec)
        self.assertEqual(rec['component'], component)




