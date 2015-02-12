"""Goldstone views."""
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
from __future__ import unicode_literals
import calendar
from datetime import datetime, timedelta
import json
import logging

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.shortcuts import render
from django.views.generic import TemplateView
from elasticsearch import ElasticsearchException
import pandas as pd
import pytz
from rest_framework import status

from cinderclient.exceptions import AuthorizationFailure as CinderAuthException
from cinderclient.openstack.common.apiclient.exceptions \
    import AuthorizationFailure as CinderApiAuthException
from novaclient.exceptions import AuthorizationFailure \
    as NovaAuthException
from novaclient.openstack.common.apiclient.exceptions \
    import AuthorizationFailure as NovaApiAuthException
from keystoneclient.openstack.common.apiclient.exceptions \
    import AuthorizationFailure as KeystoneApiAuthException
from goldstone.utils import GoldstoneAuthError, TopologyMixin

logger = logging.getLogger(__name__)


def _parse_timestamp(stamp, zone=pytz.utc):

    try:
        result = datetime.fromtimestamp(int(stamp), tz=zone)
        logger.debug("[_parse_timestamp] dt = %s", str(result))
        return result

    except Exception:                  # pylint: disable=W0703
        logger.debug("[_parse_timestamp] timestamp creation failed.")
        return None


def validate(arg_list, context):
    """Validate an argument list within a particular context, and return
    an updated context or HttpResponseBadRequest."""

    # A "bad parameter" message string.
    BAD_PARAMETER = "malformed parameter [%s]"

    context = context.copy()
    validation_errors = []

    context['end_dt'] = _parse_timestamp(context['end'])

    if context['end_dt'] is None:
        validation_errors.append(BAD_PARAMETER % "end")
    elif 'start' in arg_list:
        if context['start'] is None:
            delta = timedelta(days=settings.DEFAULT_LOOKBACK_DAYS)
            context['start_dt'] = context['end_dt'] - delta
            context['start'] = str(calendar.timegm(
                context['start_dt'].timetuple()))
        else:
            context['start_dt'] = _parse_timestamp(context['start'])
            if context['start_dt'] is None:
                validation_errors.append(BAD_PARAMETER % "start")

    if 'interval' in arg_list:
        if context['interval'] is None:
            time_delta = (context['end_dt'] - context['start_dt'])
            # timdelta.total_seconds not available in py26
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

    if 'render' in arg_list:
        if context['render'] in ["True", "False"]:
            context['render'] = bool(context['render'])
        else:
            validation_errors.append(BAD_PARAMETER % "render")

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

        context = TemplateView.get_context_data(self, **kwargs)

        # Use "now" if not provided. Validate will calculate the start and
        # interval.
        context['end'] = \
            self.request.GET.get('end',
                                 str(calendar.timegm(
                                     datetime.utcnow().timetuple())))
        context['start'] = self.request.GET.get('start', None)
        context['interval'] = self.request.GET.get('interval', None)

        return context

    def render_to_response(self, context, **response_kwargs):

        context = validate(['start', 'end', 'interval'], context)

        # heck for a validation error.
        if isinstance(context, HttpResponseBadRequest):
            return context

        return TemplateView.render_to_response(self,
                                               {'start_ts': context['start'],
                                                'end_ts': context['end'],
                                                'interval': context['interval']
                                                })


