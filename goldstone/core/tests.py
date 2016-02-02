"""Core app unit tests.

This module demonstrates no less than 3 strategies for mocking ES.

"""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import datetime
from django.conf import settings
from django.test import SimpleTestCase, TestCase
import elasticsearch
import elasticsearch_dsl
import smtplib
from elasticsearch_dsl import String, Date, Nested
from elasticsearch_dsl.result import Response
import mock
from rest_framework.test import APISimpleTestCase, APITestCase

from goldstone.core.tasks import check_for_pending_alerts
from goldstone.test_utils import Setup
from .models import Image, ServerGroup, NovaLimits, PolyResource, Host, \
    Aggregate, Hypervisor, Port, Cloudpipe, Network, Project, Server, Addon
from . import tasks
from .utils import custom_exception_handler, process_resource_type, parse
from goldstone.drfes.new_models import DailyIndexDocType
from goldstone.core.models import SavedSearch, CADFEventDocType, \
    AlertSearch, Alert, EmailProducer, AlertSearchSQLQuery, \
    AlertSearchESQuery
from pycadf import event, cadftype, cadftaxonomy
import uuid
from django.db import connection
from elasticsearch_dsl import Search

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network, Server, Addon]

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE


def load_persistent_rg(startnodes, startedges):
    """Create PolyResource database rows.

    :param startnodes: The nodes to add.
    :type startnodes: A "NODES" iterable
    :param startedges: The edges to add.
    :type startedges: An "EDGES" iterable

    """

    nameindex = 0

    # Create the resource nodes. Each will have a unique name. Note that
    # the native_id is stored in the .attributes attribute.
    for nodetype, native_id in startnodes:
        nodetype.objects.create(native_id=native_id,
                                native_name="name_%d" % nameindex)
        nameindex += 1

    # Create the resource graph edges. We don't use the update_edges() method,
    # because some of these tests test it. Each startedges entry may have two
    # or three values. Each row's edge information is currently empty.
    for entry in startedges:
        # Unpack the entry.
        source = entry[0]
        dest = entry[1]
        attributes = entry[2] if len(entry) == 3 else {}

        # Get the from and to nodes.
        fromnode = source[0].objects.get(native_id=source[1])
        tonode = dest[0].objects.get(native_id=dest[1])

        # Add the edge
        edges = fromnode.edges
        edges.append((tonode.uuid, attributes))

        # Save it in the row.
        fromnode.edges = edges
        fromnode.save()


class EmailProducerTests(SimpleTestCase):
    """ Test EmailProducer class model
    """

    def test_parent_producer_send_fail(self):
        """ Calling send on the parent-producer's send:
          This should throw an exception """
        alert_search = AlertSearch()
        alert_search.save()
        producer_inst = EmailProducer(query=alert_search,
                                      sender='abc@x.com',
                                      receiver='y@y.com')
        producer_inst.save()
        try:
            rv = super(EmailProducer, producer_inst).send(producer_inst)
        except Exception as e:
            self.assertEqual(str(e),
                             str(NotImplementedError(
                                 'Producer must implement send.',)))
        alert_search.delete()
        producer_inst.delete()

    def test_send_email_success(self):
        """ Tests that sending out an email returns an integer value
            rv <= 0 failure to send or error
            rv >=1 success in send, rv corresponds to number of recipients
        """

        EmailProducer.send = mock.Mock(return_value=1)
        self.assertEqual(EmailProducer.send('title', 'body', 'abc@x.com',
                                            list('xyz@y.com')), 1)
        self.assertEqual(EmailProducer.send.call_count, 1)

    def test_send_email_failure(self):
        """ Test if sending out an email returns an integer value
            rv <= 0 failure to send or error
            rv >=1 success in send, rv corresponds to number of recipients
        """

        EmailProducer.send = mock.Mock(return_value=smtplib.SMTPException)
        self.assertEqual(EmailProducer.send('title', 'body', 'abc@x.com',
                                            list('xyz@y.com')),
                         smtplib.SMTPException)
        self.assertEqual(EmailProducer.send.call_count, 1)

    def test_inner_send_mail_function(self):

        as_obj = AlertSearch()
        as_obj.save()
        new_alert = Alert(owner='core',
                          created='2015-09-01T13:20:30+03:00',
                          msg_title='Alert : openstack syslog errors',
                          msg_body='There are 23 incidents of syslog errors',
                          query_id=as_obj.pk)
        new_alert.save()
        with mock.patch("django.core.mail.send_mail") \
                as sm_mock:
                sm_mock.return_value = 1

                producer_inst = EmailProducer(query=as_obj,
                                              sender='abc@x.com',
                                              receiver='y@y.com')
                producer_inst.save()
                rv = producer_inst.send(new_alert)
                self.assertEqual(rv, sm_mock.return_value)

        as_obj.delete()
        new_alert.delete()


