/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Alex Jacobs
 */

var LogSearchView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.globalLookback = null;
        this.defaults.globalRefresh = null;
        this.defaults.nsReport = options.nsReport;

        var ns = this.defaults;
        var self = this;

        this.render();
        this.getGlobalLookbackRefresh();
        this.renderCharts();
        this.setGlobalLookbackRefreshTriggers();
        this.scheduleInterval();
    },

    clearScheduledInterval: function() {
        var ns = this.defaults;
        clearInterval(ns.scheduleInterval);
    },

    scheduleInterval: function() {
        var self = this;
        var ns = this.defaults;

        var intervalDelay = ns.globalRefresh * 1000;

        if (intervalDelay < 0) {
            return true;
        }

        ns.scheduleInterval = setInterval(function() {
            self.triggerChange('refreshReached');
        }, intervalDelay);
    },

    getGlobalLookbackRefresh: function() {
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.defaults.globalRefresh = $('#global-refresh-range').val();
    },

    triggerChange: function(change) {
        this.computeLookback();
        var ns = this.defaults;
        // badEventMultiLine('#bad-event-multiline', ns.start, ns.end);
        // drawSearchTable('#log-search-table', ns.start, ns.end);

        this.logAnalysisView.trigger(change, [ns.start, ns.end]);
    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listeners between global selectors and charts
        // change listeners for global selectors
        $('#global-lookback-range').on('change', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('selectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        $('#global-refresh-range').on('change', function() {
            self.getGlobalLookbackRefresh();
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
            // TODO: append proper header so data popup is not floating
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
        // badEventMultiLine('#bad-event-multiline', ns.start, ns.end);
        // drawSearchTable('#log-search-table', ns.start, ns.end);

        this.logAnalysisCollection = new LogAnalysisCollection({
            // urlRoot: "/intelligence/log/cockpit/data?",
            // start: ns.start,
            // end: ns.end,
            // width: $('.log-analysis-container').width()
        });

        this.logAnalysisView = new LogAnalysisView({
            collection: this.logAnalysisCollection,
            width: $('.log-analysis-container').width(),
            height: 300,
            el: '.log-analysis-container',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            urlRoot: "/intelligence/log/cockpit/data?",

        });
    },

    template: _.template('' +

        // container for new prototype d3 log chart
        '<div class="log-analysis-container"></div>' +

        // '<div class="row">' +
        // '<div class="col-md-12">' +
        // '<div class="panel panel-primary intel_panel">' +
        // '<div class="panel-heading">' +
        // '<h3 class="panel-title"><i class="fa fa-dashboard"></i>' +
        // '<a href="/intelligence/search"> Log Analysis</a>' +

        // '<!-- info-circle icon -->' +
        // '<i class="fa fa-info-circle panel-info pull-right" ' +
        // 'id="goldstone-log-info"></i>' +

        // '</h3>' +
        // '</div>' +
        // '<div class="alert alert-danger log-popup-message" hidden="true"></div>' +
        // '<div class="panel-body" style="height:400px">' +
        // '<div id="bad-event-multiline">' +
        // '<img src="<%=blueSpinnerGif%>" id="log-multiline-loading-indicator" class="ajax-loader"/>' +

        // '<div class="clearfix"></div>' +
        // '</div>' +
        // '<div id="bad-event-range">' +
        // '<div class="clearfix"></div>' +
        // '</div>' +
        // '</div>' +
        // '</div>' +
        // '</div>' +
        // '</div>' +

        // divider between dataTable searchResults table
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
        '<th>Level</th>' +
        '<th>Component</th>' +
        '<th>Host</th>' +
        '<th>Message</th>' +
        '<th>Log Location</th>' +
        '<th>Process ID</th>' +
        '<th>Source</th>' +
        '<th>Request ID</th>' +
        '<th>Log Type</th>' +
        '<th>Processed At</th>' +
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
