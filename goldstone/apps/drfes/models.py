# Copyright '2015' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from elasticsearch_dsl import DocType, Search
from goldstone.models import most_recent_index, es_conn, es_indices


class DailyIndexDocType(DocType):
    """A model that searches a set of daily indices (intended to be
    read-only)."""

    INDEX_PREFIX = 'logstash-'
    SORT = '-@timestamp'

    class Meta:
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
                            agg_name='per_interval', size=0,
                            min_doc_count=1):
        """ Returns a date histogram aggregations.

        :type base_queryset: Search
        :param base_queryset: The queryset on which to attach this aggregation
        :type interval: str
        :param interval: The time interval to use for agg bucket size
        :type field: str
        :param field: The field to aggregate
        :type agg_name: str
        :param agg_name: the name to give the aggregration
        :type size: int
        :param size: passed to ES
        :type min_doc_count: int
        :param min_doc_count: passed to ES
        :rtype: object
        :return: the (possibly nested) aggregation
        """

        # aggregations mutate the search, so let's be nice to our caller
        # and work on a clone.
        search = base_queryset._clone()

        # we are not interested in the actual docs, so use the count search
        # type.
        search = search.params(search_type="count")

        # add a top-level aggregation for the field
        search.aggs.bucket(agg_name, "date_histogram",
                           field=field,
                           interval=interval,
                           min_doc_count=min_doc_count,
                           size=size)

        return search

    @classmethod
    def get_field_mapping(cls, field):

        conn = es_conn()
        index = most_recent_index(cls.INDEX_PREFIX)
        return conn.indices.get_field_mapping(
            field, index, cls._doc_type.name,
            include_defaults=True, allow_no_indices=False)

    @classmethod
    def field_has_raw(cls, field):
        """Looks up the ES mapping for a field and determines if it has a 'raw'
        representation.

        :param field: the field name in ES
        :return: Boolean
        """

        try:
            index = most_recent_index(cls.INDEX_PREFIX)
            mapping = cls.get_field_mapping(field)
            return 'raw' in \
                   mapping[index]['mappings'][cls._doc_type.name][field][
                       'mapping'][field]['fields']
        except KeyError:
            return False
