"""Core template tags for Django templates."""
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
from django import template
from django.utils.html import escapejs
from django.utils.safestring import mark_safe
import json

register = template.Library()      # pylint: disable=C0103


@register.filter
def to_js(value):
    """To use a python variable in JS, we call json.dumps to serialize as JSON
    server-side and reconstruct using JSON.parse.

    The serialized string must be appropriately escapted before dumping into
    the client-side code.

    """

    # The separators parameter is used to remove whitespace.
    return mark_safe('JSON.parse("%s")' %
                     escapejs(json.dumps(value, separators=(',', ':'))))
