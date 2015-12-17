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
within this LogSearchPageView. The global lookback/refresh listeners are listenTo()'d
from this view, and with the triggerChange function, kick off responding
processes in the LogAnalysisView that is instantiated from within this view.

instantiated in goldstoneRouter as
    new LogSearchPageView({
        el: ".launcher-container"
    });
*/

var LogSearchPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        this.computeLookback();
        var ns = this.defaults;

        // Pass the start/end params. Must be an array.
        this.logAnalysisView.trigger(change, [ns.start, ns.end]);
    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listenTo on global selectors
        // important: use obj.listenTo(obj, change, callback);
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();

            // also triggers 'lookbackSelectorChanged' in order to reset
            // chart view after changing refresh interval
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
    },

    render: function() {
        this.$el.html(this.template());

        $('.log-analysis-container').append(new ChartHeaderView({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logsearchpage'),
            infoText: 'searchLogAnalysis',
            infoIcon: 'fa-dashboard'
        }).el);

        return this;
    },

    computeLookback: function() {
        var ns = this.defaults;
        ns.end = +new Date();
        ns.start = ns.end - (ns.globalLookback * 60 * 1000);
    },

    renderCharts: function() {
        var self = this;
        this.computeLookback();
        var ns = this.defaults;

        // specificHost applies to this chart when instantiated
        // on a node report page to scope it to that node
        this.defaults.specificHost = this.options.specificHost || '';
        this.logAnalysisCollection = new LogAnalysisCollection({});

        this.logAnalysisView = new LogAnalysisView({
            collection: this.logAnalysisCollection,
            width: $('.log-analysis-container').width(),
            height: 300,
            el: '.log-analysis-container',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            urlRoot: "/logging/summarize/?",
            specificHost: ns.specificHost
        });

        this.viewsToStopListening = [this.logAnalysisCollection, this.logAnalysisView];
    },

    template: _.template('' +

        // container for new prototype d3 log chart
        '<div class="log-analysis-container"></div>' +

        // dataTable searchResults table
        '<div class="search-results-container"></div>' +

        '<div class="row">' +
        '<div id="table-col" class="col-md-12">' +
        '<div class="panel panel-primary log_table_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i>' +
        ' <%=goldstone.contextTranslate(\'Search Results\', \'logsearchpage\')%>' +
        '</h3>' +
        '</div>' +

        '<div class="alert alert-danger search-popup-message" hidden="true"></div>' +
        '<div id="intel-search-data-table" class="panel-body">' +
        '<table id="log-search-table" class="table table-hover">' +

        '<!-- table rows filled by draw_search_table -->' +

        '<thead>' +
        '<tr class="header">' +
        '<th><%=goldstone.contextTranslate(\'Timestamp\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Syslog Severity\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Component\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Host\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Message\', \'logsearchpage\')%></th>' +
        '</tr>' +
        '</thead>' +
        '</table>' +
        '<img src="<%=blueSpinnerGif%>" ' +
        'id="log-table-loading-indicator" class="ajax-loader"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
