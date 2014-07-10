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
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
__author__ = 'stanford'

logger = logging.getLogger(__name__)


class LN(models.Model):
    uuid = UUIDField(unique=True)
    name = models.CharField(
        max_length=100, unique=True)

    created = CreationDateTimeField()

    updated = ModificationDateTimeField()

    method = models.CharField(
        max_length=20,
        default='ping',
        validators=[lambda m: m.lower == 'ping' or m.lower == 'log_stream'])

    disabled = models.BooleanField(
        default=False)

    def __unicode__(self):
        return json.dumps({"name": self.name,
                           "created": self.created.isoformat(),
                           "updated": self.updated.isoformat(),
                           "method": self.method,
                           "disabled": self.disabled})


class LoggingNode(RedisConnection):
    id_prefix = '''host_stream.nodes.'''

    def __init__(self,
                 name,
                 timestamp=datetime.now(tz=pytz.utc).isoformat(),
                 method='log_stream',
                 disabled=False):
        super(LoggingNode, self).__init__()
        self.id = self.id_prefix + name
        self.name = name
        self.timestamp = timestamp
        self.method = method
        self.disabled = disabled
        self._deleted = False
        self.save()

    def __repr__(self):
        return json.dumps({"name": self.name,
                           "timestamp": self.timestamp,
                           "method": self.method,
                           "disabled": self.disabled,
                           "_deleted": self._deleted})

    def __eq__(self, other):
        d1 = self.__dict__
        del d1['conn']
        d2 = other.__dict__
        if 'conn' in d2:
            del d2['conn']
        return d1 == d2

    @classmethod
    def _all(cls, k, v):
        logger.debug("v = %s", v)
        params = json.loads(v)
        del params['_deleted']
        return LoggingNode(**params)

    def update(self,
               timestamp=None,
               method=None,
               disabled=None):

        if timestamp is not None:
            self.timestamp = timestamp
        if method is not None:
            self.method = method
        if disabled is not None:
            self.disabled = disabled
        self.save()
        return self

    def save(self):
        """
        persist the state of the entry
        :return: True
        """
        self.conn.set(self.id, self)
        return True

    # TODO would like a cleaner way to remove the object, not just the record
    def delete(self):
        """
        delete a host record from persistence.
        :return: None
        """
        self.conn.delete(self.id)
        self._deleted = True
        self.timestamp = None

    @classmethod
    def all(cls):
        """
        return all records
        :return:
        """
        rc = RedisConnection()
        kl = rc.conn.keys(cls.id_prefix + "*")
        # mget doesn't handle empty list well
        if len(kl) == 0:
            return []

        vl = rc.conn.mget(kl)
        return map(cls._all, kl, vl)

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
            params = json.loads(result)
            del params['_deleted']
            return LoggingNode(**params)
