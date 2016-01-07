/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DiscoverView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.cpuResourcesChartView.trigger('lookbackSelectorChanged');
            this.memResourcesChartView.trigger('lookbackSelectorChanged');
            this.diskResourcesChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        /*
        CPU Resources Chart
        */

        this.cpuResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used']
        });

        this.cpuResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("CPU"),
            collection: this.cpuResourcesChart,
            featureSet: 'cpu',
            height: 350,
            infoText: 'novaCpuResources',
            el: '#nova-report-r2-c1',
            width: $('#nova-report-r2-c1').width(),
            yAxisLabel: goldstone.translate('Cores')
        });

        /*
        Mem Resources Chart
        */

        this.memResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.memory_mb', 'nova.hypervisor.memory_mb_used']
        });

        this.memResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("Memory"),
            collection: this.memResourcesChart,
            featureSet: 'mem',
            height: 350,
            infoText: 'novaMemResources',
            el: '#nova-report-r2-c2',
            width: $('#nova-report-r2-c2').width(),
            yAxisLabel: goldstone.translate('MB')
        });

        /*
        Disk Resources Chart
        */

        this.diskResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.local_gb', 'nova.hypervisor.local_gb_used']
        });

        this.diskResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("Storage"),
            collection: this.diskResourcesChart,
            featureSet: 'disk',
            height: 350,
            infoText: 'novaDiskResources',
            el: '#nova-report-r2-c3',
            width: $('#nova-report-r2-c3').width(),
            yAxisLabel: goldstone.translate('GB')
        });

        //---------------------------
        // instantiate event timeline chart

        // fetch url is set in eventTimelineCollection

        /*this.eventTimelineChart = new EventTimelineCollection({});

        this.eventTimelineChartView = new EventTimelineView({
            collection: this.eventTimelineChart,
            el: '#goldstone-discover-r1-c1',
            chartTitle: goldstone.translate('Event Timeline'),
            width: $('#goldstone-discover-r1-c1').width()
        });*/

        //---------------------------
        // instantiate Node Availability chart

        /*        this.nodeAvailChart = new NodeAvailCollection({});

        this.nodeAvailChartView = new NodeAvailView({
            chartTitle: goldstone.translate('Node Availability'),
            collection: this.nodeAvailChart,
            el: '#goldstone-discover-r1-c2',
            h: {
                "main": 150,
                "swim": 50
            },
            width: $('#goldstone-discover-r1-c2').width()
        });
*/

        //---------------------------
        // instantiate Cloud Topology chart

        /*        this.discoverTreeCollection = new TopologyTreeCollection({});

        this.topologyTreeView = new TopologyTreeView({
            blueSpinnerGif: blueSpinnerGif,
            collection: this.discoverTreeCollection,
            chartHeader: ['#goldstone-discover-r2-c1', goldstone.translate('Cloud Topology'),
                'discoverCloudTopology'
            ],
            el: '#goldstone-discover-r2-c1',
            h: 600,
            leafDataUrls: this.leafDataUrls,
            multiRsrcViewEl: '#goldstone-discover-r2-c2',
            width: $('#goldstone-discover-r2-c2').width(),
        });
*/
    },

    template: _.template('' +
        // orig
        // '<div id="goldstone-discover-r1" class="row">' +
        // '<div id="goldstone-discover-r1-c1" class="col-md-6"></div>' +
        // '<div id="goldstone-discover-r1-c2" class="col-md-6"></div>' +
        // '</div>' +

        // '<div id="goldstone-discover-r2" class="row">' +
        // '<div id="goldstone-discover-r2-c1" class="col-md-6"></div>' +
        // '<div id="goldstone-discover-r2-c2" class="col-md-6"></div>' +
        // '</div>' +

        // '<div class="row"><br><br></div>'


        // new
        '<div class="row first-row">' +
        '<div class="single-block service-status">' +
        '<h3>Service Status<i class="setting-btn">&nbsp;</i></h3>' +
        '<ul class="service-status-table shadow-block">' +
        '<li class="table-header">' +
        '<span class="service">Service</span>' +
        '<span class="sf">Sf</span>' +
        '<span class="nm">Nm</span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Compute</span>' +
        '<span class="sf"><i class="online">&nbsp;</i></span>' +
        '<span class="nm"><i class="online">&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Image</span>' +
        '<span class="sf"><i class="offline">&nbsp;</i></span>' +
        '<span class="nm"><i class="offline">&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Network</span>' +
        '<span class="sf"><i class="online">&nbsp;</i></span>' +
        '<span class="nm"><i class="online">&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Block Storage</span>' +
        '<span class="sf"><i class="online">&nbsp;</i></span>' +
        '<span class="nm"><i class="online">&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Object Storage</span>' +
        '<span class="sf"><i class="intermittent">&nbsp;</i></span>' +
        '<span class="nm"><i class="intermittent">&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Orchestration</span>' +
        '<span class="sf"><i class="online">&nbsp;</i></span>' +
        '<span class="nm"><i class="online">&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Identity</span>' +
        '<span class="sf"><i class="online">&nbsp;</i></span>' +
        '<span class="nm"><i class="online">&nbsp;</i></span>' +
        '</li>' +
        '</ul>' +
        '</div>' +
        '<div class="double-block metrics-overview">' +
        '<h3>Metrics Overview<i class="setting-btn">&nbsp;</i></h3>' +
        '<div class="map-block shadow-block">' +
        '<div class="map"><img src="/static/images/Chart-Metrics-Overview.jpg" alt +=""></div>' +
        '<div class="map-data">' +
        '<span class="stats time">' +
        '21 secs ago' +
        '</span>' +
        '<span class="stats logs">' +
        '300 Logs' +
        '</span>' +
        '<span class="stats events">' +
        '17 Events' +
        '</span>' +
        '<span class="stats call">' +
        '12 API Calls' +
        '</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row second-row">' +
        '<div class="single-block service-status">' +
        '<h3>Node Presence<i class="setting-btn">&nbsp;</i></h3>' +
        '<div class="node-block shadow-block">' +
        '<ul class="node-list">' +
        '<li class="node color1"></li>' +
        '<li class="node color2"></li>' +
        '<li class="node color3"></li>' +
        '<li class="node color4"></li>' +
        '<li class="node color5"></li>' +
        '<li class="node color6"></li>' +
        '<li class="node color7"></li>' +
        '<li class="node color8"></li>' +
        '<li class="node color9"></li>' +
        '<li class="node color10"></li>' +
        '<li class="node color11"></li>' +
        '<li class="node color12"></li>' +
        '<li class="node color13"></li>' +
        '<li class="node color14"></li>' +
        '<li class="node color15"></li>' +
        '<li class="node color16"></li>' +
        '<li class="node color17"></li>' +
        '<li class="node color18"></li>' +
        '<li class="node color19"></li>' +
        '<li class="node color20"></li>' +
        '<li class="node color21"></li>' +
        '<li class="node color22"></li>' +
        '<li class="node color23"></li>' +
        '<li class="node color24"></li>' +
        '<li class="node color25"></li>' +
        '<li class="node color26"></li>' +
        '<li class="node color27"></li>' +
        '<li class="node color28"></li>' +
        '<li class="node color29"></li>' +
        '<li class="node color30"></li>' +
        '<li class="node color31"></li>' +
        '<li class="node color32"></li>' +
        '<li class="node color33"></li>' +
        '<li class="node color34"></li>' +
        '<li class="node color35"></li>' +
        '<li class="node color36"></li>' +
        '<li class="node color37"></li>' +
        '<li class="node color38"></li>' +
        '<li class="node color39"></li>' +
        '<li class="node color40"></li>' +
        '<li class="node color41"></li>' +
        '<li class="node color42"></li>' +
        '<li class="node color43"></li>' +
        '<li class="node color44"></li>' +
        '<li class="node color45"></li>' +
        '<li class="node color46"></li>' +
        '<li class="node color47"></li>' +
        '<li class="node color48"></li>' +
        '<li class="node color49"></li>' +
        '<li class="node color50"></li>' +
        '<li class="node color51"></li>' +
        '<li class="node color52"></li>' +
        '<li class="node color53"></li>' +
        '<li class="node color54"></li>' +
        '<li class="node color55"></li>' +
        '<li class="node color56"></li>' +
        '<li class="node color57"></li>' +
        '<li class="node color58"></li>' +
        '<li class="node color59"></li>' +
        '<li class="node color60"></li>' +
        '<li class="node color61"></li>' +
        '<li class="node color62"></li>' +
        '<li class="node color63"></li>' +
        '<li class="node color64"></li>' +
        '<li class="node color65"></li>' +
        '<li class="node color66"></li>' +
        '<li class="node color67"></li>' +
        '<li class="node color68"></li>' +
        '<li class="node color69"></li>' +
        '<li class="node color70"></li>' +
        '<li class="node color71"></li>' +
        '<li class="node color72"></li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '<div class="single-block service-status">' +
        '<h3>Logs by Type<i class="setting-btn">&nbsp;</i></h3>' +
        '<div class="full-map shadow-block">' +
        '<img src="/static/images/Chart-Logs-by-Type.jpg" alt="">' +
        '</div>' +
        '</div>' +
        '<div class="single-block service-status">' +
        '<h3>Average API Performance<i class="setting-btn">&nbsp;</i></h3>' +
        '<div class="full-map shadow-block">' +
        '<img src="/static/images/API-Performance.jpg" alt="">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row">' +
        '<h4>Resource Usage</h4>' +
        // '<div class="single-block service-status">' +
        // '<h3>CPU<i class="setting-btn">&nbsp;</i></h3>' +
        // '<div class="full-map shadow-block">' +
        // '<img src="/static/images/Chart-CPU.jpg" alt="">' +
        // '</div>' +
        // '</div>' +
        // '<div class="single-block service-status">' +
        // '<h3>Memory<i class="setting-btn">&nbsp;</i></h3>' +
        // '<div class="full-map shadow-block">' +
        // '<img src="/static/images/Chart-Memory.jpg" alt="">' +
        // '</div>' +
        // '</div>' +
        // '<div class="single-block service-status">' +
        // '<h3>Storage<i class="setting-btn">&nbsp;</i></h3>' +
        // '<div class="full-map shadow-block">' +
        // '<img src="/static/images/Chart-Disk.jpg" alt="">' +
        // '</div>' +
        // '</div>' +

        // add nova report cpu/mem/storage

        '<div id="nova-report-r2" class="row">' +
        '<div id="nova-report-r2-c1" class="col-md-4"></div>' +
        '<div id="nova-report-r2-c2" class="col-md-4"></div>' +
        '<div id="nova-report-r2-c3" class="col-md-4"></div>' +
        '</div>'
    )

});