class TaskTests(SimpleTestCase):
    """Test task hooks."""

    def test_delete_indices(self):
        """Tests that delete indices returns result of check_call."""

        tasks.check_call = mock.Mock(return_value='mocked')
        # pylint: disable=W0212
        self.assertEqual(tasks.delete_indices('abc', 10), 'mocked')
        self.assertEqual(tasks.check_call.call_count, 1)

    def test_no_saved_alerts_for_task(self):
        # simulate results when there are no saved alerts to call
        rv = check_for_pending_alerts()
        self.assertIsInstance(rv, type(None))

    @mock.patch('goldstone.core.tasks.AlertSearch')
    @mock.patch('goldstone.core.tasks.EmailProducer')
    @mock.patch('goldstone.core.models.Search')
    @mock.patch('goldstone.core.tasks.Alert')
    def test_check_for_pending_alerts(self, a_mock, search_mock, ep_mock,
                                      as_mock):
        """Test that task processes all producers even when exception raised
        by one"""

        a_mock.save.return_value = None

        alert_search = mock.MagicMock(spec=AlertSearch)
        alert_search.name = 'name'
        alert_search._state = mock.MagicMock()
        alert_search.savedsearch_ptr_id = mock.MagicMock()
        alert_search.save.return_value = None

        as_mock.objects = mock.MagicMock()
        as_mock.objects.all = mock.MagicMock()
        as_mock.objects.all.return_value = [alert_search]

        search_mock.execute.return_value = {'hits': {'total': 1}}
        alert_search.search_recent = mock.MagicMock(
            return_value=[Search(), None, None])
        # alert_search.return_query_results = mock.MagicMock(
            # return_value=[{'Key': 'Value'}, 1])
        self.assertEqual(alert_search.search_recent.call_count, 0)

        # mock two producers with fk back to the the alert search
        p1 = mock.MagicMock(spec=EmailProducer, query=alert_search)
        p2 = mock.MagicMock(spec=EmailProducer, query=alert_search)
        ep_mock.objects = mock.MagicMock()
        ep_mock.objects.filter = mock.MagicMock()
        ep_mock.objects.filter.return_value = [p1, p2]

        # simulate results when all producers succeed
        rv = check_for_pending_alerts()
        self.assertIsInstance(rv, list)
        self.assertEqual(len(rv), 2)
        self.assertEqual(alert_search.search_recent.call_count, 1)

        # simulate results when a producer throws an exception
        p1.send.side_effect = Exception
        rv = check_for_pending_alerts()
        self.assertEqual(len(rv), 2)
        self.assertEqual(alert_search.search_recent.call_count, 2)


class AlertSearchModelTests(TestCase):

    def test_build_msg_template(self):
        as_obj = AlertSearch()
        as_obj.save()
        search_hits = 215
        msg_dict = as_obj.build_alert_template(hits=search_hits)
        self.assertTrue(str(search_hits) in str(msg_dict['title']))
        self.assertTrue(str(search_hits) in str(msg_dict['body']))

    def test_alert_search_recent(self):
        search_obj = AlertSearch()
        search_obj.save()
        s = '<elasticsearch_dsl.search.Search object at 0x7fb60f642a90>'
        start = '2016-01-23 15:15:06.007474+00'
        end = '2016-01-23 15:25:06.007474+00'

        with mock.patch("goldstone.core.models.AlertSearch.search_recent") \
                as esmock:
            esmock.return_value = s, start, end
            saved_alerts = AlertSearch.objects.all()
            for obj in saved_alerts:
                self.assertEqual(obj.search_recent(), esmock.return_value)
                self.assertEqual(esmock.call_count, 1)

    def test_alert_search_save(self):
        with mock.patch("goldstone.core.models.AlertSearch.save") \
                as esmock:
                esmock.return_value = None
                self.assertEqual(AlertSearch.save(), esmock.return_value)
        self.assertEqual(esmock.call_count, 1)


