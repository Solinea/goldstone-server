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
from datetime import datetime

from django.db import models
import logging
from django.db.models import IntegerField
from polymorphic import PolymorphicManager, PolymorphicQuerySet
from polymorphic.query import Polymorphic_QuerySet_objects_per_request
from goldstone.apps.core.models import Node, Event, NodeType
from goldstone.apps.logging.es_models import LoggingNodeStats


__author__ = 'stanford'

logger = logging.getLogger(__name__)


class LoggingNodeType(NodeType):
    @classmethod
    def get_model(cls):
        return LoggingNode

    @classmethod
    def get_mapping(cls):
        """Returns an Elasticsearch mapping for this MappingType.  These are
        a bit contrived since the template dynamically creates the mapping
        type.  It is helpful to support the ordering requests in the view.
        The view will look at the type of a field and if it is a string, will
        use the associated .raw field for ordering."""

        result = super(LoggingNodeType, cls).get_mapping()
        result['properties']['error_count'] = {'type': 'integer'}
        result['properties']['warning_count'] = {'type': 'integer'}
        result['properties']['info_count'] = {'type': 'integer'}
        result['properties']['audit_count'] = {'type': 'integer'}
        result['properties']['debug_count'] = {'type': 'integer'}
        return result

    @classmethod
    def extract_document(cls, obj_id, obj):
        """Converts this instance into an Elasticsearch document"""
        if obj is None:
            # todo this will go to the model manager which would natively
            # todo look at the SQL db.  we either need to fix this or fix the
            # todo model manager implementation of get.
            obj = cls.get_model().get(id=obj_id)

        result = super(LoggingNodeType, cls).extract_document(obj_id, obj)

        # TODO need the log
        result['error_count'] = obj.error_count
        result['warning_count'] = obj.warning_count
        result['']

        return {
            'id': str(obj.id),
            'name': obj.name,
            'created': obj.created.isoformat(),
            'updated': arrow.utcnow().isoformat(),
            'last_seen_method': obj.last_seen_method,
            'admin_disabled': str(obj.admin_disabled)
        }

class LoggingNode(Node):
    error_count = IntegerField(default=0)
    warning_count = IntegerField(default=0)
    info_count = IntegerField(default=0)
    audit_count = IntegerField(default=0)
    debug_count = IntegerField(default=0)

    _mt = LoggingNodeType()
    es_objects = LoggingNodeType


class LoggingEvent(Event):
    """
    Represents an event harvested from the log event stream.
    """
    pass
