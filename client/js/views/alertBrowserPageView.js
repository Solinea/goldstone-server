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

var AlertBrowserPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.alertBrowserView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        this.alertSearchObserverCollection = new SearchObserverCollection({
            urlBase: '/core/api-calls/', // tbd
            skipFetch: true
        });

        this.alertBrowserView = new ChartSet({

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

            chartTitle: goldstone.translate('Alert Search'),
            collection: this.alertSearchObserverCollection,
            el: '#alert-histogram-visualization',
            marginLeft: 60,
            width: $('#alert-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('API Calls by Range', 'apibrowserpage')
        });

        this.apiBrowserTable = new ApiBrowserDataTableView({
            chartTitle: goldstone.translate('Alert Browser'),
            collectionMixin: this.alertSearchObserverCollection,
            el: '#alert-browser-table',
            width: $('#alert-browser-table').width()
        });

        // render predefinedSearch Dropdown
        // this.predefinedSearchDropdown = new PredefinedSearchView({
        //     collection: this.alertSearchObserverCollection,
        //     index_prefix: 'api_stats-*',
        //     settings_redirect: '/#reports/apibrowser/search'
        // });

        // this.alertBrowserView.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // create linkages from the master collection back to the viz'
        this.alertSearchObserverCollection.linkedViz = this.alertBrowserView;
        this.alertSearchObserverCollection.linkedDataTable = this.apiBrowserTable;
        // this.alertSearchObserverCollection.linkedDropdown = this.predefinedSearchDropdown;

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.alertSearchObserverCollection, this.alertBrowserView, this.apiBrowserTable
        // , this.predefinedSearchDropdown
        ];
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer'],
        ['/#reports/eventbrowser', 'Event Viewer'],
        ['/#reports/apibrowser', 'API Call Viewer'],
        ['/#reports/alertbrowser', 'Alert Viewer', 'active']
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

        '<div class="row">' +
        '<div id="alert-histogram-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="alert-browser-table" class="col-md-12"></div>' +
        '</div>'
    )

});
