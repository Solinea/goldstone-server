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
            return []

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

    def set(self, host, datetime_string, list_color='white'):
        """
        set or update the state of a host entry
        :param host: host name string
        :param datetime_string: string
        :param list_color white|black
        :return: key or None
        """

        if list_color == 'white':
            if not self.conn.exists(self.black_prefix + host):
                key = self.white_prefix + host
                self.conn.set(key, datetime_string)
                logger.debug("set key %s to %s", key, datetime_string)
                return key
            else:
                return None
        else:
            if not self.conn.exists(self.white_prefix + host):
                key = self.black_prefix + host
                self.conn.set(key, datetime_string)
                logger.debug("set key %s to %s", key, datetime_string)
                return key
            else:
                return None

    def delete(self, host, list_color='both'):
        """
        delete a host from one or both of the white/black lists
        :param host: host name string
        :param white|black|both
        :return: None
        """
        if list_color == 'white' or list_color == 'both':
            self.conn.delete(self.white_prefix + host)
        if list_color == 'black' or list_color == 'both':
            self.conn.delete(self.black_prefix + host)

    def to_blacklist(self, host):
        """
        move a host from the whitelist to the blacklist
        :param host: host name string
        :return: key or None
        """
        white_key = self.white_prefix + host
        white_val = self.conn.get(white_key)
        if white_val is not None:
            self.delete(host, list_color='white')
            return self.set(host, white_val, 'black')
        else:
            black_key = self.black_prefix + host
            black_val = self.conn.get(black_key)
            if black_val is not None:
               return black_key
            else:
                return None

    def to_whitelist(self, host):
        """
        move a host from the blacklist to the whitelist
        :param host: host name string
        :return: key or None
        """
        black_key = self.black_prefix + host
        black_val = self.conn.get(black_key)
        if black_val is not None:
            self.delete(host, list_color='black')
            return self.set(host, black_val, 'white')
        else:
            white_key = self.white_prefix + host
            white_val = self.conn.get(white_key)
            if white_val is not None:
               return white_key
            else:
                return None