class ApiPerfView(TemplateView):
    """The base class for all app "ApiPerfView" views."""

    data = pd.DataFrame()
    my_template_name = None

    def _get_data(self, _):                # pylint: disable=R0201
        """Override in subclass.

        :return: A model

        """

        return None

    def _handle_request(self, context):

        context = validate(['start', 'end', 'interval', 'render'], context)

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
        logger.debug('[_handle_request] response = %s', json.dumps(response))

        return response

    def get_context_data(self, **kwargs):

        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()

        # Use "now" if not provided. Validate will calculate the start and
        # interval.
        context['end'] = self.request.GET.get('end', str(calendar.timegm(
            datetime.utcnow().timetuple())))
        context['start'] = self.request.GET.get('start', None)
        context['interval'] = self.request.GET.get('interval', None)

        # If render is true, we return a full template, otherwise only
        # a json data payload.
        self.template_name = \
            self.my_template_name if context['render'] == 'True' else None

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

    def get_regions(self):
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

    def build_topology_tree(self):

        # this is going to be a little clunky until we find a good way
        # to register modules.  Looking at iPOPO/Pelix as one option, but
        # still exploring.

        # TODO make global map more module friendly
        from .apps.keystone.utils import DiscoverTree as KeystoneDiscoverTree
        from .apps.glance.utils import DiscoverTree as GlanceDiscoverTree
        from .apps.cinder.utils import DiscoverTree as CinderDiscoverTree
        from .apps.nova.utils import DiscoverTree as NovaDiscoverTree

        # Too many short names here. Disable C0103 for now, just here!
        # pylint: disable=C0103
        # Too many variables here!
        # pylint: disable=R0914

        try:
            keystone_topo = KeystoneDiscoverTree()
            glance_topo = GlanceDiscoverTree()
            cinder_topo = CinderDiscoverTree()
            nova_topo = NovaDiscoverTree()
        except Exception:
            logger.exception("Exception in DiscoverView")
            raise

        topo_list = [nova_topo, keystone_topo, glance_topo, cinder_topo]

        # Get regions from everyone and remove the dups.
        rll = [topo.get_regions() for topo in topo_list]
        rl = [reg for rl in rll for reg in rl]

        rl = [dict(t) for t in set([tuple(d.items()) for d in rl])]

        # we're going to bind everyone to the region tree. order is most likely
        # going to be important for some modules, so eventually we'll have
        # to be able to find a way to order or otherwise express module
        # dependencies.  It will also be helpful to build from the bottom up.

        # TODO devise mechanism for expressing module dependencies

        # bind cinder zones to global at region
        cl = [cinder_topo.build_topology_tree()]
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

        nl = [nova_topo.build_topology_tree()]
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
            glance_topo.build_topology_tree(), "glance")
        ad = {'sourceRsrcType': 'module',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}
        rl = self._attach_resource(ad, gl, rl)

        # bind keystone region to region, but rename keystone
        kl = self._rescope_module_tree(
            keystone_topo.build_topology_tree(), "keystone")
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
        """Overridden to handle case of a data-only request (render=False).

        In which case, an application/json data payload is returned.

        """

        try:
            response = self.build_topology_tree()
            if isinstance(response, HttpResponseBadRequest):
                return response

            if self.template_name is None:
                return HttpResponse(json.dumps(response),
                                    content_type="application/json")

            return TemplateView.render_to_response(
                self,
                {'data': json.dumps(response)})

        except (CinderAuthException, CinderApiAuthException, NovaAuthException,
                NovaApiAuthException, KeystoneApiAuthException,
                GoldstoneAuthError):
            logger.exception("Error.")

            return HttpResponse(status=401) if self.template_name is None \
                else render(self.request, '401.html', status=401)

        except ElasticsearchException:
            return HttpResponse(content="Could not connect to the "
                                "search backend",
                                status=status.HTTP_504_GATEWAY_TIMEOUT)


class HelpView(TemplateView):
    template_name = 'help.html'


class NodeReportView(TemplateView):
    template_name = 'node_report.html'

    def get(self, request, node_uuid, **kwargs):
        from django.core.exceptions import ObjectDoesNotExist
        from goldstone.apps.core.models import Node

        # TODO query should look for node id rather than name.
        # But this will probably require that we model/shadow the resources in
        # OpenStack so we can map the name to one of our IDs consistently.
        try:
            Node.objects.get(name=node_uuid)
            return super(NodeReportView, self).get(request,
                                                   node_uuid=node_uuid)
        except ObjectDoesNotExist:
            raise Http404
