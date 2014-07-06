# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
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
from datetime import datetime
import pytz
from django.db import models

__author__ = 'stanford'

logger = logging.getLogger(__name__)


# TODO would like a better parent class
class LoggingNode(RedisConnection):
    id_prefix = None

    def __init__(self, name,
                 datetime_str=datetime.now(tz=pytz.utc).isoformat()):
        super(LoggingNode, self).__init__()
        self.name = name
        self.timestamp = None
        self.save(datetime_str)
        self._deleted = False

    def __repr__(self):
        if self._deleted:
            return json.dumps({"name": self.name, "deleted": True})
        else:
            return json.dumps({"name": self.name,
                               "timestamp": self.timestamp})

    @classmethod
    def _all(cls, k, v):
        raise RuntimeError("Must implement in subclass")

    def save(self, datetime_str):
        """
        update the persisted state of the entry
        :param datetime_str: string
        :return: True
        """
        self.conn.set(self.id_prefix + self.name, datetime_str)
        self.timestamp = datetime_str
        self._deleted = False
        return True

    # TODO would like a cleaner way to remove the object, not just the record
    def delete(self):
        """
        delete a host record from persistence
        :return: None
        """
        self.conn.delete(self.id_prefix + self.name)
        self._deleted = True
        self.timestamp = None

    @classmethod
    def all(cls):
        """
        return all records
        :return:
        """
        rc = RedisConnection()
        kl = []
        try:
            kl = rc.conn.keys(cls.id_prefix + "*")
        except TypeError:
            raise Exception("id_prefix is not a string")

        # mget doesn't handle empty list well
        if len(kl) == 0:
            return []

        vl = rc.conn.mget(kl)
        return map(cls._all, kl, vl)


class WhiteListNode(LoggingNode):
    id_prefix = '''host_stream.whitelist.'''

    @classmethod
    def _all(cls, k, v):
        return WhiteListNode(re.sub(cls.id_prefix, '', k), v)

    @classmethod
    def get(cls, host):
        """
        get a node by name
        :return:
        """
        r = RedisConnection()
        result = r.conn.get(cls.id_prefix + host)
        if result is None:
            return result
        else:
            return WhiteListNode(host, result)

    def to_blacklist(self):
        """
        move a host from the whitelist to the blacklist
        :return: BlackListNode
        """
        key = self.id_prefix + self.name
        val = self.conn.get(key)
        if val is not None:
            new_node = BlackListNode(self.name, val)
            self.delete()
            return new_node
        else:
            raise Exception("not found in DB")


class BlackListNode(LoggingNode):
    id_prefix = '''host_stream.blacklist.'''

    @classmethod
    def _all(cls, k, v):
        return BlackListNode(re.sub(cls.id_prefix, '', k), v)

    @classmethod
    def get(cls, host):
        """
        get a node by name
        :return:
        """
        r = RedisConnection()
        result = r.conn.get(cls.id_prefix + host)
        if result is None:
            return result
        else:
            return BlackListNode(host, result)

    def to_whitelist(self):
        """
        move this host from the blacklist to the whitelist
        :return: WhiteListNode
        """
        key = self.id_prefix + self.name
        val = self.conn.get(key)
        if val is not None:
            new_node = WhiteListNode(self.name, val)
            self.delete()
            return new_node
        else:
            raise Exception("not found in DB")


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
