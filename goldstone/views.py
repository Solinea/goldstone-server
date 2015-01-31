from __future__ import unicode_literals
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from django.shortcuts import render
from elasticsearch import ElasticsearchException
from rest_framework import status
from goldstone.apps.core.models import Node
from goldstone.utils import GoldstoneAuthError, TopologyMixin

__author__ = 'John Stanford'


import calendar
from abc import ABCMeta, abstractmethod, abstractproperty
from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.views.generic.base import ContextMixin
from django.views.generic import TemplateView, View
from django.conf import settings
from datetime import datetime, timedelta
import json
import pandas as pd
import logging
import pytz
from cinderclient.exceptions import AuthorizationFailure as CinderAuthException
from cinderclient.openstack.common.apiclient.exceptions \
    import AuthorizationFailure as CinderApiAuthException
from novaclient.exceptions import AuthorizationFailure \
    as NovaAuthException
from novaclient.openstack.common.apiclient.exceptions \
    import AuthorizationFailure as NovaApiAuthException
from keystoneclient.openstack.common.apiclient.exceptions \
    import AuthorizationFailure as KeystoneApiAuthException

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
        return HttpResponseBadRequest(json.dumps(validation_errors),
                                      'application/json')
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
            # TemplateView.content_type = 'application/json'

        return context

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """
        try:
            response = self._handle_request(context)
            if isinstance(response, HttpResponseBadRequest):
                return response

            if self.template_name is None:
                return HttpResponse(json.dumps(response),
                                    content_type="application/json")

            return TemplateView.render_to_response(
                self, {'data': json.dumps(response), 'start': context['start'],
                       'end': context['end'], 'interval': context['interval']})
        except ElasticsearchException:
            return HttpResponse(content="Could not connect to the "
                                        "search backend",
                                status=status.HTTP_504_GATEWAY_TIMEOUT)


class ApiPerfView(InnerTimeRangeView):
    data = pd.DataFrame()
    my_template_name = None

    def _get_data(self, context):
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

        # good policy, but don't think it is required for this specific
        # dataset
        if not self.data.empty:
            self.data = self.data.fillna(0)

        # record output may be a bit bulkier, but easier to process by D3.
        # keys appear to be in alphabetical order, so could use
        # orient=values to trim it down, or pass it in a binary format
        # if things get really messy.
        response = self.data.to_json(orient='records')
        logger.debug('[_handle_request] response = %s',
                     json.dumps(response))
        return response


class DiscoverView(TemplateView, TopologyMixin):
    """
    Produces a view of a module topology (or json data if render=false).
    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.

    caller should override "my_template_name" and define an init function
    that pulls data from a subclass of model.TopologyData.

    A resource has the following structure:

    {
        "rsrcType": "cloud|region|zone|service|volume|etc.",
        "label": "string",
        "info": {"key": "value" [, "key": "value", ...]}, (optional)
        "lifeStage": "new|existing|absent", (optional)
        "enabled": True|False, (optional)
        "children": [rsrcType] (optional)
     }

    """
    template_name = 'goldstone_discover.html'

    def _get_regions(self):
        return []

    def _rescope_module_tree(self, tree, module_name):
        """
        Returns a tree that is ready to merge with the global tree.  Uses
        a rsrc_type of module, and a label of the module name.  If cloud
        rsrc_type is the root, throws it away.  Result is wrapped in a list.
        """
        if tree['rsrcType'] == 'cloud':
            result = []
            for child in tree['children']:
                child['region'] = child['label']
                child['rsrcType'] = 'module'
                child['label'] = module_name
                result.append(child)
            return result
        else:
            tree['region'] = tree['label']
            tree['rsrcType'] = 'module'
            tree['label'] = module_name
            return [tree]

    def _build_topology_tree(self):

        # this is going to be a little clunky until we find a good way
        # to register modules.  Looking at iPOPO/Pelix as one option, but
        # still exploring.

        # TODO make global map more module friendly

        from .apps.keystone.utils import DiscoverTree as KeystoneDiscoverTree
        from .apps.glance.utils import DiscoverTree as GlanceDiscoverTree
        from .apps.cinder.utils import DiscoverTree as CinderDiscoverTree
        from .apps.nova.utils import DiscoverTree as NovaDiscoverTree

        try:
            keystone_topo = KeystoneDiscoverTree()
            glance_topo = GlanceDiscoverTree()
            cinder_topo = CinderDiscoverTree()
            nova_topo = NovaDiscoverTree()
        except Exception:
            logger.exception("Exception in DiscoverView")
            raise

        topo_list = [nova_topo, keystone_topo, glance_topo, cinder_topo]

        # get regions from everyone and remove the dups
        rll = [topo._get_regions() for topo in topo_list]
        rl = [reg
              for rl in rll
              for reg in rl]

        rl = [dict(t) for t in set([tuple(d.items()) for d in rl])]

        # we're going to bind everyone to the region tree. order is most likely
        # going to be important for some modules, so eventually we'll have
        # to be able to find a way to order or otherwise express module
        # dependencies.  It will also be helpful to build from the bottom up.

        # TODO devise mechanism for expressing module dependencies

        # bind cinder zones to global at region
        cl = [cinder_topo._build_topology_tree()]
        # convert top level items to cinder modules
        new_cl = []
        for c in cl:
            if c['rsrcType'] != 'error':
                c['rsrcType'] = 'module'
                c['region'] = c['label']
                c['label'] = 'cinder'
                new_cl.append(c)

        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}

        rl = self._attach_resource(ad, new_cl, rl)

        nl = [nova_topo._build_topology_tree()]
        # convert top level items to nova module
        new_nl = []
        for n in nl:
            if c['rsrcType'] != 'error':
                n['rsrcType'] = 'module'
                n['region'] = n['label']
                n['label'] = 'nova'
                new_nl.append(n)

        rl = self._attach_resource(ad, new_nl, rl)

        # bind glance region to region, but rename glance
        gl = self._rescope_module_tree(
            glance_topo._build_topology_tree(), "glance")
        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}
        rl = self._attach_resource(ad, gl, rl)

        # bind keystone region to region, but rename keystone
        kl = self._rescope_module_tree(
            keystone_topo._build_topology_tree(), "keystone")
        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}
        rl = self._attach_resource(ad, kl, rl)

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        elif len(rl) == 1:
            return rl[0]
        else:
            return {"rsrcType": "error", "label": "No data found"}

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render'] != 'True':
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """
        try:
            response = self._build_topology_tree()
            if isinstance(response, HttpResponseBadRequest):
                return response

            if self.template_name is None:
                return HttpResponse(json.dumps(response),
                                    content_type="application/json")

            return TemplateView.render_to_response(
                self, {'data': json.dumps(response)})
        except (CinderAuthException, CinderApiAuthException, NovaAuthException,
                NovaApiAuthException, KeystoneApiAuthException,
                GoldstoneAuthError) as e:
            logger.exception(e)
            if self.template_name is None:
                return HttpResponse(status=401)
            else:
                return render(self.request, '401.html', status=401)
        except ElasticsearchException as e:
            return HttpResponse(content="Could not connect to the "
                                        "search backend",
                                status=status.HTTP_504_GATEWAY_TIMEOUT)


