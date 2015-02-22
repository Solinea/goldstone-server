/**
 * Copyright 2014 - 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// view is linked to collection when instantiated in goldstone_discover.html

/*
standard chart usage. instantiate with:
{
    blueSpinnerGif: blueSpinnerGif,
    chartHeader: [ location of chart, title of chart, key for 'infoText'],
    collection: collection name (don't included this unless it's fetching via a collection, use data instead)
    data: data, (only used if data is served by django)
    el: chart location,
    frontPage: false, (prevents redirect upon clicking leaves)
    h: 600,
    leafDataUrls: keys/values,
    multiRsrcViewEl: where to put the 'resource list' chart
    width: $(selected el).width()
}
*/

var ZoomablePartitionView = TopologyTreeView.extend({

    defaults: {},

    initSvg: function() {
        var self = this;
        var ns = this.defaults;

        // ns.h = 600;
        ns.x = d3.scale.linear().range([0, ns.w]);
        ns.y = d3.scale.linear().range([0, ns.h]);

        ns.vis = d3.select(self.el).append("div")
            .attr("class", "chart")
            .style("width", ns.w + "px")
            .style("height", ns.h + "px")
            .append("svg:svg")
            .attr("width", ns.w)
            .attr("height", ns.h);

        ns.partition = d3.layout.partition()
            .value(function(d) {
                // set to constant for even sizing of nodes
                // this was originally set to d.size
                return 1;
            });
    },

    update: function() {
        var ns = this.defaults;
        var self = this;

        // keep in case data is fed by collection:
        // var root = this.collection.toJSON()[0];
        var root = ns.data;

        var g = ns.vis.selectAll("g")
            .data(ns.partition.nodes(root))
            .enter().append("svg:g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.y) + "," + ns.y(d.x) + ")";
            })
            .on("click", click);

        var kx = ns.w / root.dx,
            ky = ns.h / 1;

        g.append("svg:rect")
            .attr("width", root.dy * kx)
            .attr("height", function(d) {
                return d.dx * ky;
            })
            .attr("class", function(d) {
                return d.children ? "parent " + (d.rsrcType || "cloud") + "-icon" : "child" + (d.rsrcType || "cloud") + "-icon";
            })
            .attr("fill", function(d) {
                // return d.children ? "#eee" : "#ddd";
                return "#eee";
            })
            .attr("cursor", function(d) {
                return d.children ? "pointer" : "default";
            })
            .attr({
                "stroke": '#777'
            })
            .attr({
                "fill-opacity": 0.8
            });

        g.append("svg:text")
            .attr("transform", transform)
            .attr("x", 5)
            .attr("dy", ".35em")
            .style("opacity", function(d) {
                return d.dx * ky > 12 ? 1 : 0;
            })
            .text(function(d) {
                return d.label;
            })
            .attr({
                'font-size': '12px'
            })
            .attr({
                'pointer-events': 'none'
            });

        function imgFile(icon) {
            return "/static/images/" + icon + ".svg";
        }

        var iconMap = {
            icon_backup: ['backups-leaf', 'snapshots-leaf'],
            icon_cloud: ['cloud', 'region'],
            icon_endpoint: ['endpoints-leaf'],
            icon_host: ['host', 'hosts-leaf', 'hypervisors-leaf',
                'servers-leaf'
            ],
            icon_image: ['images-leaf'],
            icon_module: ['module', 'secgroups-leaf'],
            icon_role: ['roles-leaf'],
            icon_service: ['service', 'services-leaf'],
            icon_tenant: ['tenants-leaf'],
            icon_types: ['volume-types-leaf'],
            icon_user: ['users-leaf'],
            icon_volume: ['volume', 'volumes-leaf'],
            icon_vol_transfer: ['agents-leaf', 'transfers-leaf'],
            icon_zone: ['zone', 'aggregates-leaf', 'cloudpipes-leaf',
                'flavors-leaf', 'floating-ip-pools-leaf', 'networks-leaf'
            ]
        };

        g.append("svg:image")
            .attr('x', 2)
            .attr('y', function(d) {
                return (d.dx * ky / 2) - 10;
            })
            .attr('width', 20)
            .attr('height', 20)
            .style("opacity", function(d) {
                return d.dx * ky > 12 ? 1 : 0;
            })
            .attr('xlink:href', function(d) {
                var finalIcon;
                _.each(iconMap, function(classes, icon) {
                    if (classes.indexOf(d.rsrcType) !== -1) {
                        finalIcon = icon;
                    }
                });
                return imgFile(finalIcon);
            });

        d3.select(self.el)
            .on("click", function() {
                click(root);
            });

        function click(d) {
            if (!d.children) {

                // for appending to resource chart header
                var origClickedLabel = d.label;

                if (d.rsrcType.match(/-leaf$/) && ns.leafDataUrls !== undefined) {
                    var url = ns.leafDataUrls[d.rsrcType];
                    if (url !== undefined) {
                        var hasParam = false;
                        if (d.hasOwnProperty('region')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "region=" + d.region;
                        }
                        if (d.hasOwnProperty('zone')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "zone=" + d.zone;
                        }

                        // prepend zone to url:
                        var parentModule;
                        // traverse up the tree until the
                        // parent module is reached
                        while (d.rsrcType !== 'module') {
                            d = d.parent;
                        }
                        parentModule = d.label;

                        if (self.overrideSets[d.label]) {
                            ns.filterMultiRsrcDataOverride = self.overrideSets[d.label];
                        } else {
                            ns.filterMultiRsrcDataOverride = null;
                        }

                        url = "/" + parentModule + url;

                        self.loadLeafData(url);
                        self.appendLeafNameToResourceHeader(origClickedLabel);
                    }

                }

                d3.event.stopPropagation();
                return;
            }

            kx = (d.y ? ns.w - 40 : ns.w) / (1 - d.y);
            ky = ns.h / d.dx;
            ns.x.domain([d.y, 1]).range([d.y ? 40 : 0, ns.w]);
            ns.y.domain([d.x, d.x + d.dx]);

            var t = g.transition()
                .duration(d3.event.altKey ? 2500 : 750)
                .attr("transform", function(d) {
                    return "translate(" + ns.x(d.y) + "," + ns.y(d.x) + ")";
                });

            t.select("rect")
                .attr("width", d.dy * kx)
                .attr("height", function(d) {
                    return d.dx * ky;
                });

            t.select("text")
                .attr("transform", transform)
                .style("opacity", function(d) {
                    return d.dx * ky > 12 ? 1 : 0;
                });

            t.select("image")
                .style("opacity", function(d) {
                    return d.dx * ky > 12 ? 1 : 0;
                })
                .attr('x', 2)
                .attr('y', function(d) {
                    return (d.dx * ky / 2) - 10;
                });

            d3.event.stopPropagation();
        }

        function transform(d) {
            return "translate(22," + d.dx * ky / 2 + ")";
        }

    },

    overrideSets: {
        // works with filterMultiRsrcData method in topologyTreeView
        // these params will be omitted from the returned data before
        // rendering as a data table in 'resource list'

        nova: ['@timestamp',
            'metadata',
            'region',
            'links',
            'swap',
            'rxtx_factor',
            'OS-FLV-EXT-DATA:ephemeral',
            'service',
            'cpu_info',
            'hypervisor_version',
            'bridge',
            'bridge_interface',
            'broadcast',
            'cidr_v6',
            'deleted',
            'deleted_at',
            'dhcp_start',
            'dns1',
            'dns2',
            'gateway_v6',
            'host',
            'injected',
            'multi_host',
            'netmask_v6',
            'priority',
            'region',
            'rxtx_base',
            'vpn_private_address',
            'vpn_public_address',
            'vpn_public_port',
            'accessIPv4',
            'accessIPv6',
            'addresses',
            'config_drive',
            'flavor',
            'hostId',
            'image',
            'key_name',
            'links',
            'metadata',
            'OS-DCF:diskConfig',
            'OS-EXT-AZ:availability_zone',
            'OS-EXT-SRV-ATTR:hypervisor_hostname',
            'OS-EXT-STS:power_state',
            'OS-EXT-STS:task_state',
            'OS-EXT-STS:vm_state',
            'os-extended-volumes:volumes_attached',
            'OS-SRV-USG:launched_at',
            'OS-SRV-USG:terminated_at',
            'progress',
            'region',
            'security_groups',
            'rules'
        ],
        cinder: ['@timestamp',
            'metadata',
            'region',
            'extra_specs',
            'display_description',
            'os-extended-snapshot-attributes:progress',
            'links',
            'attachments',
            'availability_zone',
            'os-vol-mig-status-attr:migstat',
            'os-vol-mig-status-attr:name_id',
            'snapshot_id',
            'source_volid'
        ],
        keystone: ['@timestamp'],
        glance: ['@timestamp',
            'metadata',
            'region',
            'tags',
            'checksum',
            'owner',
            'schema',
            'file'
        ]
    },

    template: null

});
