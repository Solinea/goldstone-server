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

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.eventsBrowserView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        this.eventsSearchObserverCollection = new LogBrowserCollection({

            // overwriting to call timestamp instead of "@timestamp"
            addRange: function() {
                return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
            },

            urlBase: '/core/events/',
            skipFetch: true
        });

        this.eventsBrowserView = new ChartSet({

            // overwrite processListeners
            processListeners: function() {
                var self = this;

                // registers 'sync' event so view 'watches' collection for data update
                if (this.collection) {
                    this.listenTo(this.collection, 'sync', this.update);
                    this.listenTo(this.collection, 'error', this.dataErrorMessage);
                }

                this.listenTo(this, 'lookbackSelectorChanged', function() {
                    self.showSpinner();
                    self.collection.triggerDataTableFetch();
                });
            },

            chartTitle: goldstone.contextTranslate('Event Search', 'eventsbrowser'),
            collection: this.eventsSearchObserverCollection,
            el: '#events-histogram-visualization',
            marginLeft: 60,
            width: $('#events-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Number of Events', 'eventsbrowser')
        });

        this.eventsBrowserTable = new EventsBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Events Browser', 'eventsbrowser'),
            collectionMixin: this.eventsSearchObserverCollection,
            el: '#events-browser-table',
            width: $('#events-browser-table').width()
        });

        // render predefinedSearch Dropdown
        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: this.eventsSearchObserverCollection,
            index_prefix: 'events_*',
            settings_redirect: '/#reports/eventbrowser/search'
        });

        this.eventsBrowserView.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // create linkages from the master collection back to the viz'
        this.eventsSearchObserverCollection.linkedViz = this.eventsBrowserView;
        this.eventsSearchObserverCollection.linkedDataTable = this.eventsBrowserTable;
        this.eventsSearchObserverCollection.linkedDropdown = this.predefinedSearchDropdown;

        // TODO: delete eventsBrowserTableCollection

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [
            this.eventsSearchObserverCollection, this.eventsBrowserView, this.eventsBrowserTable, this.predefinedSearchDropdown
        ];
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer'],
        ['/#reports/eventbrowser', 'Event Viewer', 'active'],
        ['/#reports/apibrowser', 'API Call Viewer']
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
