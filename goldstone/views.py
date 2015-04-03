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

import json
import logging

from django.conf import settings
from django.http import HttpResponseBadRequest, Http404
from django.views.generic import TemplateView

from goldstone.utils import TopologyMixin

logger = logging.getLogger(__name__)


def validate(arg_list, context):
    """Validate an argument list within a particular context, and return
    an updated context or HttpResponseBadRequest."""

    import arrow

    # A "bad parameter" message string.
    BAD_PARAMETER = "malformed parameter [%s]"

    context = context.copy()
    validation_errors = []
    try:
        end = arrow.get(context['end'])
        context['end_dt'] = end.datetime
    except Exception:
        validation_errors.append(BAD_PARAMETER % "end")

    if 'start' in arg_list:
        if context['start'] is None:
            start = end.replace(days=settings.DEFAULT_LOOKBACK_DAYS * -1)
            context['start_dt'] = start.datetime
            context['start'] = str(start.timestamp)
        else:
            try:
                context['start_dt'] = arrow.get(context['start']).datetime
            except Exception:
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

    # TODO: Once the render parameter is removed from the rest of the codebase,
    # this if block can be deleted.
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

        import arrow
        context = TemplateView.get_context_data(self, **kwargs)

        # Use "now" if not provided. Validate will calculate the start and
        # interval.
        context['end'] = \
            self.request.GET.get('end', str(arrow.utcnow().timestamp))
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


class DiscoverView(TemplateView, TopologyMixin):
    """Return a module topology.

    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.

    The caller should:
       - override "template_name"
       - define an init function that pulls data from a subclass of
         model.TopologyData.

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

    # TODO: Remove the Django template once the client implements Backbone
    # views. To do this, replace TemplateView with APIView, delete the
    # template_name attribute, get_context_data, .render_to_response, and
    # templates/goldstone_discover.html. Then, uncomment .get().

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
        """Return the topology tree that is displayed by this view."""

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

        c = {}                # In case cl is empty. Plus, keeps pylint happy.
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
        """Return the template context."""

        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()

        # If render is true, we will return a full template, otherwise only
        # a json data payload.
        if context['render'] != 'True':
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    # def get(self, _):
    #     """Return a topology tree."""

    #     return Response(self.build_topology_tree())

    def render_to_response(self, context, **response_kwargs):
        """Return the response data."""
        from rest_framework import status
        from cinderclient.exceptions import AuthorizationFailure as \
            CinderAuthException
        from cinderclient.openstack.common.apiclient.exceptions \
            import AuthorizationFailure as CinderApiAuthException
        from novaclient.exceptions import AuthorizationFailure \
            as NovaAuthException
        from novaclient.openstack.common.apiclient.exceptions \
            import AuthorizationFailure as NovaApiAuthException
        from keystoneclient.openstack.common.apiclient.exceptions \
            import AuthorizationFailure as KeystoneApiAuthException
        from goldstone.utils import GoldstoneAuthError
        from django.http import HttpResponse
        from elasticsearch import ElasticsearchException
        from django.shortcuts import render

        try:
            response = self.build_topology_tree()
            if isinstance(response, HttpResponseBadRequest):
                return response

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
    """Return the Help page."""

    template_name = 'help.html'


class LoginPageView(TemplateView):
    """Return the Goldstone home page."""

    template_name = 'login.html'


class PasswordView(TemplateView):
    """Return the Goldstone password reset page."""

    template_name = 'password.html'


class SettingsPageView(TemplateView):
    """Return the Goldstone user settings page."""

    template_name = 'settings.html'


class TenantSettingsPageView(TemplateView):
    """Return the Goldstone tenant/user settings page."""

    template_name = 'tenant.html'


# TODO refresh NodeReportView.  It should be a method of Nova Host resource.
class NodeReportView(TemplateView):
    """Return a Node Report page if node exists."""

    template_name = 'node_report.html'

    def get(self, request, node_uuid, **kwargs):
        from django.core.exceptions import ObjectDoesNotExist
        from goldstone.core.models import Host

        try:
            Host.objects.get(name=node_uuid)
            return super(NodeReportView, self).get(request,
                                                   node_uuid=node_uuid)
        except ObjectDoesNotExist:
            raise Http404
