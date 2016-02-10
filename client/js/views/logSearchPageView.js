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
The intelligence/search page is composed of a LogBrowserViz on top,
and a LogBrowserDataTableView on the bottom. The global lookback/refresh
listeners are listenTo()'d by each view. Changes to what is rendered
in the top also affect the table on the bottom via a 'trigger'.
*/

var LogSearchPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        this.logBrowserViz.trigger(change);
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    renderCharts: function() {
        
        // this is the single collection that holds state about
        // zoom/filter/lookback/predefinedSearch/specificHost when
        // url generation occurs in the dataTable
        this.logSearchObserverCollection = new LogBrowserCollection({
            urlBase: '/core/logs/',
            skipFetch: true,

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Log Search', 'logbrowserpage'),
            collection: this.logSearchObserverCollection,
            el: '#log-viewer-visualization',
            infoText: 'logBrowser',
            marginLeft: 70,
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage')
        });

        this.logBrowserTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.logSearchObserverCollection,
            el: '#log-viewer-table',
            width: $('#log-viewer-table').width()
        });

        // render predefinedSearch Dropdown
        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: this.logSearchObserverCollection,
            index_prefix: 'logstash-*',
            settings_redirect: '/#reports/logbrowser/search'
        });

        this.logBrowserViz.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // create linkage from the master collection back to the viz'
        this.logSearchObserverCollection.linkedViz = this.logBrowserViz;
        this.logSearchObserverCollection.linkedDataTable = this.logBrowserTable;
        this.logSearchObserverCollection.linkedDropdown = this.predefinedSearchDropdown;

        // TODO: delete logBrowserTableCollection
        
        // destroy listeners and views upon page close
        this.viewsToStopListening = [this.logSearchObserverCollection, this.logBrowserViz, this.logBrowserTable, this.predefinedSearchDropdown];

    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer', 'active'],
        ['/#reports/eventbrowser', 'Event Viewer'],
        ['/#reports/apibrowser', 'API Call Viewer']
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

        // divs for log viewer viz on top and dataTable below
        '<div class="row">' +
        '<div id="log-viewer-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="log-viewer-table" class="col-md-12"></div>' +
        '</div>'
    )

});
