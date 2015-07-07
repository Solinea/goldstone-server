"""DRFES models."""
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

from elasticsearch_dsl import DocType, Search
from goldstone.models import es_conn, es_indices, daily_index


class DailyIndexDocType(DocType):
    """A model that searches a set of daily indices."""

    INDEX_PREFIX = 'logstash-'
    SORT = '-@timestamp'

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        doc_type = 'syslog'

    @classmethod
    def search(cls):
        """Gets a generic Log search object.

        See elasticsearch-dsl for parameter information.
        """

        return Search(
            index=es_indices(cls.INDEX_PREFIX),
            doc_type={cls._doc_type.name: cls.from_es},
        ).sort(cls.SORT).using(es_conn())

    def save(self, using=None, index=None, **kwargs):
        """Posts a record to the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = daily_index(self.INDEX_PREFIX)

        return super(DailyIndexDocType, self).save(using, index, **kwargs)

    @classmethod
    def get(cls, id, using=None, index=None, **kwargs):
        """Gets a record from the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = es_indices(cls.INDEX_PREFIX)

        return super(DailyIndexDocType, cls).get(id, using, index, **kwargs)

    def delete(self, using=None, index=None, **kwargs):
        """Deletes a record from the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = es_indices(self.INDEX_PREFIX)

        return super(DailyIndexDocType, self).delete(using, index, **kwargs)

    @classmethod
    def bounded_search(cls, start=None, end=None, key_field='@timestamp'):
        """ Returns a search with time range."""
        import arrow
        from arrow import Arrow

        start = arrow.get(0) if start == '' else start
        end = arrow.utcnow() if end == '' else end

        if end is not None:
            assert isinstance(end, Arrow), "end is not an Arrow object"

        if start is not None:
            assert isinstance(start, Arrow), "start is not an Arrow object"

        search = cls.search()

        if start is not None and end is not None:
            search = search.query(
                'range',
                ** {key_field:
                    {'lte': end.isoformat(),
                     'gte': start.isoformat()}})

        elif start is not None and end is None:
            search = search.query(
                'range',
                ** {key_field: {'gte': start.isoformat()}})

        elif start is None and end is not None:
            search = search.query(
                'range',
                ** {key_field: {'lte': end.isoformat()}})

        return search

    @classmethod
    def simple_datehistogram_agg(cls, base_queryset, interval,
                                 field='@timestamp',
                                 agg_name='per_interval',
                                 min_doc_count=1,
                                 bounds_min=None, bounds_max=None):
        """Returns a date histogram aggregation.

        :param base_queryset: The queryset on which to attach this aggregation
        :type base_queryset: Search
        :param interval: The time interval to use for agg bucket size
        :type interval: str
        :param field: The field to aggregate
        :type field: str
        :param agg_name: the name to give the aggregation
        :type agg_name: str
        :param size: passed to ES
        :type size: int
        :param min_doc_count: passed to ES
        :type min_doc_count: int
        :return: the (possibly nested) aggregation
        :rtype: object

        """

        # aggregations mutate the search, so let's be nice to our caller
        # and work on a clone.
        search = base_queryset._clone()          # pylint: disable=W0212

        # we are not interested in the actual docs, so use the count search
        # type.
        search = search.params(search_type="count")

        # add a top-level aggregation for the field
        search.aggs.bucket(agg_name, cls._datehist_agg(interval, bounds_min,
                                                       bounds_max,
                                                       min_doc_count, field))

        return search

    @staticmethod
    def _datehist_agg(interval, bounds_min=None, bounds_max=None,
                      min_doc_count=0, field='@timestamp'):
        """Return a date histogram aggregation that can be applied to an
        existing search object."""
        from arrow import Arrow
        from elasticsearch_dsl import A

        assert isinstance(interval, basestring), 'interval must be a string'

        # if start/end were provided, let's put them in the extended bounds
        # and set min_doc_count to 0
        extended_bounds = {}
        if bounds_min is not None:
            if isinstance(bounds_min, Arrow):
                extended_bounds['min'] = bounds_min.isoformat()
            else:
                extended_bounds['min'] = bounds_min

        if bounds_max is not None:
            if isinstance(bounds_max, Arrow):
                extended_bounds['max'] = bounds_max.isoformat()
            else:
                extended_bounds['max'] = bounds_max
        if 'max' in extended_bounds or 'min' in extended_bounds:
            min_doc_count = 0

        return A("date_histogram", field=field,
                 interval=interval, min_doc_count=min_doc_count,
                 extended_bounds=extended_bounds)

    @classmethod
    def get_field_mapping(cls, field):
        """Return a field mapping."""

        conn = es_conn()
        index = es_indices(cls.INDEX_PREFIX)

        return conn.indices.get_field_mapping(field,
                                              index,
                                              cls._doc_type.name,
                                              include_defaults=True,
                                              allow_no_indices=False)

    @classmethod
    def field_has_raw(cls, field):
        """Return True if the Elasticsearch mapping for a field has a 'raw'
        representation.

        :param field: the field name in ES
        :return: bool

        """

        try:
            mapping = cls.get_field_mapping(field)
            return 'raw' in \
                   mapping[mapping.keys()[-1]]['mappings'][cls._doc_type.name][
                       field]['mapping'][field]['fields']
        except KeyError:
            return False
