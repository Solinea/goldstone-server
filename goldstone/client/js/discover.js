/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Alex Jacobs
 */

var renderCharts = function() {
    var self = this;

    //----------------------------
    // instantiate charts via
    // backbone collection / views

    // hide global lookbacks if only rendering discover nav

    new GlobalLookbackRefreshButtonsView({
        el: ".global-range-refresh-container"
    });

    //---------------------------
    // instantiate event timeline chart

    // fetch url is set in eventTimelineCollection
    var eventTimelineChart = new EventTimelineCollection({});

    var eventTimelineChartView = new EventTimelineView({
        collection: eventTimelineChart,
        el: '#goldstone-discover-r1-c1',
        chartTitle: 'Event Timeline',
        width: $('#goldstone-discover-r1-c1').width()
    });

    //---------------------------
    // instantiate Node Availability chart

    var nodeAvailChart = new NodeAvailCollection({
        url: "/logging/nodes?page_size=100"
    });

    var nodeAvailChartView = new NodeAvailView({
        collection: nodeAvailChart,
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

    // var zoomableTree = new ZoomablePartitionCollection({
    // });

    var zoomableTreeView = new ZoomablePartitionView({
        blueSpinnerGif: blueSpinnerGif,
        chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverZoomTopology'],
        // collection: zoomableTree,
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

};
