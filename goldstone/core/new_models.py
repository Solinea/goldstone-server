from django.db.models import DateTimeField
from goldstone.drfes.new_models import DailyIndexDocType
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

from django.db import models
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField

from elasticsearch_dsl import Search, Nested, String, Date


class SavedSearch(models.Model):
    """Defined searches, both system and user-created.  The target_interval
     field can be used by the task subsystem to determine if a search should
     be executed."""

    uuid = UUIDField(version=4, auto=True, primary_key=True)
    name = models.CharField(max_length=64)
    owner = models.CharField(max_length=64)
    description = models.CharField(max_length=1024, default='Defined Search')
    query = models.TextField(help_text='JSON Elasticsearch query body')
    protected = models.BooleanField(default=False,
                                    help_text='True if this is system-defined')
    index_prefix = models.CharField(max_length=64)
    doc_type = models.CharField(max_length=64)
    timestamp_field = models.CharField(max_length=64, null=True)
    last_start = models.DateTimeField(blank=True, null=True)
    last_end = models.DateTimeField(blank=True, null=True)
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
        s = Search.from_dict(json.loads(self.query))
        s.using(DailyIndexDocType._doc_type.using)
        s.index(self.index_prefix)
        s.doc_type(self.doc_type)
        return s

    def search_recent(self):
        """Returns a search object that ranged to [last_end, now), and the start
        and end times as strings (suitable for updating the SavedSearch record.
        The caller is responsible for updating the last_start and last_end
        fields in the SavedSearch.
        """
        import arrow

        s = self.search()

        if self.timestamp_field is None:
            return s

        if self.last_end is None:
            start = arrow.get(0).datetime
        else:
            start = self.last_end

        end = arrow.utcnow().datetime

        s = self.search()
        s = s.query('range',
                    ** {self.timestamp_field:
                        {'gt': start.isoformat(),
                            'lte': end.isoformat()}})
        return s, start, end


class PyCadfEventMarshal(DailyIndexDocType):
    """ES representation of a PyCADF event. Attempting to write traits that are
    not present in the Nested definition will result in an exception, though
    reading events from ES that have additional traits should succeed. Subclass
    this class to define custom traits for your own event types.
    """

    INDEX_DATE_FMT = 'YYYY-MM-DD'

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
        doc_type = 'cadf_event'
        index = 'events_*'

    def __init__(self, event=None, meta=None, **kwargs):
        if event is not None:
            kwargs = dict(
                kwargs.items() + self._get_traits_dict(event).items())

        super(PyCadfEventMarshal, self).__init__(meta, **kwargs)

    @staticmethod
    def _get_traits_dict(e):
        """
        convert a pycadf.event to an ES doc
        :param e:
        :return: dict
        """
        return {"traits": e.as_dict()}
