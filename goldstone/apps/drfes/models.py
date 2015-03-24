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
    def simple_agg(cls, field, agg_name, base_queryset, size=0,
                   min_doc_count=1):
        """ Returns an aggregations by date histogram and maybe log level.

        :type field: str
        :param field: The field to aggregate
        :type base_queryset: Search
        :param base_queryset: The queryset on which to attach this aggregation
        :rtype: object
        :return: the (possibly nested) aggregation
        """

        # we are not interested in the actual docs, so use the count search
        # type.
        search = base_queryset.params(search_type="count")

        # add a top-level aggregation for the field
        search.aggs.bucket(agg_name, "terms",
                           field=field,
                           min_doc_count=min_doc_count,
                           size=size)

        response = search.execute().aggregations
        return response

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
