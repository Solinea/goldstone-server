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