class AlertSearchSQLQueryModelTests(SimpleTestCase):

    """
        Write a test to mock insertion of vulnerability data into the table
        and test search(), search_recent() and return_query_results()
        functionality
    """
    sample_vulnerability = [{"ossa_id": "OSSA-2014-020",
                            "link": "http://abc.com/ossa/2014020",
                             "processed": True,
                             "name": "OpenStack upgrade causes Memory leak",
                             "description": "It's a real mess",
                             "affects": "Swift: 1.11.0 to 1.13.1",
                             "patches": "I'm depending on you, son",
                             "references": "Impeccable",
                             "notes": "A",
                             "cve": "CVE-2014-3497",
                             "notice_date": "2014-06-19",
                             "created":"2015-01-30 00:00:12.017634+00",
                             "updated":"2016-01-30 00:00:12.017634+00"}]

    @mock.patch('goldstone.core.models.AlertSearchSQLQuery')
    def test_check_sql_search_call(self, asql_mock):

        """Test that search and search_recent calls return the right
        results for a SQL-based query
        """

        sample_db_entry = {"ossa_id": "OSSA-2014-020",
                    "link": "http://abc.com/ossa/2014020",
                    "processed": True,
                    "name": "OpenStack upgrade causes Memory leak",
                    "description": "It's a real mess",
                    "affects": "Swift: 1.11.0 to 1.13.1",
                    "patches": "Yet to be released",
                    "references": "Impeccable",
                    "notes": "A",
                    "cve": "CVE-2014-3497",
                    "notice_date": "2014-06-19"}

        start_time = '2016-01-30 00:00:12.017634+00'
        end_time = '2016-02-01 00:00:12.017634+00'

        sql_db_entry = mock.MagicMock(spec=sample_db_entry)
        sql_db_entry.name = 'name'
        sql_db_entry._state = mock.MagicMock()
        sql_db_entry.savedsearch_ptr_id = mock.MagicMock()
        # sql_db_entry.save.return_value = None

        asql_mock.objects = mock.MagicMock()
        asql_mock.objects.all = mock.MagicMock()
        asql_mock.objects.all.return_value = [sql_db_entry]

        cur_mock = mock.MagicMock(spec=connection.cursor())
        cur_ec_mock = mock.MagicMock(spec=cur_mock)
        cur_ec_mock.execute = mock.MagicMock(return_value=[sample_db_entry])

        # simulate results of a search() call with 1 db entry
        as_sql_inst = AlertSearchSQLQuery()
        as_sql_inst.save()
        db_rv = as_sql_inst.search()
        self.assertIsInstance(db_rv, list)
        self.assertEqual(len(db_rv), 0)

        # simulate results of a search_recent call with 1 db entry
        #db_rv, start, end = as_sql_inst.search_recent()
        db_rv = as_sql_inst.search_recent()
        self.assertIsInstance(db_rv, list)
        # self.assertIsInstance(db_rv, dict)
        # self.assertEqual(len(db_rv), 1)
        # self.assertIsInstance(db_rv, dict)
        # self.assertEqual(len(db_rv), 1)


