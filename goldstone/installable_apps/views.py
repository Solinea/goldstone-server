"""Installable applications views."""
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
from rest_framework.decorators import api_view


class DateTimeEncoder(json.JSONEncoder):
    """A JSON encoder that understand Python datetime objects."""

    def default(self, obj):                       # pylint: disable=E0202
        """Return a JSON-encoded form of obj."""
        import datetime

        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        elif isinstance(obj, datetime.date):
            return obj.isoformat()
        elif isinstance(obj, datetime.timedelta):
            return (datetime.datetime.min + obj).time().isoformat()
        else:
            return super(DateTimeEncoder, self).default(obj)


# Our API documentation extracts this docstring, hence the use of markup.
@api_view()
def applications(_):
    """Return information about the installed optional applications."""
    from .models import Application
    from rest_framework.response import Response

    # Fetch the table rows as a dict, delete each row's pk, and convert them to
    # JSON.
    result = list(Application.objects.all().values())

    for entry in result:
        del entry["id"]

    result = DateTimeEncoder().encode(result)

    return Response(result)
