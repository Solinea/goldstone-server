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
            this.serviceStatusChartView.trigger('lookbackSelectorChanged');
            this.cpuResourcesChartView.trigger('lookbackSelectorChanged');
            this.memResourcesChartView.trigger('lookbackSelectorChanged');
            this.diskResourcesChartView.trigger('lookbackSelectorChanged');
            this.vmSpawnChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        /*
        Service Status Chart
        */

        this.serviceStatusChart = new ServiceStatusCollection({
            urlBase: 'hi'
        });

        this.serviceStatusChartView = new ServiceStatusView({
            chartTitle: goldstone.translate("Service Status"),
            collection: this.serviceStatusChart,
            height: 350,
            el: '#discover-view-r1-c1',
            width: $('#discover-view-r1-c1').width()
        });

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
            el: '#discover-view-r2-c1',
            width: $('#discover-view-r2-c1').width(),
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
            el: '#discover-view-r2-c2',
            width: $('#discover-view-r2-c2').width(),
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
            el: '#discover-view-r2-c3',
            width: $('#discover-view-r2-c3').width(),
            yAxisLabel: goldstone.translate('GB')
        });

        /*
        VM Spawns Chart
        */

        this.vmSpawnChart = new SpawnsCollection({
            urlBase: '/nova/hypervisor/spawns/'
        });

        this.vmSpawnChartView = new SpawnsView({
            chartTitle: goldstone.translate("VM Spawns"),
            collection: this.vmSpawnChart,
            height: 350,
            infoText: 'novaSpawns',
            el: '#discover-view-r2-c4',
            width: $('#discover-view-r2-c4').width(),
            yAxisLabel: goldstone.translate('Spawn Events')
        });

    },

    template: _.template('' +
        '<div class="row first-row">' +

        /* beginning of service status mock up */
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
        /* end of service status mock-up */

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

        // service status
        '<div class="row">' +
        '<div id="discover-view-r1" class="row">' +
        '<div id="discover-view-r1-c1" class="col-md-4"></div>' +
        '</div>' +

        // cpu / mem / disk
        '<div class="row">' +
        '<h4>Resource Usage</h4>' +
        '<div id="discover-view-r2" class="row">' +
        '<div id="discover-view-r2-c1" class="col-md-3"></div>' +
        '<div id="discover-view-r2-c2" class="col-md-3"></div>' +
        '<div id="discover-view-r2-c3" class="col-md-3"></div>' +
        '<div id="discover-view-r2-c4" class="col-md-3"></div>' +
        '</div>'
    )

});
