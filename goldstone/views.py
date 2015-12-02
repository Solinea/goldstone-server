"""Goldstone views."""
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
from __future__ import unicode_literals
import json

import arrow

from django.conf import settings
from django.http import HttpResponseBadRequest
from django.views.generic import TemplateView


def validate(arg_list, context):
    """Validate an argument list within a particular context, and return
    an updated context or HttpResponseBadRequest."""

    # A "bad parameter" message string.
    BAD_PARAMETER = "malformed parameter [%s]"

    context = context.copy()
    validation_errors = []
    try:
        end = arrow.get(context['end'])
        context['end_dt'] = end.datetime
    except Exception:          # pylint: disable=W0703
        validation_errors.append(BAD_PARAMETER % "end")

    if 'start' in arg_list:
        if context['start'] is None:
            start = end.replace(days=settings.DEFAULT_LOOKBACK_DAYS * -1)
            context['start_dt'] = start.datetime
            context['start'] = str(start.timestamp)
        else:
            try:
                context['start_dt'] = arrow.get(context['start']).datetime
            except Exception:         # pylint: disable=W0703
                validation_errors.append(BAD_PARAMETER % "start")

    if 'interval' in arg_list:
        if context['interval'] is None:
            time_delta = context['end_dt'] - context['start_dt']
            # timedelta.total_seconds not available in py26
            delta_secs = \
                (time_delta.microseconds +
                 (time_delta.seconds + time_delta.days * 24 * 3600)
                 * 10 ** 6) / 10 ** 6
            context['interval'] = str(
                delta_secs / settings.DEFAULT_CHART_BUCKETS) + "s"
        elif context['interval'][-1] != 's':
            validation_errors.append(
                BAD_PARAMETER % "interval" + ", valid example is 3600.0s")
            try:
                int(context['interval'][:-1])
            except Exception:       # pylint: disable=W0703
                validation_errors.append(BAD_PARAMETER % "interval")

    # Return HttpResponseBadRequest if there were validation errors,
    # otherwise return the context.
    return \
        HttpResponseBadRequest(json.dumps(validation_errors),
                               'application/json') \
        if validation_errors \
        else context


class TopLevelView(TemplateView):
    """The base class for top-level views of a resource type.

    Different resource type views are created by changing the
    template_name class name that's used in the subclass.

    """

    def get_context_data(self, **kwargs):
        """Return template context data.

        :rtype: dict

        """

        context = super(TopLevelView, self).get_context_data(**kwargs)

        # Use "now" if not provided. Validate will calculate the start and
        # interval.
        context['end'] = \
            self.request.GET.get('end', str(arrow.utcnow().timestamp))
        context['start'] = self.request.GET.get('start', None)
        context['interval'] = self.request.GET.get('interval', None)

        return context

    def render_to_response(self, context, **response_kwargs):
        """A custom render_to_response that does some additional work."""

        context = validate(['start', 'end', 'interval'], context)

        # Hack for a validation error.
        if isinstance(context, HttpResponseBadRequest):
            return context

        return TemplateView.render_to_response(self,
                                               {'start_ts': context['start'],
                                                'end_ts': context['end'],
                                                'interval': context['interval']
                                                })


class RouterView(TemplateView):
    """Return the Goldstone Router page."""

    template_name = 'router.html'

    def get_context_data(self, **kwargs):
        """Return template context data.

        :rtype: dict

        """

        # The i18n JSON file we read, and the template variable we load its
        # contents into.
        I18N_FILE = "goldstone/static/i18n/po_json/i18n_combined.json"
        I18N_VARIABLE = "i18n_po_json_i18n_combined_json"

        context = super(RouterView, self).get_context_data(**kwargs)

        # Include this file's contents as a template variable.
        try:
            with open(I18N_FILE) as f:
                context[I18N_VARIABLE] = json.loads(f.read())
        except IOError:
            context[I18N_VARIABLE] = "file not found"

        return context
