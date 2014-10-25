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

var renderApiPerfCharts = function() {


    //----------------------------
    // instantiate charts via
    // backbone collection / views


    //---------------------------
    // instantiate nova api chart

    var novaApiPerfChart = new ApiPerfCollection({
        url: goldstone.nova.apiPerf.url(nsReport.start, nsReport.end, nsReport.interval, false)
    });

    var novaApiPerfChartView = new ApiPerfView({
        chartTitle: "Nova API Performance",
        collection: novaApiPerfChart,
        height: 300,
        infoCustom: [{
            key: "API Call",
            value: "Hypervisor Show"
        }],
        el: '#api-perf-report-r1-c1',
        startStopInterval: nsReport,
        width: $('#api-perf-report-r1-c1').width()
    });


    //------------------------------
    // instantiate neutron api chart

    var neutronApiPerfChart = new ApiPerfCollection({
        url: goldstone.neutron.apiPerf.url(nsReport.start, nsReport.end, nsReport.interval, false)
    });

    var neutronApiPerfChartView = new ApiPerfView({
        chartTitle: "Neutron API Performance",
        collection: neutronApiPerfChart,
        height: 300,
        infoCustom: [{
            key: "API Call",
            value: "Agent List"
        }],
        el: '#api-perf-report-r1-c2',
        startStopInterval: nsReport,
        width: $('#api-perf-report-r1-c2').width()
    });

    //-------------------------------
    // instantiate keystone api chart

    var keystoneApiPerfChart = new ApiPerfCollection({
        url: goldstone.keystone.apiPerf.url(nsReport.start, nsReport.end, nsReport.interval, false)
    });

    var keystoneApiPerfChartView = new ApiPerfView({
        chartTitle: "Keystone API Performance",
        collection: keystoneApiPerfChart,
        height: 300,
        infoCustom: [{
            key: "API Call",
            value: "Authenticate"
        }],
        el: '#api-perf-report-r2-c1',
        startStopInterval: nsReport,
        width: $('#api-perf-report-r2-c1').width()
    });

    //-----------------------------
    // instantiate glance api chart

    var glanceApiPerfChart = new ApiPerfCollection({
        url: goldstone.glance.apiPerf.url(nsReport.start, nsReport.end, nsReport.interval, false)
    });

    var glanceApiPerfChartView = new ApiPerfView({
        chartTitle: "Glance API Performance",
        collection: glanceApiPerfChart,
        height: 300,
        infoCustom: [{
            key: "API Call",
            value: "Image Show"
        }],
        el: '#api-perf-report-r2-c2',
        startStopInterval: nsReport,
        width: $('#api-perf-report-r2-c2').width()
    });

    //-----------------------------
    // instantiate cinder api chart

    var cinderApiPerfChart = new ApiPerfCollection({
        url: goldstone.cinder.apiPerf.url(nsReport.start, nsReport.end, nsReport.interval, false)
    });

    var cinderApiPerfChartView = new ApiPerfView({
        chartTitle: "Cinder API Performance",
        collection: cinderApiPerfChart,
        height: 300,
        infoCustom: [{
            key: "API Call",
            value: "Service List"
        }],
        el: '#api-perf-report-r3-c1',
        startStopInterval: nsReport,
        width: $('#api-perf-report-r3-c1').width()
    });

};
