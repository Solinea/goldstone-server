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

/*
At the moment /metric will default to 6 charts.
/metric/1 will show 1 chart
/metric/2 will show 2 charts
/metric/3 will show 3 charts
...etc, up to a maximum of 6 charts.
*/

var MetricViewerPageView = GoldstoneBasePageView.extend({

    initialize: function(options) {

        this.numCharts = options.numCharts;
        MetricViewerPageView.__super__.initialize.apply(this, arguments);
    },

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

    metricViewCharts: {
        view: {},
        collection: {}
    },

    renderCharts: function() {
        var num = this.numCharts;

        //---------------------------
        // instantiate metric viewer viz

        var locationHash = {
            0: '#goldstone-metric-r1-c1',
            1: '#goldstone-metric-r1-c2',
            2: '#goldstone-metric-r1-c3',
            3: '#goldstone-metric-r2-c1',
            4: '#goldstone-metric-r2-c2',
            5: '#goldstone-metric-r2-c3'
        };

        for (var i = 0; i < num; i++) {
            var id = _.uniqueId();
            this.metricViewCharts.collection[id] = new MetricViewerCollection({});

            this.metricViewCharts.view[id] = new MetricViewerView({
                collection: this.metricViewCharts.collection[id],
                width: $(locationHash[i]).width(),
                height: $(locationHash[i]).width(),
                instance: id
            });

            $(locationHash[i]).append(this.metricViewCharts.view[id].el);
        }
    },

    template: _.template('' +
        '<div id="goldstone-metric-r1" class="row">' +
        '<div id="goldstone-metric-r1-c1" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c2" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c3" class="col-md-4"></div>' +
        '</div>' +
        '<div id="goldstone-metric-r2" class="row">' +
        '<div id="goldstone-metric-r2-c1" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r2-c2" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r2-c3" class="col-md-4"></div>' +
        '</div>'
    )

});
