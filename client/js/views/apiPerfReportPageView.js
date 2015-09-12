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

    defaults: {},

    initialize: function(options) {
        ApiPerfReportView.__super__.initialize.apply(this, arguments);
    },

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

        var gt = goldstone.translation;
        var ns = this.defaults;

        //----------------------------
        // instantiate charts via
        // backbone collection / views


        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova'
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: gt.dgettext(gt.domain, "Nova API Performance"),
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width()
        });


        //------------------------------
        // instantiate neutron api chart

        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron'
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: "Neutron API Performance",
            collection: this.neutronApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r1-c2',
            width: $('#api-perf-report-r1-c2').width()
        });

        //-------------------------------
        // instantiate keystone api chart

        this.keystoneApiPerfChart = new ApiPerfCollection({
            componentParam: 'keystone'
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: "Keystone API Performance",
            collection: this.keystoneApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r2-c1',
            width: $('#api-perf-report-r2-c1').width()
        });

        //-----------------------------
        // instantiate glance api chart

        this.glanceApiPerfChart = new ApiPerfCollection({
            componentParam: 'glance'
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: "Glance API Performance",
            collection: this.glanceApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r2-c2',
            width: $('#api-perf-report-r2-c2').width()
        });

        //-----------------------------
        // instantiate cinder api chart

        this.cinderApiPerfChart = new ApiPerfCollection({
            componentParam: 'cinder'
        });

        this.cinderApiPerfChartView = new ApiPerfView({
            chartTitle: "Cinder API Performance",
            collection: this.cinderApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r3-c1',
            width: $('#api-perf-report-r3-c1').width()
        });

    },

    template: _.template('' +
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
