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

The nesting of this page is:

| MetricViewerPageView
|__ MetricViewerView + MetricViewerCollection
|____ MetricView + MetricViewCollection

At the moment /#metric will default to 6 charts.
/metric/1 will show 1 chart
/metric/2 will show 2 charts
/metric/3 will show 3 charts
...etc, up to a maximum of 6 charts.
*/

var MetricViewerPageView = GoldstoneBasePageView.extend({

    initialize: function(options) {

        // hide global lookback selector
        $("select#global-lookback-range").hide();

        // options.numCharts passed in by goldstoneRouter
        // and reflects the number n (1-6) following "/#metric/n"
        this.numCharts = options.numCharts;

        // model to hold collection/views of chart grids
        this.metricViewGridContainer = new Backbone.Model({
            grid: {
                view: {},
                collection: {}
            }
        });

        // instantiate initialize in GoldstoneBasePageView
        MetricViewerPageView.__super__.initialize.apply(this, arguments);
    },

    onClose: function() {
        // clear out grid of collections/views
        this.metricViewGridContainer.clear();

        // return global lookback selector to page
        $("select#global-lookback-range").show();

        MetricViewerPageView.__super__.onClose.apply(this, arguments);
    },

    renderCharts: function() {

        // defined in initialize
        var num = this.numCharts;

        var locationHash = {
            0: '#goldstone-metric-r1-c1',
            1: '#goldstone-metric-r1-c2',
            2: '#goldstone-metric-r1-c3',
            3: '#goldstone-metric-r2-c1',
            4: '#goldstone-metric-r2-c2',
            5: '#goldstone-metric-r2-c3'
        };

        //---------------------------------------------
        // instantiate as many metricViews as requested

        // Backbone getter:
        var grid = this.metricViewGridContainer.get('grid');

        for (var i = 0; i < num; i++) {

            // underscore method for producing unique integer
            var id = _.uniqueId();

            grid.collection[id] = new MetricViewerCollection({});

            grid.view[id] = new MetricViewerView({
                collection: grid.collection[id],
                width: $(locationHash[i]).width(),
                height: 360,
                // passing the instance allows for unique
                // identification of charts and elements
                instance: id
            });

            $(locationHash[i]).append(grid.view[id].el);
        }
    },

    triggerChange: function(change) {
        // upon lookbackIntervalReached, trigger all views
        // so they can be refreshed via metricViewerView
        if (change === 'lookbackIntervalReached') {
            var grid = this.metricViewGridContainer.get('grid').view;

            // trigger each chart currently in the grid that the refresh
            // interval has been reached
            _.each(grid, function(view) {
                view.trigger('globalLookbackReached');
            });
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
