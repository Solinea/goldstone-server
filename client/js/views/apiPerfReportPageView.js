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

var ApiPerfReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
            this.neutronApiPerfChartView.trigger('lookbackSelectorChanged');
            this.keystoneApiPerfChartView.trigger('lookbackSelectorChanged');
            this.glanceApiPerfChartView.trigger('lookbackSelectorChanged');
            this.cinderApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        //----------------------------
        // instantiate charts via
        // backbone collection / views


        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova',
            urlBase: '/core/api-calls/'
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Nova API Performance"),
            collection: this.novaApiPerfChart,
            height: 350,
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });


        //------------------------------
        // instantiate neutron api chart

        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron',
            urlBase: '/core/api-calls/'
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Neutron API Performance"),
            collection: this.neutronApiPerfChart,
            height: 350,
            el: '#api-perf-report-r1-c2',
            width: $('#api-perf-report-r1-c2').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        //-------------------------------
        // instantiate keystone api chart

        this.keystoneApiPerfChart = new ApiPerfCollection({
            componentParam: 'keystone',
            urlBase: '/core/api-calls/'
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Keystone API Performance"),
            collection: this.keystoneApiPerfChart,
            height: 350,
            el: '#api-perf-report-r2-c1',
            width: $('#api-perf-report-r2-c1').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        //-----------------------------
        // instantiate glance api chart

        this.glanceApiPerfChart = new ApiPerfCollection({
            componentParam: 'glance',
            urlBase: '/core/api-calls/'
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Glance API Performance"),
            collection: this.glanceApiPerfChart,
            height: 350,
            el: '#api-perf-report-r2-c2',
            width: $('#api-perf-report-r2-c2').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        //-----------------------------
        // instantiate cinder api chart

        this.cinderApiPerfChart = new ApiPerfCollection({
            componentParam: 'cinder',
            urlBase: '/core/api-calls/'
        });

        this.cinderApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Cinder API Performance"),
            collection: this.cinderApiPerfChart,
            height: 350,
            el: '#api-perf-report-r3-c1',
            width: $('#api-perf-report-r3-c1').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        this.viewsToStopListening = [this.novaApiPerfChart, this.novaApiPerfChartView, this.neutronApiPerfChart, this.neutronApiPerfChartView, this.keystoneApiPerfChart, this.keystoneApiPerfChartView, this.glanceApiPerfChart, this.glanceApiPerfChartView, this.cinderApiPerfChart, this.cinderApiPerfChartView];

    },

    template: _.template('' +

        // button selectors for metric viewers
        '<div class="btn-group" role="group">' +
        '<a href="#metrics/nova_report"><button type="button" data-title="Log Browser" class="headerBar servicesButton btn btn-default"><%=goldstone.translate(\'Compute\')%></button></a>' +
        '<a href="#metrics/api_perf"><button type="button" data-title="Event Browser" class="active headerBar reportsButton btn btn-default"><%=goldstone.translate(\'API Performance\')%></button></a>' +
        '<a href="#metrics/metric_report"><button type="button" data-title="Metric Browser" class="headerBar reportsButton btn btn-default"><%=goldstone.translate(\'Metric Report\')%></button></a>' +
        '</div><br><br>' +

        '<div id="api-perf-report-r1" class="row">' +
        '<div id="api-perf-report-r1-c1" class="col-md-6"></div>' +
        '<div id="api-perf-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="api-perf-report-r2" class="row">' +
        '<div id="api-perf-report-r2-c1" class="col-md-6"></div>' +
        '<div id="api-perf-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="api-perf-report-r3" class="row">' +
        '<div id="api-perf-report-r3-c1" class="col-md-6"></div>' +
        '<div id="api-perf-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
