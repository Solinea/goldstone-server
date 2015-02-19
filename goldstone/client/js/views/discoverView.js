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

var DiscoverView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {

    },

    renderCharts: function() {

        //---------------------------
        // instantiate event timeline chart

        // fetch url is set in eventTimelineCollection
        this.eventTimelineChart = new EventTimelineCollection({});

        this.eventTimelineChartView = new EventTimelineView({
            collection: this.eventTimelineChart,
            el: '#goldstone-discover-r1-c1',
            chartTitle: 'Event Timeline',
            width: $('#goldstone-discover-r1-c1').width()
        });

        //---------------------------
        // instantiate Node Availability chart

        this.nodeAvailChart = new NodeAvailCollection({
            url: "/logging/nodes?page_size=100"
        });

        this.nodeAvailChartView = new NodeAvailView({
            collection: this.nodeAvailChart,
            h: {
                "main": 150,
                "swim": 50
                // "main": 450,
                // "swim": 50
            },
            el: '#goldstone-discover-r1-c2',
            chartTitle: 'Node Availability',
            width: $('#goldstone-discover-r2-c2').width()
        });


        //---------------------------
        // instantiate Zoomable Tree chart

        // collection ready if tree data becomes api-driven

        // this.zoomableTree = new ZoomablePartitionCollection({
        // });

        this.zoomableTreeView = new ZoomablePartitionView({
            blueSpinnerGif: blueSpinnerGif,
            chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverZoomTopology'],
            // collection: this.zoomableTree,
            data: data,
            el: '#goldstone-discover-r2-c1',
            frontPage: false,
            h: 600,
            leafDataUrls: {
                "services-leaf": "/services",
                "endpoints-leaf": "/endpoints",
                "roles-leaf": "/roles",
                "users-leaf": "/users",
                "tenants-leaf": "/tenants",
                "agents-leaf": "/agents",
                "aggregates-leaf": "/aggregates",
                "availability-zones-leaf": "/availability_zones",
                "cloudpipes-leaf": "/cloudpipes",
                "flavors-leaf": "/flavors",
                "floating-ip-pools-leaf": "/floating_ip_pools",
                "hosts-leaf": "/hosts",
                "hypervisors-leaf": "/hypervisors",
                "networks-leaf": "/networks",
                "secgroups-leaf": "/security_groups",
                "servers-leaf": "/servers",
                "images-leaf": "/images",
                "volumes-leaf": "/volumes",
                "backups-leaf": "/backups",
                "snapshots-leaf": "/snapshots",
                "transfers-leaf": "/transfers",
                "volume-types-leaf": "/volume_types"
            },
            multiRsrcViewEl: '#goldstone-discover-r2-c2',
            width: $('#goldstone-discover-r2-c1').width()
        });
    },

    template: _.template('' +
        '<div id="goldstone-discover-r1" class="row">' +
        '<div id="goldstone-discover-r1-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="goldstone-discover-r2" class="row">' +
        '<div id="goldstone-discover-r2-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r2-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
