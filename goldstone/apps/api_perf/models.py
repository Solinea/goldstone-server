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
from elasticsearch_dsl import String, Date, Integer, A
from goldstone.apps.drfes.models import DailyIndexDocType


class ApiPerfData(DailyIndexDocType):
    """API performance record model.

    response_status: int
    creation_time: date
    component: string
    uri: string
    response_length: int
    response_time int

    """

    # Field declarations.  The types are generated dynamically, so PyCharm
    # thinks the imports are unresolved references.
    response_status = Integer()
    creation_time = Date()
    component = String()
    uri = String()
    response_length = Integer()
    response_time = Integer()

    INDEX_PREFIX = 'goldstone-'
    SORT = '-@timestamp'

    class Meta:
        doc_type = 'api_stats'

    @classmethod
    def stats_agg(cls):
        return A('extended_stats', field='response_time')

    @classmethod
    def range_agg(cls):
        return A('range', field='response_status', keyed=True,
                 ranges=[
                     {"from": 200, "to": 299},
                     {"from": 300, "to": 399},
                     {"from": 400, "to": 499},
                     {"from": 500, "to": 599}])