class JSONView(ContextMixin, View):
    """
    A view that renders a JSON response.  This view will also pass into the
    context any keyword arguments passed by the url conf.
    """

    zone_key = None
    key = None       # override in subclass
    model = None     # override in subclass

    def get_context_data(self, **kwargs):
        context = ContextMixin.get_context_data(self, **kwargs)
        context['zone'] = self.request.GET.get('zone', None)
        context['region'] = self.request.GET.get('region', None)
        return context

    def _get_data_for_json_view(self, context, data, key):
        result = []
        for item in data:
            region = item['_source']['region']
            if context['region'] is None or context['region'] == region:
                ts = item['_source']['@timestamp']
                new_list = []
                for rec in item['_source'][key]:
                    if context['zone'] is None or self.zone_key is None or \
                            context['zone'] == rec[self.zone_key]:
                        rec['region'] = region
                        rec['@timestamp'] = ts
                        new_list.append(rec)

                result.append(new_list)

        return result

    def _get_data(self, context):
        try:
            self.data = self.model().get()
            return self._get_data_for_json_view(context, self.data, self.key)
        except TypeError:
            return [[]]

    def get(self, request, *args, **kwargs):
        try:
            context = self.get_context_data(**kwargs)
            content = json.dumps(self._get_data(context))
            return HttpResponse(content=content,
                                content_type='application/json')
        except ElasticsearchException:
            return HttpResponse(content="Could not connect to the "
                                        "search backend",
                                status=status.HTTP_504_GATEWAY_TIMEOUT)


class HelpView(TemplateView):
    template_name = 'help.html'


class NodeReportView(TemplateView):
    template_name = 'node_report.html'

    def get(self, request, node_uuid):
        # TODO query should look for node id rather than name.
        # But this will probably require that we model/shadow the resources in
        # OpenStack so we can map the name to one of our IDs consistently.
        try:
            # This will throw an exception if the node doesn't exist.
            Node.objects.get(name=node_uuid)
            return super(NodeReportView, self).get(request,
                                                   node_uuid=node_uuid)
        except Node.DoesNotExist:
            raise Http404
