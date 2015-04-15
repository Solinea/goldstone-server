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
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#nova-report-r1-c1',
            width: $('#nova-report-r1-c1').width()
        });

        /*
        VM Spawns Chart
        */

        this.vmSpawnChart = new StackedBarChartCollection({
            urlPrefix: '/nova/hypervisor/spawns'
        });

        this.vmSpawnChartView = new StackedBarChartView({
            chartTitle: "VM Spawns",
            collection: this.vmSpawnChart,
            height: 300,
            infoCustom: 'novaSpawns',
            el: '#nova-report-r1-c2',
            width: $('#nova-report-r1-c2').width(),
            yAxisLabel: 'Spawn Events'
        });

        /*
        CPU Resources Chart
        */

        this.cpuResourcesChart = new CpuResourceCollection({
            urlPrefix: '/core/metrics'
        });

        this.cpuResourcesChartView = new StackedBarChartView({
            chartTitle: "CPU Resources",
            collection: this.cpuResourcesChart,
            featureSet: 'cpu',
            height: 300,
            infoCustom: 'novaCpuResources',
            el: '#nova-report-r2-c1',
            width: $('#nova-report-r2-c1').width(),
            yAxisLabel: 'Cores'
        });

        /*
        Mem Resources Chart
        */

        this.memResourcesChart = new MemResourceCollection({
            urlPrefix: '/core/metrics'
        });

        this.memResourcesChartView = new StackedBarChartView({
            chartTitle: "Memory Resources",
            collection: this.memResourcesChart,
            featureSet: 'mem',
            height: 300,
            infoCustom: 'novaMemResources',
            el: '#nova-report-r2-c2',
            width: $('#nova-report-r2-c2').width(),
            yAxisLabel: 'MB'
        });

        /*
        Disk Resources Chart
        */

        this.diskResourcesChart = new DiskResourceCollection({
            urlPrefix: '/nova/hypervisor/disk'
        });

        this.diskResourcesChartView = new StackedBarChartView({
            chartTitle: "Disk Resources",
            collection: this.diskResourcesChart,
            featureSet: 'disk',
            height: 300,
            infoCustom: 'novaDiskResources',
            el: '#nova-report-r3-c1',
            width: $('#nova-report-r3-c1').width(),
            yAxisLabel: 'GB'
        });

    },

    template: _.template('' +
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
