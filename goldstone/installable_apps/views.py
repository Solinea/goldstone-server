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


# Our API documentation extracts this docstring, hence the use of markup.
@api_view()
def verify(_):
    """Verify the integrity of the installable apps table, and report on any
    rows with invalid url_roots.

    The Django 1.6 hooks for running code at project startup, or after a
    database syncdb, aren't sufficient to reliably run this when Goldstone
    starts. So we let the client decide when to check the table, and how to
    report table problems.

    To fix bad rows, either the Goldstone admin should delete the table row(s),
    or install the missing application(s).

    This returns a 200 if the table is OK, or a 400 if there's >= one bad
    table row. The response text will contain the bad rows' names.

    """
    from .models import Application
    from rest_framework.response import Response
    from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_200_OK

    # Verify the table. The call returns the bad rows that were found, so we
    # return 400 if the result isn't empty.
    result = Application.objects.check_table()
    status = HTTP_400_BAD_REQUEST if result else HTTP_200_OK

    return Response(DateTimeEncoder().encode(result), status=status)
