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


class LoggingNode(models.Model):
    uuid = UUIDField(unique=True)
    name = models.CharField(
        max_length=100, unique=True)

    created = CreationDateTimeField()

    updated = ModificationDateTimeField()

    method = models.CharField(
        max_length=20,
        default='log_stream',
        validators=[lambda m: m.lower == 'ping' or m.lower == 'log_stream'])

    disabled = models.BooleanField(
        default=False)

    def __unicode__(self):
        return json.dumps({"name": self.name,
                           "created": self.created.isoformat(),
                           "updated": self.updated.isoformat(),
                           "method": self.method,
                           "disabled": self.disabled})
