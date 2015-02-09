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

var NovaReportView = ApiPerfReportView.extend({

    triggerChange: function() {
        this.novaApiPerfChartView.trigger('selectorChanged');
        this.vmSpawnChartView.trigger('selectorChanged');
    },

    renderCharts: function() {
        // TODO: implement cpu / mem / disk charts

        /*
        Nova Api Perf Report
        */

        this.novaApiPerfChart = new ApiPerfCollection({
            urlPrefix: 'nova',
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: '#nova-report-r1-c1',
            width: $('#nova-report-r1-c1').width()
        });


        /*
        VM Spawns Chart
        */

        this.vmSpawnChart = new StackedBarChartCollection({
            urlPrefix: '/nova/hypervisor/spawns',
            render: false
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

        // PLACEHOLDERS
        new ChartHeaderView({
            el: "#nova-report-r2-c1",
            chartTitle: "CPU Resources",
            infoText: "novaCpuResources"
        });

        new ChartHeaderView({
            el: "#nova-report-r2-c2",
            chartTitle: "Mem Resources",
            infoText: "novaMemResources"
        });

        new ChartHeaderView({
            el: "#nova-report-r3-c1",
            chartTitle: "Disk Resources",
            infoText: "novaDiskResources"
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
        '</div>' +
        // TODO: remove breaks after charts are instantiated
        '<br><br><br><br><br>'
    )

});
