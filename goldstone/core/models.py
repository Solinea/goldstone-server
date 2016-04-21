"""Core models."""
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

import logging
import arrow
import uuid
from django.utils import timezone
from jinja2 import Template

from django.db import models
from django.db.models import CharField, ForeignKey, DecimalField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from elasticsearch_dsl import String, Date, Integer, Nested, Search


from polymorphic import PolymorphicModel
from goldstone.drfes.new_models import DailyIndexDocType
from django.core.mail import send_mail

from goldstone.models import es_indices

from goldstone.user.models import User
from goldstone.utils import now_micro_ts


logger = logging.getLogger(__name__)


class SavedSearch(models.Model):
    """Defined searches, both system and user-created.  The target_interval
     field can be used by the task subsystem to determine if a search should
     be executed."""

    # uuid = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uuid = UUIDField(version=4, auto=True, primary_key=True)

    name = models.CharField(max_length=64)

    owner = models.CharField(max_length=64)

    description = models.CharField(max_length=1024, blank=True, null=True)

    query = models.TextField(help_text='JSON Elasticsearch query body')

    protected = models.BooleanField(default=False,
                                    help_text='True if this is system-defined')

    hidden = models.BooleanField(blank=True, default=False,
                                 help_text='True if this search should not be '
                                           'presented via the view')

    viewer_enabled = models.BooleanField(blank=True, default=True,
                                         help_text='True if this search should be '
                                                   'displayed in the client UI')

    index_prefix = models.CharField(max_length=64)

    doc_type = models.CharField(max_length=64, blank=True, null=True,
                                default=None)

    timestamp_field = models.CharField(max_length=64, null=True)

    # last_start and last_end are maintained via the
    # update_recent_search_window method.  they can be used to make a series
    # of calls that cover a contiguous time window (such as for dumping
    # data or checking for alerts periodically).
    # target_interval can be used to trigger a recurring search based on an ES
    # interval specification such as 5m or 1d.  A celery task that processes
    # SavedSearches can choose to trigger only if now - interval >= last_end.
    # BEWARE of multiple tasks using these values since they might step on
    # each other.  In the long run, these should be refactored into something
    # a little more protected from side effects by other tasks.  Possibly a
    # SearchSchedule type with a FK relationship to the search.
    last_start = models.DateTimeField(default=timezone.now)
    last_end = models.DateTimeField(default=timezone.now)
    target_interval = models.IntegerField(default=0)

    created = CreationDateTimeField(editable=False, blank=True, null=True)

    updated = ModificationDateTimeField(editable=True, blank=True, null=True)

    class Meta:               # pylint: disable=C0111,W0232,C1001
        unique_together = ('name', 'owner')
        verbose_name_plural = "saved searches"

    def search(self):
        """Returns an unbounded search object based on the saved query. Call
        the execute method when ready to retrieve the results."""
        import json

        s = Search.from_dict(json.loads(self.query))\
            .using(DailyIndexDocType._doc_type.using)\
            .index(self.index_prefix)

        if self.doc_type is not None:
            s = s.doc_type(self.doc_type)

        return s

    def search_recent(self):
        """Returns a search object that ranged to [last_end, now), and the start
        and end times as strings (suitable for updating the SavedSearch record.
        The caller is responsible for updating the last_start and last_end
        fields in the SavedSearch.
        """
        import arrow

        if self.timestamp_field is None:
            return self.search()

        start = self.last_end.replace(microsecond=0)

        end = arrow.utcnow().datetime.replace(microsecond=0)

        s = self.search()\
            .query('range',
                   ** {self.timestamp_field: {'gte': start.isoformat(),
                                              'lt': end.isoformat()}})
        return s, start, end

    def update_recent_search_window(self, start, end):
        """trigger an update of the last_start and last_end fields and persist
        the changes.  Due to a bug in logstash, we're going to round these
        times down to the nearest second.  """

        self.last_start = start.replace(microsecond=0)
        self.last_end = end.replace(microsecond=0)
        self.save()
        return self.last_start, self.last_end

    def field_has_raw(self, field):
        """Return boolean indicating whether the field has a .raw version."""

        conn = DailyIndexDocType._doc_type.using
        index = es_indices(self.index_prefix)

        try:
            mapping = conn.indices.get_field_mapping(
                field,
                index,
                self.doc_type,
                include_defaults=True,
                allow_no_indices=False)
            return 'raw' in \
                   mapping[mapping.keys()[-1]]['mappings'][self.doc_type][
                       field]['mapping'][field]['fields']
        except KeyError:
            return False

    def __repr__(self):
        return "<SavedSearch: %s>" % self.uuid

    def __unicode__(self):
        return "<SavedSearch: %s>" % self.uuid


