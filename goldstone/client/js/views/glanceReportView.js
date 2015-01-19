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

var GlanceReportView = ApiPerfReportView.extend({

    triggerChange: function() {
        this.renderCharts();
    },

    renderCharts: function() {
        this.glanceApiPerfChart = new ApiPerfCollection({
            urlPrefix: 'glance',
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: "Glance API Performance",
            collection: this.glanceApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Image Show"
            }],
            el: '#glance-report-r1-c1',
            width: $('#glance-report-r1-c1').width()
        });
    },

    template: _.template('' +
        '<div id="glance-report-r1" class="row">' +
        '<div id="glance-report-r1-c1" class="col-md-6"></div>' +
        '<div id="glance-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="glance-report-r2" class="row">' +
        '<div id="glance-report-r2-c1" class="col-md-6"></div>' +
        '<div id="glance-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="glance-report-r3" class="row">' +
        '<div id="glance-report-r3-c1" class="col-md-6"></div>' +
        '<div id="glance-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )
});