class DailyIndexDocTypeTests(SimpleTestCase):

    class LogMessage(DailyIndexDocType):

        message = String()
        timestamp = Date()

        class Meta:
            doc_type = 'syslog'
            index = 'logstash-*'

    def test_search_wildcard_index(self):
        s = self.LogMessage.search()
        result = s.execute()
        # verify that execute() returns an es_dsl result object
        self.assertIsInstance(result, Response)

    def test_index_today(self):
        import arrow
        date_fmt = self.LogMessage.INDEX_DATE_FMT
        today = arrow.utcnow().format(date_fmt)
        dt = self.LogMessage()
        self.assertEqual(dt._index_today(), 'logstash-' + today)

    def test_lifecycle(self):
        import arrow

        # to avoid worrying about searching the raw field, let's use a
        # lowercase string with no special chars.
        message = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        print "test_lifecycle() : message "
        print message
        created = arrow.utcnow().isoformat()

        # instantiate and persist the LogMessage
        lm = self.LogMessage(message=message, created=created)
        result = lm.save()
        # verify that calling save() on es_dsl results in persistence
        self.assertEqual(result, True)

        # force flush the index so our test has a chance to succeed.
        lm._doc_type.using.indices.flush(lm.meta.index)

        # Sadly, the get method does not accept a wildcard index, so you will
        # need to either know which index the document is in, or use the search
        # method to get it back.  When you save an instance, the meta attrs
        # id and index are set, so if it's important information, you may
        # want to persist it in postgres.
        glm = self.LogMessage.get(id=lm.meta.id, index=lm.meta.index)
        # Method 1 : verify that what we obtain by calling a get() with
        # index-filtering is indeed the log-message we persisted earlier
        self.assertEqual(lm.message, glm.message)
        self.assertEqual(lm.created, glm.created)
        self.assertIsInstance(glm, self.LogMessage)

        # so let's try to find it via search.
        s = self.LogMessage.search()
        # filter by the string log-message we used for creating a LogMessage
        # instance. This object was used earlier to create and persist a new
        # log-message in DailyIndexDocType.
        slm = s.filter('term', message=message) \
            .filter('term', created=created) \
            .execute()[0]

        # Method 2 : verify that what we got by searching and filtering
        # by message is indeed the log-message we persisted earlier
        self.assertEqual(lm.message, slm.message)
        self.assertEqual(lm.created, slm.created)
        self.assertIsInstance(slm, self.LogMessage)

        # let's make sure we can delete an object
        result = slm.delete()
        self.assertIsNone(result)

        # force flush the index so our test has a chance to succeed.
        lm._doc_type.using.indices.flush(lm.meta.index)

        # we should not be able to find the record now.
        s = self.LogMessage.search()
        slm2 = s.filter('term', message=message) \
            .filter('term', created=created) \
            .execute()
        self.assertEqual(len(slm2.hits), 0)

    def test_cadf_event(self):
        initiator_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        observer_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        target_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])

        # create a CADF event something like (using .as_dict()):
        # {'action': 'read',
        #  'eventTime': '2015-12-21T18:47:50.275715+0000',
        #  'eventType': 'activity',
        #  'id': '2f38134e-c880-5a38-8b3e-101554a71e37',
        #  'initiatorId': '46e4be801e0b4c2ab373b26dceedce1a',
        #  'name': 'test event',
        #  'observerId': 'a6b012069d174d4fbf9acee03367f068',
        #  'outcome': 'success',
        #  'targetId': '005343040e084c3ba90f7bac1b97e1ae',
        #  'typeURI': 'http://schemas.dmtf.org/cloud/audit/1.0/event'}
        e = event.Event(
            eventType=cadftype.EVENTTYPE_ACTIVITY,
            action=cadftaxonomy.ACTION_READ,
            outcome=cadftaxonomy.OUTCOME_SUCCESS,
            initiatorId=initiator_id,
            targetId=target_id,
            observerId=observer_id,
            name="test event")

        cadf = CADFEventDocType(event=e)

        result = cadf.save()
        self.assertTrue(result)

        # force flush the index so our test has a chance to succeed.
        cadf._doc_type.using.indices.flush(cadf.meta.index)

        ge = CADFEventDocType.get(id=cadf.meta.id, index=cadf.meta.index)
        self.assertEqual(cadf.traits['initiatorId'], ge.traits['initiatorId'])
        self.assertEqual(cadf.traits['eventTime'], ge.traits['eventTime'])
        self.assertIsInstance(ge, CADFEventDocType)

        s = CADFEventDocType.search()
        s = s.filter('term', ** {'traits.initiatorId': initiator_id})\
            .execute()
        self.assertIsInstance(s, Response)
        self.assertEqual(len(s.hits), 1)

        # let's make sure we can delete an object
        result = cadf.delete()
        self.assertIsNone(result)

        # force flush the index so our test has a chance to succeed.
        cadf._doc_type.using.indices.flush(cadf.meta.index)

        # we should not be able to find the record now.
        s2 = CADFEventDocType.search()
        # Alternate form of filter/query expression since we have a nested
        # field.
        r2 = s2.filter('term', ** {'traits.initiatorId': initiator_id})\
            .execute()
        self.assertEqual(len(r2.hits), 0)