class AlertDefinition(models.Model):
    """The definition of alert conditions based on a SavedSearch."""

    # uuid = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uuid = UUIDField(version=4, auto=True, primary_key=True)

    name = models.CharField(max_length=64)

    description = models.CharField(max_length=1024, blank=True, null=True)

    short_template = models.TextField(
        default='Alert: \'{{_alert_def_name}}\' triggered at {{_end_time}}')

    long_template = models.TextField(
        default='There were {{_search_hits}} instances of '
                '\'{{_alert_def_name}}\' from {{_start_time}} to '
                '{{_end_time}}.\nAlert Definition: {{_alert_def_id}}')

    enabled = models.BooleanField(default=True)

    created = CreationDateTimeField(editable=False, blank=True, null=True)

    updated = ModificationDateTimeField(editable=True, blank=True, null=True)

    search = ForeignKey(SavedSearch, editable=False)

    class Meta:
        ordering = ['-created']

    def evaluate(self, search_result, start_time, end_time):
        """Determine if we need to trigger an alert"""

        kv_pairs = {
            '_alert_def_name': self.name,
            '_search_hits': search_result['hits']['total'],
            '_start_time': start_time,
            '_end_time': end_time,
            '_alert_def_id': self.uuid
        }

        if kv_pairs['_search_hits'] > 0:
            logger.debug("%s alert %s to %s" %
                         (kv_pairs['_alert_def_name'], start_time, end_time))
            short = Template(self.short_template).render(kv_pairs)
            long = Template(self.long_template).render(kv_pairs)
            # create an alert and call all our producers with it
            alert = Alert(short_message=short, long_message=long,
                          alert_def=self)
            alert.save()
            self.search.update_recent_search_window(start_time, end_time)
            # send the alert to all registered producers
            for producer in Producer.objects.filter(alert_def=self):
                try:
                    producer.produce(alert)
                except Exception as e:
                    logger.exception(
                        "failed to send alert to %s" % producer.receiver)
                    continue
        else:
            self.search.update_recent_search_window(start_time, end_time)

    def __repr__(self):
        return "<AlertDefiniton: %s>" % self.uuid

    def __unicode__(self):
        return "<AlertDefiniton: %s>" % self.uuid


class Alert(models.Model):
    """An alert derived from an AlertDefinition."""

    # uuid = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uuid = UUIDField(version=4, auto=True, primary_key=True)

    short_message = models.TextField()

    long_message = models.TextField()

    alert_def = ForeignKey(AlertDefinition, editable=False,
                           on_delete=models.PROTECT)

    created = CreationDateTimeField(editable=False, blank=True, null=True)

    created_ts = DecimalField(max_digits=13, decimal_places=0,
                              editable=False, default=now_micro_ts)

    updated = ModificationDateTimeField(editable=True, blank=True, null=True)

    class Meta:
        ordering = ['-created']

    def __repr__(self):
        return "<Alert: %s>" % self.uuid

    def __unicode__(self):
        return "<Alert: %s>" % self.uuid


class Producer(PolymorphicModel):
    """
        Generic interface class for an alert producer. This contains generic
        producer related information such as sender, receiver names, id's,
        host, auth-params etc

        Specific types like email, slack, HTTP-POST etc inherit from this
        class with specific connection attributes
    """

    # uuid = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uuid = UUIDField(version=4, auto=True, primary_key=True)

    alert_def = models.ForeignKey(AlertDefinition)

    created = CreationDateTimeField(editable=False, blank=True, null=True)

    updated = ModificationDateTimeField(editable=True, blank=True, null=True)

    # This doesn't allow Producer.objects.all() calls.  Beware ye who
    # navigate these waters.
    # class Meta:
    #    abstract = True

    class Meta:
        ordering = ['-created']

    @classmethod
    def produce(self, alert):
        raise NotImplementedError("Producer subclass must implement send.")

    def __repr__(self):
        return "<Producer: %s>" % self.uuid

    def __unicode__(self):
        return "<Producer: %s>" % self.uuid


class EmailProducer(Producer):
    """
        Specific interface class to prepare and send an email.
        Class gets all of its email contents from the parent producer class.
        This class only contains methods specific to a mailing interface.
    """

    sender = models.EmailField(max_length=128, default="root@localhost")

    receiver = models.EmailField(max_length=128, blank=False, null=False)

    def produce(self, alert):

        email_rv = send_mail(alert.short_message, alert.long_message,
                             self.sender, [self.receiver],
                             fail_silently=False)
        return email_rv

    def __repr__(self):
        return "<EmailProducer: %s>" % self.uuid

    def __unicode__(self):
        return "<EmailProducer: %s>" % self.uuid


class CADFEventDocType(DailyIndexDocType):
    """ES representation of a PyCADF event. Attempting to write traits that are
    not present in the Nested definition will result in an exception, though
    reading events from ES that have additional traits should succeed. Subclass
    this class to define custom traits for your own event types.
    """

    INDEX_DATE_FMT = 'YYYY-MM-DD'

    timestamp = Date()

    traits = Nested(
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
        doc_type = 'goldstone_event'
        index = 'events_*'

    def __init__(self, timestamp=None, event=None, **kwargs):
        if event is not None:
            kwargs = dict(
                kwargs.items() + self._get_traits_dict(event).items())

        if timestamp is None:
            kwargs['timestamp'] = arrow.utcnow().datetime

        super(CADFEventDocType, self).__init__(**kwargs)

    @staticmethod
    def _get_traits_dict(e):
        """
        convert a pycadf.event to an ES doc
        :param e:
        :return: dict
        """
        return {"traits": e.as_dict()}


class MonitoredService(models.Model):
    """Model of a service that can be monitored.  The actual monitoring is done
    somewhere else..."""

    UP = 'UP'
    DOWN = 'DOWN'
    UNKNOWN = 'UNKNOWN'
    MAINTENANCE = 'MAINTENANCE'
    STATE_CHOICES = (
        (UP, UP),
        (DOWN, DOWN),
        (UNKNOWN, UNKNOWN),
        (MAINTENANCE, MAINTENANCE),
    )

    # uuid = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uuid = UUIDField(version=4, auto=True, primary_key=True)

    name = CharField(max_length=128, null=False, blank=False, editable=False)

    host = CharField(max_length=128, null=False, blank=False, editable=False)

    state = CharField(max_length=64, choices=STATE_CHOICES,
                      default=UNKNOWN, null=False,
                      blank=False)

    created = CreationDateTimeField(editable=False, blank=False, null=False)

    updated = ModificationDateTimeField(editable=True, blank=False, null=False)

    class Meta:
        ordering = ['-updated']

    def __repr__(self):
        return "<MonitoredService: %s>" % self.uuid

    def __unicode__(self):
        return "<MonitoredService: %s>" % self.uuid
