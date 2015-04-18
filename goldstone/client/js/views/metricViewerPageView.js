/**
 * Copyright 2015 Solinea, Inc.
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

var MetricViewerPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged') {
            // this.eventTimelineChartView.trigger('lookbackSelectorChanged');
            // this.nodeAvailChartView.trigger('lookbackSelectorChanged');
        }

        if (change === 'lookbackIntervalReached') {
            // this.eventTimelineChartView.trigger('lookbackIntervalReached');
            // this.nodeAvailChartView.trigger('lookbackIntervalReached');
        }
    },

    renderCharts: function() {

        //---------------------------
        // instantiate metric viewer viz

        // fetch url is set in eventTimelineCollection
        this.metricViewerChart = new MetricViewerCollection({});

        this.metricViewerChartView = new MetricViewerView({
            collection: this.metricViewerChart,
            width: $('#goldstone-metric-r1-c1').width(),
            height: $('#goldstone-metric-r1-c1').width()
        });

        // this.metricViewerChartView2 = new MetricViewerView({
        //     collection: this.metricViewerChart,
        //     width: $('#goldstone-metric-r1-c2').width(),
        //     height: $('#goldstone-metric-r1-c2').width()
        // });

        // this.metricViewerChartView3 = new MetricViewerView({
        //     collection: this.metricViewerChart,
        //     width: $('#goldstone-metric-r1-c3').width(),
        //     height: $('#goldstone-metric-r1-c3').width()
        // });

        $('#goldstone-metric-r1-c1').append(this.metricViewerChartView.render().el);
        // $('#goldstone-metric-r1-c2').append(this.metricViewerChartView2.render().el);
        // $('#goldstone-metric-r1-c3').append(this.metricViewerChartView3.render().el);
    },

    template: _.template('' +
        '<div id="goldstone-metric-r1" class="row">' +
        '<div id="goldstone-metric-r1-c1" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c2" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c3" class="col-md-4"></div>' +
        '</div>'
    )

});
