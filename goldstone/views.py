from __future__ import unicode_literals
import calendar
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.generic import TemplateView
from django.conf import settings
from datetime import datetime, timedelta
import json
import pandas as pd
import logging
import pytz

logger = logging.getLogger(__name__)


def _parse_timestamp(ts, tz=pytz.utc):
    try:
        dt = datetime.fromtimestamp(int(ts), tz=tz)
        logger.debug("[_parse_timestamp] dt = %s", str(dt))
        return dt
    except Exception:
        logger.debug("[_parse_timestamp] timestamp creation failed, ")
        return None


def _validate(arg_list, context):
    context = context.copy()
    validation_errors = []

    # TODO GOLD-280 TODO: need to check for key existence in _validate first
    context['end_dt'] = _parse_timestamp(context['end'])
    if context['end_dt'] is None:
        validation_errors.append('malformed parameter [end]')
    elif 'start' in arg_list:
        if context['start'] is None:
            delta = timedelta(days=settings.DEFAULT_LOOKBACK_DAYS)
            context['start_dt'] = context['end_dt'] - delta
            context['start'] = str(calendar.timegm(
                context['start_dt'].timetuple()))
        else:
            context['start_dt'] = _parse_timestamp(context['start'])
            if context['start_dt'] is None:
                validation_errors.append('malformed parameter [start]')

    if 'interval' in arg_list:
        if context['interval'] is None:
            td = (context['end_dt'] - context['start_dt'])
            # timdelta.total_seconds not available in py26
            delta_secs = (td.microseconds + (
                td.seconds + td.days * 24 * 3600) * 10 ** 6) / 10 ** 6
            context['interval'] = str(
                delta_secs / settings.DEFAULT_CHART_BUCKETS) + "s"
        elif context['interval'][-1] not in ['s']:
            validation_errors.append(
                'malformed parameter [interval], valid example is 3600.0s')
            try:
                int(context['interval'][:-1])
            except Exception:
                validation_errors.append('malformed parameter [interval]')
    if 'render' in arg_list:
        if context['render'] not in ["True", "False"]:
            validation_errors.append('malformed parameter [render]')
        else:
            context['render'] = bool(context['render'])

    if len(validation_errors) > 0:
        return HttpResponseBadRequest(json.dumps(validation_errors))
    else:
        return context


class TopLevelView(TemplateView):
    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        # use "now" if not provided, will calc start and interval in _validate
        context['end'] = self.request.GET.get('end', str(calendar.timegm(
            datetime.utcnow().timetuple())))
        context['start'] = self.request.GET.get('start', None)

        context['interval'] = self.request.GET.get('interval', None)
        return context

    def render_to_response(self, context, **response_kwargs):
        context = _validate(['start', 'end', 'interval'], context)
        # check for a validation error
        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context

        return TemplateView.render_to_response(
            self,
            {
                'start_ts': context['start'],
                'end_ts': context['end'],
                'interval': context['interval']
            })


class InnerTimeRangeView(TemplateView):

    my_template_name = None

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()
        # use "now" if not provided, will calc start and interval in _validate
        context['end'] = self.request.GET.get('end', str(calendar.timegm(
            datetime.utcnow().timetuple())))
        context['start'] = self.request.GET.get('start', None)
        context['interval'] = self.request.GET.get('interval', None)

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render'] == 'True':
            self.template_name = self.my_template_name
        else:
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """
        response = self._handle_request(context)
        if isinstance(response, HttpResponseBadRequest):
            return response

        if self.template_name is None:
            return HttpResponse(json.dumps(response),
                                content_type="application/json")

        return TemplateView.render_to_response(
            self, {'data': json.dumps(response), 'start': context['start'],
                   'end': context['end'], 'interval': context['interval']})


class ApiPerfView(InnerTimeRangeView):
    data = pd.DataFrame()
    my_template_name = None

    def _get_data(self):
        """
        Override in subclass, return a model result
        """
        return None

    def _handle_request(self, context):
        context = _validate(['start', 'end', 'interval', 'render'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context

        logger.debug("[_handle_request] start_dt = %s", context['start_dt'])
        self.data = self._get_data(context)
        logger.debug("[_handle_request] data = %s", self.data)

        # good policy, but don't think it is required for this specific dataset
        if not self.data.empty:
            self.data = self.data.fillna(0)

        # record output may be a bit bulkier, but easier to process by D3.
        # keys appear to be in alphabetical order, so could use orient=values
        # to trim it down, or pass it in a binary format if things get really
        # messy.
        response = self.data.to_json(orient='records')
        # response = self.data.transpose().to_dict(outtype='list')
        logger.debug('[_handle_request] response = %s', json.dumps(response))
        return response
