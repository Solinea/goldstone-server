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

var NovaReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
            this.vmSpawnChartView.trigger('lookbackSelectorChanged');
            this.cpuResourcesChartView.trigger('lookbackSelectorChanged');
            this.memResourcesChartView.trigger('lookbackSelectorChanged');
            this.diskResourcesChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
        /*
        Nova Api Perf Report
        */

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova',
            urlBase: '/core/apiperf/summarize/'
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Nova API Performance"),
            collection: this.novaApiPerfChart,
            height: 350,
            el: '#nova-report-r1-c1',
            width: $('#nova-report-r1-c1').width(),
            yAxisLabel: goldstone.translate('Response Time (s)')
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
            el: '#nova-report-r1-c2',
            width: $('#nova-report-r1-c2').width(),
            yAxisLabel: goldstone.translate('Spawn Events')
        });

        /*
        CPU Resources Chart
        */

        this.cpuResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used']
        });

        this.cpuResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("CPU Resources"),
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
            chartTitle: goldstone.translate("Memory Resources"),
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
            chartTitle: goldstone.translate("Disk Resources"),
            collection: this.diskResourcesChart,
            featureSet: 'disk',
            height: 350,
            infoText: 'novaDiskResources',
            el: '#nova-report-r3-c1',
            width: $('#nova-report-r3-c1').width(),
            yAxisLabel: goldstone.translate('GB')
        });

        this.viewsToStopListening = [this.novaApiPerfChart, this.novaApiPerfChart, this.vmSpawnChart, this.vmSpawnChartView, this.cpuResourcesChart, this.cpuResourcesChartView, this.memResourcesChart, this.memResourcesChartView, this.diskResourcesChart, this.diskResourcesChartView];

    },

    template: _.template('' +

        // button selectors for metric viewers
        '<div class="btn-group" role="group">' +
        '<a href="#metrics/nova_report"><button type="button" data-title="Log Browser" class="active headerBar servicesButton btn btn-default"><%=goldstone.translate(\'Compute\')%></button></a>' +
        '<a href="#metrics/api_perf"><button type="button" data-title="Event Browser" class="headerBar reportsButton btn btn-default"><%=goldstone.translate(\'API Performance\')%></button></a>' +
        '<a href="#metrics/metric_report"><button type="button" data-title="Metric Browser" class="headerBar reportsButton btn btn-default"><%=goldstone.translate(\'Metric Report\')%></button></a>' +
        '</div><br><br>' +

        '<div id="nova-report-r1" class="row">' +
        '<div id="nova-report-r1-c1" class="col-md-6"></div>' +
        '<div id="nova-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="nova-report-r2" class="row">' +
        '<div id="nova-report-r2-c1" class="col-md-6"></div>' +
        '<div id="nova-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="nova-report-r3" class="row">' +
        '<div id="nova-report-r3-c1" class="col-md-6"></div>' +
        '<div id="nova-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
