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

from elasticsearch_dsl import DocType
from goldstone.models import es_conn


class DailyIndexDocType(DocType):

    INDEX_DATE_FMT = 'YYYY.MM.DD'

    class Meta:
        using = es_conn()

    def save(self, using=None, index=None, **kwargs):
        if index is None:
            index = self._index_today()
        return super(DailyIndexDocType, self).\
            save(using=using, index=index, **kwargs)

    def _index_today(self):
        import arrow
        today = arrow.utcnow().format(self.INDEX_DATE_FMT)
        return self._doc_type.index.rstrip('*') + today
