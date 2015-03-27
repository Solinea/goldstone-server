/**
 * Copyright 2014 - 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
instantiated in search.html as
    new LogSearchView({
        el: ".log-search-container"
    });
*/

var LogSearchView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        this.computeLookback();
        var ns = this.defaults;

        this.logAnalysisView.trigger(change, [ns.start, ns.end]);
    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listeners between global selectors and charts
        // change listeners for global selectors
        $('#global-lookback-range').on('change', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        $('#global-refresh-range').on('change', function() {
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

        new ChartHeaderView({
            el: '.log-analysis-container',
            chartTitle: 'Log Analysis',
            infoText: 'searchLogAnalysis',
            infoIcon: 'fa-dashboard',
            columns: 13
        });

        return this;
    },

    computeLookback: function() {
        var ns = this.defaults;
        ns.end = +new Date();
        ns.start = ns.end - (ns.globalLookback * 60 * 1000);
    },

    renderCharts: function() {
        this.computeLookback();
        var ns = this.defaults;

        this.logAnalysisCollection = new LogAnalysisCollection({});

        this.logAnalysisView = new LogAnalysisView({
            collection: this.logAnalysisCollection,
            width: $('.log-analysis-container').width(),
            height: 300,
            el: '.log-analysis-container',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            urlRoot: "/logging/summarize?",

        });
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
        ' Search Results' +
        '</h3>' +
        '</div>' +

        '<div class="alert alert-danger search-popup-message" hidden="true"></div>' +
        '<div id="intel-search-data-table" class="panel-body">' +
        '<table id="log-search-table" class="table table-hover">' +

        '<!-- table rows filled by draw_search_table -->' +

        '<thead>' +
        '<tr class="header">' +
        '<th>Timestamp</th>' +
        '<th>Syslog Severity</th>' +
        '<th>Component</th>' +
        '<th>Host</th>' +
        '<th>Message</th>' +
        // '<th>Log Location</th>' +
        // '<th>Process ID</th>' +
        // '<th>Source</th>' +
        // '<th>Request ID</th>' +
        // '<th>Log Type</th>' +
        // '<th>Processed At</th>' +
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
