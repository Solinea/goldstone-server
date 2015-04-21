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

    onClose: function() {
        MetricViewerView.__super__.onClose.apply(this, arguments);
    },

    renderCharts: function() {

        //---------------------------
        // instantiate metric viewer viz

        // fetch url is set in eventTimelineCollection
        this.metricViewerChart1 = new MetricViewerCollection({});
        this.metricViewerChart2 = new MetricViewerCollection({});
        this.metricViewerChart3 = new MetricViewerCollection({});

        // instance variables added to options hash in order to create a
        // custom binding between each metricViewerChart and
        // the associated modal menus

        this.metricViewerChartView = new MetricViewerView({
            collection: this.metricViewerChart1,
            width: $('#goldstone-metric-r1-c1').width(),
            height: $('#goldstone-metric-r1-c1').width(),
            instance: 1
        });

        this.metricViewerChartView2 = new MetricViewerView({
            collection: this.metricViewerChart2,
            width: $('#goldstone-metric-r1-c2').width(),
            height: $('#goldstone-metric-r1-c2').width(),
            instance: 2
        });

        this.metricViewerChartView3 = new MetricViewerView({
            collection: this.metricViewerChart3,
            width: $('#goldstone-metric-r1-c3').width(),
            height: $('#goldstone-metric-r1-c3').width(),
            instance: 3
        });

        $('#goldstone-metric-r1-c1').append(this.metricViewerChartView.el);
        $('#goldstone-metric-r1-c2').append(this.metricViewerChartView2.el);
        $('#goldstone-metric-r1-c3').append(this.metricViewerChartView3.el);

    },

    template: _.template('' +
        '<div id="goldstone-metric-r1" class="row">' +
        '<div id="goldstone-metric-r1-c1" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c2" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c3" class="col-md-4"></div>' +
        '</div>'
    )

});
