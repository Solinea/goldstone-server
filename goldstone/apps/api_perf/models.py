"""Api_perf application models."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from arrow import Arrow


from elasticsearch_dsl import Search, DocType, String, Date, Integer
from types import StringType
import logging
from goldstone.models import daily_index, es_indices

logger = logging.getLogger(__name__)


class ApiPerfData(DocType):
    """API performance record model.

    response_status: int
    creation_time: date
    component: string
    uri: string
    response_length: int
    response_time int

    """

    # Field declarations.  They types are generated, so imports look broken
    # but hopefully are working...
    response_status = Integer()
    creation_time = Date()
    component = String()
    uri = String()
    response_length = Integer()
    response_time = Integer()

    _INDEX_PREFIX = 'goldstone-'

    class Meta:
        doc_type = 'api_stats'


    @classmethod
    def _stats_search(cls, start, end, interval, component,
                      uri=None, prefix=False):
        """
        Sets up a query that does aggregations on the response_time field min,
        max, avg for the bucket.

        :type start: Arrow
        :param start:
        :type end: Arrow
        :param end:
        :type interval: str
        :param interval: number + unit (ex: 5s, 5m)
        :type component: str
        :param component:
        """

        search = cls.search().\
            filter('range', ** {'creation_time': {
                'lte': end.isoformat(),
                'gte': start.isoformat()}})

        if component is not None:
            search = search.filter('term', component=component)

        if uri is not None and prefix:
            search = search.filter('prefix', uri=uri)

        if uri is not None and not prefix:
            search = search.filter('term', uri=uri)

        search.aggs.bucket('events_by_date',
                           'date_histogram',
                           field='creation_time',
                           interval=interval,
                           min_doc_count=0).\
            metric('stats', 'extended_stats', field='response_time').\
            bucket('range', 'range', field='response_status', keyed=True,
                   ranges=[
                        {"from": 200, "to": 299},
                        {"from": 300, "to": 399},
                        {"from": 400, "to": 499},
                        {"from": 500, "to": 599}
                    ])

        logger.info("search = %s", json.dumps(search.to_dict()))
        return search

    # TODO implement get_components

    @classmethod
    def get_stats(cls, start, end, interval, component=None, uri=None):
        """Return a pandas object that contains API performance data.

        :type start: Arrow
        :param start: datetime used to filter the query range
        :type end: Arrow
        :param end: datetime used to filter the query range
        :type interval: str
        :param interval: string representation of the time interval to use when
                       aggregating the results.  Form should be something like
                       '1.5s'.  Supported time postfixes are s, m, h, d, w, m.
        :type component: str or None
        :param component: string, name of the api component
        :rtype: pd.DataFrame
        """

        assert type(start) is Arrow, "start is not an Arrow object"
        assert type(end) is Arrow, "end is not an Arrow object"
        assert type(interval) in [StringType, unicode], \
            "interval is not a string: %r" % type(interval)
        assert interval[-1] in ['s', 'm', 'h', 'd'], \
            "valid units for interval are ['s', 'm', 'h', 'd']: %r" \
            % interval

        search = cls._stats_search(start, end, interval, component, uri)

        result = search.execute()
        logger.info('[get] search result = %s', json.dumps(result.to_dict()))

        items = []

        for date_bucket in \
                result.aggregations['events_by_date']['buckets']:
            logger.debug("[get] processing date_bucket: %s",
                         json.dumps(date_bucket))

            item = {'key': date_bucket['key']}

            item = dict(item.items() + date_bucket['stats'].items())
            item['2xx'] = \
                date_bucket['range']['buckets']['200.0-299.0']['doc_count']
            item['3xx'] = \
                date_bucket['range']['buckets']['300.0-399.0']['doc_count']
            item['4xx'] = \
                date_bucket['range']['buckets']['400.0-499.0']['doc_count']
            item['5xx'] = \
                date_bucket['range']['buckets']['500.0-599.0']['doc_count']

            items.append(item)

        return items

    def save(self, using=None, index=None, **kwargs):
        """Posts an ApiPerf record to the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = daily_index(self._INDEX_PREFIX)

        return super(ApiPerfData, self).save(using,
                                             index,
                                             **kwargs)

    @classmethod
    def get(cls, id, using=None, index=None, **kwargs):
        """Gets an ApiPerf record to the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = es_indices(cls._INDEX_PREFIX)

        return super(ApiPerfData, cls).get(id,
                                           using=using,
                                           index=index,
                                           **kwargs)

    @classmethod
    def search(cls):
        """Gets an ApiPerf search object that can be used to .

        See elasticsearch-dsl for parameter information.
        """

        return Search(
            using=cls._doc_type.using,
            index=es_indices(cls._INDEX_PREFIX),
            doc_type={cls._doc_type.name: cls.from_es},
        )

    def delete(self, using=None, index=None, **kwargs):
        """Deletes an ApiPerf record from the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = es_indices(self._INDEX_PREFIX)

        return super(ApiPerfData, self).delete(using=using,
                                               index=index,
                                               **kwargs)
