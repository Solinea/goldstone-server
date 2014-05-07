# Copyright 2014 Solinea, Inc.
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
import ast
import copy
import itertools
from goldstone.utils import _is_ip_addr, _partition_hostname, _resolve_fqdn, \
    _resolve_addr, _host_details, _normalize_hostnames, _normalize_hostname

__author__ = 'John Stanford'

from goldstone.views import *
from .models import ApiPerfData, ServiceData, VolumeData
import logging

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'cinder_discover.html'


class ReportView(TopLevelView):
    template_name = 'cinder_report.html'


class ServiceListApiPerfView(ApiPerfView):
    my_template_name = 'cinder_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class TopologyView(TemplateView):
    """
    Produces a view of the cinder topology (or json data if render=false).
    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.

    A resource has the following structure:

    {
        "rsrcType": "cloud|region|zone|service|volume",
        "label": "string",
        "info": {"key": "value" [, "key": "value", ...]}, (optional)
        "lifeStage": "new|existing|absent", (optional)
        "enabled": True|False, (optional)
        "children": [rsrcType] (optional)
     }

    """
    my_template_name = 'cinder_topology.html'

    def __init__(self):
        self.services = ServiceData().get()
        self.volumes = VolumeData().get()

    def _get_service_regions(self):
        return set([s['_source']['region'] for s in self.services])

    def _get_volume_regions(self):
        return set(
            [
                ep['_source']['region']
                for ep in self.volumes
            ])

    @staticmethod
    def _eval_condition(d1, d2, sc, tc, cond):
        """
        evaluates the source and target dicts to see if the condition holds.
        returns boolean.
        """
        # substitute reference to source and target in condition
        cond = cond.replace("%source%", "d1").replace("%target%", "d2")
        cond = cond.replace("%source_child%", "sc")
        cond = cond.replace("%target_child%", "tc")
        return ast.literal_eval(cond)

    def _get_children(self, d, rsrc_type):
        assert (type(d) is dict or type(d) is list), "d must be a list or dict"
        assert rsrc_type, "rsrc_type must have a value"

        if type(d) is list:
            # make it into a dict
            d = {
                'rsrcType': None,
                'children': d
            }
        # this is a matching child
        if d['rsrcType'] == rsrc_type:
            return d
        # this is not a match, but has children to check
        elif d.get('children', None):

            result = [self._get_children(c, rsrc_type)
                      for c in d['children']]
            if len(result) > 0 and type(result[0]) is list:
                # flatten it so we don't end up with nested lists
                print "flattening " + json.dumps(result)
                return [c for l in result for c in l]
            else:
                print "NOT flattening " + json.dumps(result)
                return result
        # anything else is a leaf that doesn't match and has no children,
        # so we don't return anything.

    def _attach_resource(self, attach_descriptor, source, target):
        """
        Attaches one resource tree to another at a described point.  The
        descriptor format is:

            {'sourceRsrcType': 'string',
             'targetRsrcType': 'string',
             'conditions': 'string'}

        If sourceRsrcType will be treated as the top level thing to attach.  If
        there are resources above it in the source dict, they will be ignored.
        The resource(s) of type sourceResourceType along with their descendants
        will be attached to resources of targetRsrcType in the target dict
        which match the condition expression.  The target dict assumes that
        nesting is via the 'children' key.  The condition will be evaluated as
        a boolean expression, and will have access to the items in both source
        and target.
        """

        # basic sanity check.  all args should be dicts, source and target
        # should have a rsrcType field
        assert type(source) is list, "source param must be a list"
        assert type(target) is list, "target param must be a list"
        assert type(attach_descriptor) is dict, \
            "attach_descriptor param must be a dict"

        # make copies so they are not subject to mutation during or after the
        # the call.
        targ = copy.deepcopy(target)
        src = copy.deepcopy(source)
        ad = attach_descriptor

        targ_children = self._get_children(targ, ad['targetRsrcType'])
        src_children = self._get_children(src, ad['sourceRsrcType'])
        for tc in targ_children:
            for sc in src_children:
                match = self._eval_condition(src, targ, sc, tc,
                                             ad['conditions'])
                if match:
                    if not tc.has_key('children'):
                        tc['children'] = []
                    tc['children'].append(sc)
        return targ

    def _get_zones(self, updated, region):
        """
        returns the zone structure derived from both services and volumes.
        has children hosts populated as the attachment point for the services
        and volumes in the graph.
        """
        zones = set(
            z['zone']
            for z in self.services[0]['_source']['services']
        ).union(set([v['availability_zone']
                     for v in self.volumes[0]['_source']['volumes']]))
        result = []
        for zone in zones:
            # build the initial list from services and volumes
            hosts = set(
                s['host']
                for s in self.services[0]['_source']['services']
                if s['zone'] == zone
            ).union(set([
                v['os-vol-host-attr:host']
                for v in self.volumes[0]['_source']['volumes']
                if v['availability_zone'] == zone]))
            # remove domain names from hostnames if they are there
            hosts = set([_normalize_hostname(h) for h in hosts])
            base_hosts = []
            for h in hosts:
                base_hosts.append({
                    "rsrcType": "host",
                    "label": h,
                    "info": {
                        "last_update": updated,
                    }})
            result.append({
                "rsrcType": "zone",
                "label": zone,
                "region": region,
                "info": {
                    "last_update": updated
                 },
                "children": base_hosts
            })

        return result

    def _transform_service_list(self, updated, region):
        logger.debug("in _transform_service_list, s[0] = %s",
                     json.dumps(self.services[0]))
        try:
            svcs = {"services": [
                {"rsrcType": "service",
                 "label": s['binary'],
                 "enabled": True
                 if s['status'] == "enabled" else False,
                 "region": region,
                 "info": dict(s.items() + {
                     'last_update': updated}.items()),
                 "children": []}
                for s in self.services[0]['_source']['services']
            ]}
            _normalize_hostnames(['host'], svcs)
            return svcs['services']

        except Exception as e:
            logger.exception(e)
            return []

    def _transform_volume_list(self, updated, region):
        logger.debug("in _transform_volume_list, s[0] = %s",
                     json.dumps(self.volumes[0]))
        try:
            return [
                {"rsrcType": "volume",
                 "label": v['display_name'],
                 "enabled": True if not (v['status'] == 'error' or
                                         v['status'] == 'deleting') else False,
                 "region": region,
                 "info": dict(v.items() + {'last_update': updated}.items())
                }
                for v in self.volumes[0]['_source']['volumes']
            ]
        except Exception as e:
            logger.exception(e)
            return []

    def _build_region_tree(self):
        # TODO may be able to abstract by using params for the list of methods
        rl = [{"rsrcType": "region", "label": r} for r in
              self._get_service_regions().union(
                  self._get_volume_regions())]
        if len(rl) == 0:
            return {}

        updated = self.services[0]['_source']['@timestamp']
        region = self.services[0]['_source']['region']
        zl = self._get_zones(updated, region)
        sl = self._transform_service_list(updated, region)
        vl = self._transform_volume_list(updated, region)
        # combine services with zones at the host level when service[zone]
        # == zone[label] and service[childx][host] == zone[childy][label]
        # god help us all if it works...
        ad = {'sourceRsrcType': 'service',
              'targetRsrcType': 'host',
              'conditions': "%source%['zone'] == %target%['label'] and "
                            "%source_child%['host'] == %target_child%['label']"
        }
        sl = self._attach_resource(ad, sl, zl)





        for r in rl:
            children = []
            for s in sl:
                if s['region'] == r['label']:
                    children.append(s)
            if len(children) > 0:
                r['children'] = children

        for r in rl:
            for s in r['children']:
                del s['region']

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        else:
            return rl[0]

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()

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
        response = self._build_region_tree()
        if isinstance(response, HttpResponseBadRequest):
            return response

        if self.template_name is None:
            return HttpResponse(json.dumps(response),
                                content_type="application/json")

        return TemplateView.render_to_response(
            self, {'data': json.dumps(response)})
