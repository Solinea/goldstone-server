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

var EventsBrowserPageView = GoldstoneBasePageView.extend({

    renderCharts: function() {

        this.eventsBrowserVizCollection = new EventsHistogramCollection({});

        this.eventsBrowserView = new ChartSet({
            chartTitle: goldstone.contextTranslate('Events vs Time', 'eventsbrowser'),
            collection: this.eventsBrowserVizCollection,
            el: '#events-histogram-visualization',
            infoIcon: 'fa-tasks',
            marginLeft: 60,
            width: $('#events-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Number of Events', 'eventsbrowser')
        });

        // for access to url generation functions
        this.eventsBrowserTableCollection = new EventsBrowserTableCollection({
            skipFetch: true
        });

        this.eventsBrowserTable = new EventsBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Events Browser', 'eventsbrowser'),
            collectionMixin: this.eventsBrowserTableCollection,
            el: '#events-browser-table',
            infoIcon: 'fa-table',
            width: $('#events-browser-table').width()
        });

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [
            this.eventsBrowserVizCollection, this.eventsBrowserView, this.eventsBrowserTableCollection, this.eventsBrowserTable
        ];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.eventsBrowserView.trigger('lookbackSelectorChanged');
            this.eventsBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Browser'],
        ['/#reports/eventbrowser', 'Event Browser', 'active'],
        ['/#reports/apibrowser', 'API Browser'],
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

        '<div class="row">' +
        '<div id="events-histogram-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="events-browser-table" class="col-md-12"></div>' +
        '</div>'
    )

});
