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
The intelligence/search page is composed of a LogAnalysisView on top, contained
within this LogSearchView. The global lookback/refresh listeners are listenTo()'d
from this view, and with the triggerChange function, kick off responding
processes in the LogAnalysisView that is instantiated from within this view.

instantiated in goldstoneRouter as
    new EventsBrowserPageView({
        el: ".launcher-container"
    });
*/

var EventsBrowserPageView = GoldstoneBasePageView2.extend({

    renderCharts: function() {

        this.eventsBrowserVizCollection = new EventsHistogramCollection({});

        this.eventsBrowserView = new ChartSet({
            chartTitle: 'Events vs Time',
            collection: this.eventsBrowserVizCollection,
            el: '#events-histogram-visualization',
            infoIcon: 'fa-tasks',
            width: $('#events-histogram-visualization').width(),
            yAxisLabel: 'Number of Events'
        });

        this.eventsBrowserTableCollection = new EventsBrowserTableCollection({});

        this.eventsBrowserTable = new EventsBrowserDataTableView({
            chartTitle: 'Events Browser',
            collection: this.eventsBrowserTableCollection,
            el: '#events-browser-table',
            infoIcon: 'fa-table',
            width: $('#events-browser-table').width()
        });

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.eventsBrowserVizCollection, this.eventsBrowserView, this.eventsBrowserTableCollection, this.eventsBrowserTable];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.eventsBrowserView.trigger('lookbackSelectorChanged');
            this.eventsBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    template: _.template('' +

        '<div class="row">' +
        '<div id="events-histogram-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="events-browser-table" class="col-md-12"></div>' +
        '</div>'
    )

});