class CADFEventDocTypeTests(SimpleTestCase):
    """
        Test CADFEventDocType class for correctness
    """

    @classmethod
    def test_event_save(self):

        initiator_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        observer_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])
        target_id = ''.join([c for c in str(uuid.uuid4()) if c != '-'])

        e = event.Event(
            eventType=cadftype.EVENTTYPE_ACTIVITY,
            action=cadftaxonomy.ACTION_READ,
            outcome=cadftaxonomy.OUTCOME_SUCCESS,
            initiatorId=initiator_id,
            targetId=target_id,
            observerId=observer_id,
            name="test event")

        pyobj = CADFEventDocType(e)
        isinstance(pyobj, CADFEventDocType)
        new_event = event.Event()
        isinstance(new_event, event.Event)
        trait_dict = pyobj._get_traits_dict(new_event)
        isinstance(trait_dict, dict)
        assert('id' in trait_dict['traits'])
        assert('eventTime' in trait_dict['traits'])
        event_saved_flag = pyobj.save(pyobj)
        assert(event_saved_flag)


class SavedSearchModelTests(TestCase):
    """

    Test the
    Test SavedSearch model for :
    1. Given a query-string, build a correct elastic search query object
    2. Given this query object, execute the query against the log indices
    3. Return the rows of results back to caller
    4. Fire an independent elastic search query and compare results with 3.
    """

    fixtures = ['core_initial_data.yaml']

    def test_loaded_data_from_fixtures(self):
        self.assertGreater(SavedSearch.objects.all(), 0)

    def test_predefined_search_func(self):
        owner = 'core'
        sys_defined_searches = SavedSearch.objects.filter(owner=owner)

        for entry in sys_defined_searches:
            search_obj = entry.search()
            self.assertIsInstance(search_obj, elasticsearch_dsl.search.Search)

        for entry in sys_defined_searches:
            search_obj, start, end = entry.search_recent()
            self.assertIsInstance(search_obj, elasticsearch_dsl.search.Search)
            self.assertIsInstance(start, datetime.datetime)
            self.assertIsInstance(end, datetime.datetime)


class PolyResourceModelTests(APITestCase):
    """Test the PolyResourceModel."""

    fixtures = ["core_initial_data.yaml"]

    def test_logs(self):
        """Test that the logs method returns an appropriate search object."""

        # pylint: disable=R0204
        expectation = {'query_string': {'query': 'polly'}}

        polyresource = PolyResource(native_name='polly')
        result = polyresource.logs().to_dict()
        self.assertDictEqual(expectation, result['query'])

    def test_events(self):
        """test that the events method returns an appropriate search object."""

        expectation = {"query_string": {"query": "polly"}}
        polyresource = PolyResource(native_name='polly')
        result = polyresource.events().to_dict()
        self.assertDictEqual(expectation, result['query'])


