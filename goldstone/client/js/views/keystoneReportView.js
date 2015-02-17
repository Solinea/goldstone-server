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

var KeystoneReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === undefined) {
            change = 'lookbackSelectorChanged';
        }
        this.keystoneApiPerfChartView.trigger(change);
    },

    renderCharts: function() {
        this.keystoneApiPerfChart = new ApiPerfCollection({
            urlPrefix: 'keystone',
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: "Keystone API Performance",
            collection: this.keystoneApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Authenticate"
            }],
            el: '#keystone-report-r1-c1',
            width: $('#keystone-report-r1-c1').width()
        });
    },

    template: _.template('' +
        '<div id="keystone-report-r1" class="row">' +
        '<div id="keystone-report-r1-c1" class="col-md-6"></div>' +
        '</div>'
    )
});
