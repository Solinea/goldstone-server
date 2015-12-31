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
        this.logBrowserTable.trigger(change);
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    renderCharts: function() {

        var self = this;
        this.logBrowserVizCollection = new LogBrowserCollection({
            urlBase: '/logging/summarize/',

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.logBrowserVizCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'searchLogAnalysis',
            marginLeft: 60,
            urlRoot: "/logging/summarize/?",
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });

        this.logBrowserTableCollection = new LogBrowserTableCollection({
            skipFetch: true,
            specificHost: this.specificHost,
            urlBase: '/logging/search/',
            linkedCollection: this.logBrowserVizCollection
        });    

        this.logBrowserTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.logBrowserTableCollection,
            el: '#log-viewer-table',
            infoIcon: 'fa-table',
            width: $('#log-viewer-table').width()
        });

        this.listenTo(this.logBrowserViz, 'chartUpdate', function() {
            self.logBrowserTableCollection.filter = self.logBrowserViz.filter;
            self.logBrowserTable.update();
        });

        // check for compliance addon and render predefined search bar if present
        if (goldstone.returnAddonPresent('compliance')) {
            if (goldstone.compliance.PredefinedSearchView) {
                this.predefinedSearchModule = new goldstone.compliance.PredefinedSearchView({
                    className: 'compliance-predefined-search nav nav-pills',
                    tagName: 'ul'
                });

                $('.compliance-predefined-search-container').html(this.predefinedSearchModule.el);
            }
        }

        this.viewsToStopListening = [this.logBrowserVizCollection, this.logBrowserViz, this.logBrowserTableCollection, this.logBrowserTable];

        // stopListening to predefinedSearchModule upon close, if present
        if (this.predefinedSearchModule !== undefined) {
            this.viewsToStopListening.push(this.predefinedSearchModule);
        }

    },

    template: _.template('' +

        // button selectors for log viewers
        '<div class="btn-group" role="group">' +
        '<a href="#reports/logbrowser"><button type="button" data-title="Log Browser" class="active headerBar servicesButton btn btn-default"><%=goldstone.translate(\'Log Browser\')%></button></a>' +
        '<a href="#reports/eventbrowser"><button type="button" data-title="Event Browser" class="headerBar reportsButton btn btn-default"><%=goldstone.translate(\'Event Browser\')%></button></a>' +
        '<a href="#reports/apibrowser"><button type="button" data-title="Api Browser" class="headerBar eventsButton btn btn-default"><%=goldstone.translate(\'Api Browser\')%></button></a>' +
        '</div><br><br>' +

        // divs for log viewer viz on top and dataTable below
        '<div class="row">' +
        '<div id="log-viewer-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="log-viewer-table" class="col-md-12"></div>' +
        '</div>'
    )

});
