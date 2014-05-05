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
from goldstone.utils import _is_ip_addr, _partition_hostname, _resolve_fqdn, \
    _resolve_addr, _host_details

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
            base_hosts = []
            for h in hosts:
                if _is_ip_addr(h):
                    # try to resolve the hostname
                    hn = _resolve_fqdn(h)
                    if hn:
                        base_hosts.append({
                            "rsrcType": "host",
                            "label": hn['hostname'],
                            "info": {
                                "last_update": updated,
                                "ip_addr": h
                            }})
                    else:
                        base_hosts.append({
                            "rsrcType": "host",
                            "label": h,
                            "info": {
                                "last_update": updated,
                                "hostname": "unresolved"
                            }})
                else:
                    addr = _resolve_addr(h)

                    base_hosts.append({
                        "rsrcType": "host",
                        "label": _partition_hostname(h)['hostname'],
                        "info": {
                            "last_update": updated,
                            "ip_addr": addr if addr else "unresolved"
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

    def _transform_service_list(self):
        logger.debug("in _transform_service_list, s[0] = %s",
                     json.dumps(self.services[0]))
        try:
            updated = self.services[0]['_source']['@timestamp']
            region = self.services[0]['_source']['region']
            zones = self._get_zones(updated, region)

            # want to weave services in as children of a host in a zone
            for z in zones:
                for h in z['children']:
                    children = []
                    host_details = _host_details(h['label'])

                    h_ip_addr = host_details.get('ip_addr', None)
                    h_name = host_details.get('hostname', None)
                    h_fqdn = h_name + "." + host_details.get('domainname', '')
                    host_match_options = [
                        n for n in [h_ip_addr, h_name, h_fqdn] if n
                    ]

                    for s in self.services[0]['_source']['services']:
                        if s['zone'] == z['label'] and \
                           (s['host'] in host_match_options):
                            children.append(
                                {"rsrcType": "service",
                                 "label": s['binary'],
                                 "enabled": True
                                 if s['status'] == "enabled" else False,
                                 "region": region,
                                 "info": dict(s.items() + {
                                     'last_update': updated}.items())})
                    h['children'] = children

            return zones
        except Exception as e:
            logger.exception(e)
            return []

    def _transform_image_list(self):
        logger.debug("in _transform_image_list, s[0] = %s",
                     json.dumps(self.images[0]))
        try:
            updated = self.images[0]['_source']['@timestamp']
            region = self.images[0]['_source']['region']
            return [
                {"rsrcType": "service",
                 "label": s['name'],
                 "enabled": True if s['status'] == 'active' else False,
                 "region": region,
                 "info": {
                     'id': s['id'],
                     'name': s['name'],
                     'tags': s['tags'],
                     'container_format': s['container_format'],
                     'disk_format': s['disk_format'],
                     'protected': s['protected'],
                     'size': s['size'],
                     'checksum': s['checksum'],
                     'min_disk': s['min_disk'],
                     'min_ram': s['min_ram'],
                     'created_at': s['created_at'],
                     'updated_at': s['updated_at'],
                     'visibility': s['visibility'],
                     'owner': s['owner'],
                     'file': s['file'],
                     'schema': s['schema'],
                     "last_update": updated

                 }} for s in self.images[0]['_source']['images']
            ]
        except Exception as e:
            logger.exception(e)
            return []

    def _map_service_children(self):
        """
        use the service ID of the endpoint to append a child to the list
        of service children.
        """
        sl = self._transform_service_list()
        el = self._transform_volume_list()

        for s in sl:
            children = []
            for e in el:
                if e['service_id'] == s['info']['id']:
                    children.append(e)
            if len(children) > 0:
                s['children'] = children

        for s in sl:
            for e in s['children']:
                e['label'] = s['label']
                del e['service_id']

        return sl

    def _build_region_tree(self):
        # TODO may be able to abstract by using params for the list of methods
        rl = [{"rsrcType": "region", "label": r} for r in
              self._get_service_regions().union(
                  self._get_volume_regions())]
        if len(rl) == 0:
            return {}

        sl = self._map_service_children()

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
