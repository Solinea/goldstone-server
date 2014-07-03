# Copyright '2014' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from goldstone.models import RedisConnection
import re
import logging
import json

__author__ = 'stanford'

logger = logging.getLogger(__name__)


class HostAvailData(RedisConnection):

    white_prefix = '''host_stream.whitelist.'''
    black_prefix = '''host_stream.blacklist.'''

    def _get_datalist(self, prefix):
        kl = self.conn.keys(prefix + "*")
        # mget doesn't handle empty list well
        if len(kl) == 0:
            return {}

        vl = self.conn.mget(kl)
        f = lambda k, v: {re.sub(prefix, '', k): v}
        return map(f, kl, vl)

    def get_all(self):
        white_data = self._get_datalist(self.white_prefix)
        black_data = self._get_datalist(self.black_prefix)
        logger.debug("[get] white_data = %s", json.dumps(white_data))
        logger.debug("[get] black_data = %s", json.dumps(black_data))
        return {
            'whitelist': white_data,
            'blacklist': black_data
        }

    def set(self, host, datetime_string, status='white'):
        """
        set or update the state of a host entry
        :param host: host name string
        :param datetime_string: string
        :param status: white|black
        :return: key or None
        """

        if not self.conn.exists(self.black_prefix + host):
            key = self.white_prefix + host
            self.conn.set(key, datetime_string)
            logger.debug("set key %s to %s", key, datetime_string)
            return key
        else:
            return None
