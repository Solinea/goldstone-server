/**
 * Copyright 2014 Solinea, Inc.
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
 * Author: John Stanford
 */

var renderCharts = function() {

    //----------------------------
    // instantiate charts via
    // backbone collection / views


    //---------------------------
    // instantiate event timeline chart

    var eventTimelineChart = new EventTimelineCollection({
        url: "/logging/nodes"
    });

    var eventTimelineChartView = new EventTimelineView({
        collection: eventTimelineChart,
        h: {"main": 450, "swim": 50},
        location: '#goldstone-discover-r1-c1',
        chartTitle: 'Event Timeline',
        width: $('#goldstone-discover-r1-c1').width()
    });

    var nodeAvailChart = new NodeAvailCollection({
        url: "/logging/nodes"
    });

    var nodeAvailChartView = new NodeAvailView({
        collection: nodeAvailChart,
        h: {"main": 450, "swim": 50},
        location: '#goldstone-discover-r2-c2',
        chartTitle: 'Node Availability',
        width: $('#goldstone-discover-r2-c2').width()
    });



};
