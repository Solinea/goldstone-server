# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#
from __future__ import unicode_literals
import calendar
from django.http import HttpResponse, HttpResponseBadRequest
from django.conf import settings
from django.views.generic import TemplateView
from waffle.decorators import waffle_switch
from .models import SpawnData
from datetime import datetime, timedelta
import pytz
import json
import logging
import math
import pandas as pd

logger = logging.getLogger(__name__)


def _parse_timestamp(ts, tz=pytz.utc):

    try:
        dt = datetime.fromtimestamp(int(ts), tz=tz)
        logger.info("[_parse_timestamp] dt = %s", str(dt))
        return dt
    except Exception:
        logger.info("[_parse_timestamp] timestamp creation failed, ")
        return None


class SpawnsView(TemplateView):

    data = pd.DataFrame()

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True").\
            lower().capitalize()
        context['start'] = self.request.GET.get('start', None)
        context['end'] = self.request.GET.get('end', None)
        context['interval'] = self.request.GET.get('interval', None)

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render']:
            template_name = 'spawns.html'
        else:
            template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def _handle_request(self, context):
        validation_errors = []
        if context['start'] is None:
            validation_errors.append('parameter missing [start]')
        if context['end'] is None:
            validation_errors.append('parameter missing [end]')
        if context['interval'] is None:
            validation_errors.append('parameter missing [interval]')
        elif context['interval'][-1] not in ['s', 'm', 'h', 'd', 'w']:
            validation_errors.append('malformed parameter [interval]')
            try:
                int(context['interval'][:-1])
            except Exception:
                validation_errors.append('malformed parameter [interval]')
        if context['render'] not in ["True", "False"]:
            validation_errors.append('malformed parameter [render]')
        else:
            context['render'] = bool(context['render'])

        context['end_dt'] = _parse_timestamp(context['end'])
        if context['end_dt'] is None:
            validation_errors.append('malformed parameter [end]')
        else:
            context['start_dt'] = _parse_timestamp(context['start'])
            if context['start_dt'] is None:
                validation_errors.append('malformed parameter [start]')

        if len(validation_errors) > 0:
            logger.info("[_handle_request] validation_errors = %s",
                        json.dumps(validation_errors))
            return HttpResponseBadRequest(json.dumps(validation_errors))

        logger.info("[get_context_data] start_dt = %s", context['start_dt'])
        logger.info("[get_context_data] end_dt = %s", context['end_dt'])
        sd = SpawnData(context['start_dt'], context['end_dt'],
                       context['interval'])
        success_data = sd.get_spawn_success()
        failure_data = sd.get_spawn_failure()

        if not (success_data.empty and failure_data.empty):
            if success_data.empty:
                failure_data['successes'] = 0
                failure_data.rename(
                    columns={'doc_count': 'failures'}, inplace=True)
                self.data = failure_data
            elif failure_data.empty:
                success_data['failures'] = 0
                success_data.rename(
                    columns={'doc_count': 'successes'}, inplace=True)
                self.data = success_data
            else:
                self.data = pd.ordered_merge(
                    success_data, failure_data,
                    on='key', suffixes=('successes', 'failures'),
                    fill_method=None)
                self.data.rename(columns={'doc_count_successes': 'successes',
                                          'doc_count_failures': 'failures'},
                                 inplace=True)

        response = self.data.to_dict(outtype='dict')
        return HttpResponse(json.dumps(response),
                            content_type="application/json")

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """

        if self.template_name is None:
            return self._handle_request(context)
        else:
            response_kwargs.setdefault('content_type', self.content_type)
            return self.response_class(
                request=self.request,
                template=self.get_template_names(),
                context=context,
                **response_kwargs
            )


class NovaInstanceSpawnView():
    pass

