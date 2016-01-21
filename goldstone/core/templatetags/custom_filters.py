"""Core template tags for Django templates."""
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
import json

from django import template
from django.utils.html import escapejs
from django.utils.safestring import mark_safe

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
