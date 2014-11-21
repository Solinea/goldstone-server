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
 * Author: Alex Jacobs
 */

var KeystoneReportView = ApiPerfReportView.extend({

    triggerChange: function() {
        this.renderCharts();
    },

    renderCharts: function() {
        var nsReport = goldstone.keystone.report;
        var nsApiPerf = goldstone.keystone.apiPerf;
        nsApiPerf.bivariate = goldstone.charts.bivariateWithAverage._getInstance(nsApiPerf);
        nsReport.start = (+new Date()) - (this.defaults.globalLookback * 1000 * 60);
        nsReport.end = new Date();
        nsReport.interval = '' + Math.round(0.357 * this.defaults.globalLookback) + "s";
        nsApiPerf.bivariate.loadUrl(nsReport.start, nsReport.end, nsReport.interval,
            true, '#keystone-report-r1-c1');
    },

    template: _.template('' +
        '<div id="keystone-report-r1" class="row">' +
        '<div id="keystone-report-r1-c1" class="col-md-6"></div>' +
        '<div id="keystone-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="keystone-report-r2" class="row">' +
        '<div id="keystone-report-r2-c1" class="col-md-6"></div>' +
        '<div id="keystone-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="keystone-report-r3" class="row">' +
        '<div id="keystone-report-r3-c1" class="col-md-6"></div>' +
        '<div id="keystone-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )
});