class CustomExceptionHandlerTests(APISimpleTestCase):
    """Tests for DRF custom exception handling."""

    def test_drf_handled_exception(self):
        """Test that we pass DRF recognized exceptions through unmodified"""

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = "it's handled"
            result = custom_exception_handler(None, None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, "it's handled")

    def test_502_error_exceptions(self):
        """Test ES connection exception is handled"""

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.ConnectionError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 502)

    def test_500_error_exceptions(self):
        """Test ES connection exception is handled"""

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.SerializationError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            result = custom_exception_handler(
                elasticsearch.exceptions.ImproperlyConfigured("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            result = custom_exception_handler(
                elasticsearch.exceptions.TransportError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            exception_handler.return_value = None
            result = custom_exception_handler(Exception("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

    def test_not_exception(self):
        """Test ES connection exception is handled"""

        with mock.patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler('what??', None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, None)


class UpdateEdges(SimpleTestCase):
    """Test PolyResource.update_edges."""

    def setUp(self):
        """Run before every test."""

        for nodetype in NODE_TYPES:
            nodetype.objects.all().delete()

    def test_no_edges(self):
        """The source node's type has no edges.

        Normally, this condition should never occur. Regardless, nothing should
        be done.

        """

        # Test data. Each entry is (Type, native_id).
        NODES = [(Host, "deadbeef")]

        load_persistent_rg(NODES, [])

        # Get the Host instance and do the test.
        node = Host.objects.all()[0]
        node.outgoing_edges = mock.MagicMock()
        node.outgoing_edges.return_value = []
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_neighbor_no_matchtype(self):
        """The candidates for a node's destination neighbor have no matching
        attribute.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Aggregate, "0"),
                 (Hypervisor, "1"),
                 (Hypervisor, "2")]

        load_persistent_rg(NODES, [])

        # Set up the host attributes.
        node = Host.objects.all()[0]
        node.cloud_attributes = {"host_name": "fred"}
        node.save()

        # Modify the candidate destination nodes' attributes so they don't have
        # the desired match key.
        for target_type in [Aggregate, Hypervisor]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"silly": "putty", "emacs": "sacred"}
                row.save()

        # Do the test.
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_no_attribute_value(self):
        """The node's neighbor has a matching attribute, but its value does not
        match the source node's.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Aggregate, "0"),
                 (Hypervisor, "1"),
                 (Hypervisor, "2")]

        load_persistent_rg(NODES, [])

        # Set up the host attributes.
        node = Host.objects.all()[0]
        node.cloud_attributes = {"host_name": "fred"}
        node.save()

        # Modify the candidate destination nodes' attributes so they have the
        # desired match key, but the values won't match.
        for target_type in [Aggregate, Hypervisor]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"hosts": "putty",
                                        "hypervisor_hostname": "sacred"}
                row.save()

        # Do the test.
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_no_matching_nghbr_types(self):
        """No instance matches the desired type for the neighbor, although
        they happen to have matching match_attributes.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Image, "deadbeef"),
                 (Cloudpipe, "deadbeef"),
                 (Port, "deadbeef")]

        load_persistent_rg(NODES, [])

        # Set up the host attributes.
        node = Host.objects.all()[0]
        node.cloud_attributes = {"host_name": "fred"}
        node.save()

        # Modify the non-candidate destination nodes' attributes so they have
        # the desired match key and value.
        for target_type in [Image, Cloudpipe, Port]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"hosts": "fred",
                                        "hypervisor_hostname": "fred"}
                row.save()

        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_multiple_neighbor_matches(self):
        """Multiple instances match the desired neighbor type.

        Edges should be added from the source node to the mutiple destinations.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Image, "cad"),
                 (Cloudpipe, "deadbeef"),
                 (Project, "cad"),
                 (Port, "cad"),
                 (Network, "cad")]

        load_persistent_rg(NODES, [])

        # Set up the project attributes.
        node = Project.objects.all()[0]
        node.cloud_attributes = {"id": node.native_id}
        node.save()

        # Modify the candidate destination nodes' attributes so they
        # all have id keys.
        for target_type in [Image, Cloudpipe, Port, Network, Host]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"id": row.native_id}
                row.save()

        # Do the test.
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Project.objects.all()[0]
        self.assertEqual(len(node.edges), 4)

        # Test the types of edges created. There should be one edge to the
        # image node, one to the port node, and two to the network node.
        #
        # Image destination.
        dest = Image.objects.all()[0]
        edge = [x for x in node.edges if x[0] == dest.uuid]
        self.assertEqual(len(edge), 1)
        #
        # Port destination.
        dest = Port.objects.all()[0]
        edge = [x for x in node.edges if x[0] == dest.uuid]
        self.assertEqual(len(edge), 1)
        #
        # Network destinations.
        dest = [x.uuid for x in Network.objects.all()]
        edges = [x for x in node.edges if x[0] in dest]
        self.assertEqual(len(edges), 2)


