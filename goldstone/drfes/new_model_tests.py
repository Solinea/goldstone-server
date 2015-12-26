from elasticsearch_dsl.result import Response
from elasticsearch_dsl import String, Date, Nested
from rest_framework.test import APITestCase
from goldstone.drfes.new_models import DailyIndexDocType
import uuid
from pycadf import event, cadftype, cadftaxonomy


class DailyIndexDocTypeTests(APITestCase):

    class CADFEvent(DailyIndexDocType):

        INDEX_DATE_FMT = 'YYYY-MM-DD'

        traits=Nested(
            properties={
                'action': String(),
                'eventTime': Date(),
                'eventType': String(),
                'id': String(),
                'initiatorId': String(),
                'name': String(),
                'observerId': String(),
                'outcome': String(),
                'targetId': String(),
                'typeURI': String(),
            }
        )

        class Meta:
            doc_type = 'cadf_event'
            index = 'events_*'

        def __init__(self, event=None, meta=None, **kwargs):
            if event is not None:
                kwargs = dict(
                    kwargs.items() + self._get_traits_dict(event).items())

            super(DailyIndexDocTypeTests.CADFEvent, self) \
                .__init__(meta, **kwargs)

        @staticmethod
        def _get_traits_dict(e):
            """
            convert a pycadf.event to an ES doc
            :param e:
            :return: dict
            """
            return {"traits": e.as_dict()}

    class LogMessage(DailyIndexDocType):

        message = String()
        timestamp = Date()

        class Meta:
            doc_type = 'syslog'
            index = 'logstash-*'

    def test_search_wildcard_index(self):
        s = self.LogMessage.search()
        result = s.execute()
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
        created = arrow.utcnow().isoformat()

        # instantiate and persist the LogMessage
        lm = self.LogMessage(message=message, created=created)
        result = lm.save()
        self.assertEqual(result, True)

        # force flush the index so our test has a chance to succeed.
        lm._doc_type.using.indices.flush(lm.meta.index)

        # Sadly, the get method does not accept a wildcard index, so you will
        # need to either know which index the document is in, or use the search
        # method to get it back.  When you save an instance, the meta attrs
        # id and index are set, so if it's important information, you may
        # want to persist it in postgres.
        glm = self.LogMessage.get(id=lm.meta.id, index=lm.meta.index)
        self.assertEqual(lm.message, glm.message)
        self.assertEqual(lm.created, glm.created)
        self.assertIsInstance(glm, self.LogMessage)

        # so let's try to find it via search.
        s = self.LogMessage.search()
        slm = s.filter('term', message=message) \
            .filter('term', created=created) \
            .execute()[0]
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

        cadf = self.CADFEvent(event=e)

        result = cadf.save()
        self.assertTrue(result)

        # force flush the index so our test has a chance to succeed.
        cadf._doc_type.using.indices.flush(cadf.meta.index)

        ge = self.CADFEvent.get(id=cadf.meta.id, index=cadf.meta.index)
        self.assertEqual(cadf.traits['initiatorId'], ge.traits['initiatorId'])
        self.assertEqual(cadf.traits['eventTime'], ge.traits['eventTime'])
        self.assertIsInstance(ge, self.CADFEvent)

        s = self.CADFEvent.search()
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
        s2 = self.CADFEvent.search()
        # Alternate form of filter/query expression since we have a nested
        # field.
        r2 = s2.filter('term', ** {'traits.initiatorId': initiator_id})\
            .execute()
        self.assertEqual(len(r2.hits), 0)
