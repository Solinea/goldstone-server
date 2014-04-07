__author__ = 'stanford'

from django.test import TestCase, SimpleTestCase
from django.conf import settings
from .models import GSConnection
from elasticsearch import *
import gzip
import os
import json


class PrimeData(TestCase):
    # this should run before all SimpleTestCase methods.
    INDEX_NAME = 'logstash-test'
    DOCUMENT_TYPE = 'logs'
    conn = Elasticsearch(settings.ES_SERVER)
    template_f = gzip.open(os.path.join(os.path.dirname(__file__), "..",
                                        "test_data", "template.json.gz"), 'rb')
    template = json.load(template_f)

    try:
        conn.indices.delete("_all")
    finally:
        {}

    conn.indices.create(INDEX_NAME, body=template)

    q = {"query": {"match_all": {}}}
    data_f = gzip.open(os.path.join(os.path.dirname(__file__), "..",
                                    "test_data", "data.json.gz"))
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