class ProcessResourceType(Setup):
    """Test utilities.process_resource_type."""

    class EmptyClientObject(object):
        """A class that simulates one of glance client's return
        values."""

        images_list = []

        class Images(object):
            """This is used to construct the images class symbol."""

            def __init__(self, val):
                self.val = val

            def list(self):
                """Mock the list() method."""

                return self.val

        images = Images(images_list)

    def setUp(self):
        """Run before every test."""

        super(ProcessResourceType, self).setUp()

        for nodetype in NODE_TYPES:
            nodetype.objects.all().delete()

    @mock.patch('goldstone.core.models.get_glance_client')
    def test_empty_rg_empty_cloud(self, ggc):
        """Nothing in the resource graph, nothing in the cloud.

        Nothing should be done.

        """

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = self.EmptyClientObject()

        process_resource_type(Image)

        self.assertEqual(PolyResource.objects.count(), 0)

    @mock.patch('goldstone.core.models.get_glance_client')
    def test_rg_empty_cloud_image(self, ggc):
        """The resource graph contains only Image instances; nothing in the
        cloud.

        All of the resource graph nodes should be deleted.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.
        NODES = [(Image, "a"), (Image, "ab"), (Image, "abc")]

        # The initial resource graph edges. Each entry is ((from_type,
        # native_id), (to_type, native_id)).
        EDGES = [((Image, "a"), (Image, "ab")), ((Image, "abc"), (Image, "a"))]

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = self.EmptyClientObject()

        process_resource_type(Image)

        self.assertEqual(PolyResource.objects.count(), 0)

    @mock.patch('goldstone.core.models.get_glance_client')
    def test_rg_other_empty_cloud(self, ggc):
        """Something in the resource graph, some of which are non-Image
        instances; nothing in the cloud.

        Only the Image resource graph nodes should be deleted.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (Image, "abc"),
                 (Image, "0001"),
                 (Image, "0002"),
                 (ServerGroup, "0"),
                 (ServerGroup, "ab"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # native_id), (to_type, native_id)).  The native_id's must be unique
        # within a node type.
        EDGES = [((Image, "a"), (Image, "ab")),
                 ((Image, "0001"), (Image, "0002")),
                 ((Image, "a"), (ServerGroup, "0")),
                 ((Image, "ab"), (ServerGroup, "ab")),
                 ((Image, "abc"), (Image, "a")),
                 ((NovaLimits, "0"), (ServerGroup, "ab")),
                 ((NovaLimits, "0"), (Image, "a")),
                 ((ServerGroup, "0"), (Image, "0001")),
                 ((ServerGroup, "0"), (NovaLimits, "0")),
                 ]

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = self.EmptyClientObject()

        process_resource_type(Image)

        self.assertEqual(PolyResource.objects.count(), 3)


class ParseTests(SimpleTestCase):
    """Test the query string parser."""

    def test_one_variable(self):
        """Various forms of single-variable query strings that can be submitted
        to /core/resources/<uuid>/ or /core/resource_types/<unique_id>/."""

        # Each entry is (query_string, expected_result). The query string
        # format must be as that returned from calling urlparse.urlparse() --
        # e.g., the string is still URL-encoded.
        TESTS = [('', {}),
                 ("native_id=deadbeef", {"native_id": "deadbeef"}),
                 ("native_id=%5edeadbeef", {"native_id": "^deadbeef"}),
                 ("native_id=deadbeef%20biscuit",
                  {"native_id": 'deadbeef biscuit'}),
                 ("native_id=deadbeef%20OR%20bob",
                  {"native_id": "deadbeef|bob"}),
                 ("native_id=tom%20dick%20harry",
                  {"native_id": "tom dick harry"}),
                 ("native_id=tom%20OR%20dick%20OR%20harry",
                  {"native_id": "tom|dick|harry"}),
                 ("native_id=%5etom%20dick%20harry",
                  {"native_id": "^tom dick harry"}),
                 ("native_id=%5etom%20dick%20OR%20harry",
                  {"native_id": "^tom dick|^harry"}),
                 ("native_id=%5etom%20OR%20dick%20harry",
                  {"native_id": '^tom|^dick harry'}),
                 ("native_id=%5etom%20OR%20dick%20harry%20%20hmm",
                  {"native_id": '^tom|^dick harry  hmm'}),

                 # Now, with a leading '?'.
                 ("?native_id=deadbeef", {"native_id": "deadbeef"}),
                 ("?native_id=%5edeadbeef", {"native_id": "^deadbeef"}),
                 ("?native_id=deadbeef%20biscuit",
                  {"native_id": 'deadbeef biscuit'}),
                 ("?native_id=deadbeef%20OR%20bob",
                  {"native_id": "deadbeef|bob"}),
                 ("?native_id=tom%20dick%20harry",
                  {"native_id": "tom dick harry"}),
                 ("?native_id=tom%20OR%20dick%20OR%20harry",
                  {"native_id": "tom|dick|harry"}),
                 ("?native_id=%5etom%20dick%20harry",
                  {"native_id": "^tom dick harry"}),
                 ("?native_id=%5etom%20dick%20OR%20harry",
                  {"native_id": "^tom dick|^harry"}),
                 ("?native_id=%5etom%20OR%20dick%20harry",
                  {"native_id": '^tom|^dick harry'}),
                 ("?native_id=%5etom%20OR%20dick%20harry%20%20hmm",
                  {"native_id": '^tom|^dick harry  hmm'}),
                 ]

        for test, expected in TESTS:
            self.assertEqual(parse(test), expected)

    def test_multiple_variables(self):
        """Various forms of multi-variable query strings that can be submitted
        to /core/resources/<uuid>/ or /core/resource_types/<unique_id>/."""

        # Each entry is (query_string, expected_result). The query string
        # format must be as that returned from calling urlparse.urlparse() --
        # e.g., the string is still URL-encoded.
        TESTS = [("native_id=deadbeef&john=bob",
                  {"native_id": "deadbeef", "john": "bob"}),
                 ("native_id=%5edeadbeef&native_name=fred",
                  {"native_id": "^deadbeef", "native_name": "fred"}),
                 ("native_id=%5edeadbeef&"
                  "native_name=fred%20OR%20mary%20OR%20william",
                  {"native_id": "^deadbeef",
                   "native_name": "fred|mary|william"}),
                 ("native_id=deadbeef%20OR%20beefDEAD&integration=nova",
                  {"native_id": 'deadbeef|beefDEAD', "integration": "nova"}),
                 ("native_id=deadbeef%20biscuit&"
                  "integration=%5ekeystone%20OR%20glance&"
                  "native_name=b%20OR%20c",
                  {"native_id": 'deadbeef biscuit',
                   "integration": '^keystone|^glance',
                   "native_name": "b|c"}),
                 ("native_id=%5edeadbeef&integration=glance%20200",
                  {"native_id": '^deadbeef', "integration": 'glance 200'}),

                 # Now, with a leading '?'.
                 ("?native_id=deadbeef&john=bob",
                  {"native_id": "deadbeef", "john": "bob"}),
                 ("?native_id=%5edeadbeef&native_name=fred",
                  {"native_id": "^deadbeef", "native_name": "fred"}),
                 ("?native_id=%5edeadbeef&"
                  "native_name=fred%20OR%20mary%20OR%20william",
                  {"native_id": "^deadbeef",
                   "native_name": "fred|mary|william"}),
                 ("?native_id=deadbeef%20OR%20beefDEAD&integration=nova",
                  {"native_id": 'deadbeef|beefDEAD', "integration": "nova"}),
                 ("?native_id=deadbeef%20biscuit&"
                  "integration=%5ekeystone%20OR%20glance&"
                  "native_name=b%20OR%20c",
                  {"native_id": 'deadbeef biscuit',
                   "integration": '^keystone|^glance',
                   "native_name": "b|c"}),
                 ("?native_id=%5edeadbeef&integration=glance%20200",
                  {"native_id": '^deadbeef', "integration": 'glance 200'}),
                 ]

        for test, expected in TESTS:
            self.assertEqual(parse(test), expected)
