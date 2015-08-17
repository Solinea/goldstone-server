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

var KeystoneReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.keystoneApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
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
            el: '#keystone-report-r1-c1',
            width: $('#keystone-report-r1-c1').width()
        });

    },

    template: _.template('' +
        '<div id="keystone-report-r1" class="row">' +
        '<div id="keystone-report-r1-c1" class="col-md-6"></div>' +
        '<div id="keystone-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="keystone-report-r2" class="row">' +
        '<div id="keystone-report-r2-c1" class="col-md-6"></div>' +
        '</div>'
    )

});
