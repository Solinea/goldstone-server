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

var NeutronReportView = ApiPerfReportView.extend({

    triggerChange: function() {
        this.renderCharts();
    },

    renderCharts: function() {
        this.neutronApiPerfChart = new ApiPerfCollection({
            urlPrefix: 'neutron',
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: "Neutron API Performance",
            collection: this.neutronApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Agent List"
            }],
            el: '#neutron-report-r1-c1',
            width: $('#neutron-report-r1-c1').width()
        });
    },

    template: _.template('' +
        '<div id="neutron-report-r1" class="row">' +
        '<div id="neutron-report-r1-c1" class="col-md-6"></div>' +
        '<div id="neutron-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="neutron-report-r2" class="row">' +
        '<div id="neutron-report-r2-c1" class="col-md-6"></div>' +
        '<div id="neutron-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="neutron-report-r3" class="row">' +
        '<div id="neutron-report-r3-c1" class="col-md-6"></div>' +
        '<div id="neutron-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
