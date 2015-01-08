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
            self.triggerChange();
        }, intervalDelay);
    },

    getGlobalLookbackRefresh: function() {
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.defaults.globalRefresh = $('#global-refresh-range').val();
    },

    triggerChange: function() {
        this.renderCharts();
    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listeners between global selectors and charts
        // change listeners for global selectors
        $('#global-lookback-range').on('change', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange();
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
        badEventMultiLine('#bad-event-multiline', ns.start, ns.end);
        drawSearchTable('#log-search-table', ns.start, ns.end);
        goldstone.populateSettingsFields(ns.start, ns.end);
    },

    template: _.template('' +
        '<div class="row">' +
        '<div class="col-md-12">' +
        '<div class="panel panel-primary intel_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i>'+
        '<a href="/intelligence/search"> Log Analysis</a>' +
        '<i class="fa fa-cog pull-right" data-toggle="modal" ' +
        'data-target="#logSettingsModal"></i>' +

        '<!-- info-circle icon -->' +
        '<i class="fa fa-info-circle panel-info pull-right" ' +
        'id="goldstone-log-info" style="margin-right: 30px;">' +
        '</i>' +

        '</h3>' +
        '</div>' +
        '<div class="alert alert-danger log-popup-message" hidden="true"></div>' +
        '<div class="panel-body" style="height:400px">' +
        '<div id="bad-event-multiline">' +
        '<img src="<%=blueSpinnerGif%>" id="log-multiline-loading-indicator" class="ajax-loader"/>' +

        '<div class="clearfix"></div>' +
        '</div>' +
        '<div id="bad-event-range">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
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
        '</div>' +

        '<!-- log settings modal -->' +
        '<div class="modal fade" id="logSettingsModal" tabindex="-1" role="dialog"' +
        'aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" ' +
        'aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title" id="myModalLabel">Chart Range ' +
        'Settings</h4>' +
        '</div>' +
        '<div class="modal-body">' +
        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="settingsStartTime" ' +
        'class="col-sm-3 control-label">Start:</label>' +

        '<div class="col-sm-9">' +
        '<input id="settingsStartTime" ' +
        'class="form-control" type="text" ' +
        'placeholder="1 weeks ago">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +

        '<label for="settingsEndTime" ' +
        'class="col-sm-3 control-label">End:</label>' +

        '<div class="col-sm-9">' +

        '<div class="input-group">' +
        '<span class="input-group-addon">' +
        '<input type="radio" ' +
        'name="optionsEndTime" ' +
        'value="option1" ' +
        'id="endTimeNow" checked>' +
        '</span>' +
        '<input class="form-control form-control-static" ' +
        'type="text" ' +
        'placeholder="use current time" ' +
        'disabled>' +
        '</div>' +

        '<div class="input-group">' +
        '<span class="input-group-addon">' +
        '<input type="radio" ' +
        'name="optionsEndTime" ' +
        'value="option2" ' +
        'id="endTimeSelected">' +
        '</span>' +
        '<input id="settingsEndTime" ' +
        'class="form-control" type="text" ' +
        'placeholder="select time">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="autoRefresh" ' +
        'class="col-sm-3 control-label">Refresh:</label>' +

        '<div class="col-sm-9">' +
        '<div class="input-group">' +
        '<span class="input-group-addon">' +
        '<input type="checkbox" ' +
        'id="autoRefresh">' +
        '</span>' +
        '<select class="form-control" ' +
        'id="autoRefreshInterval">' +
        '<option value="15000">15 seconds</option>' +
        '<option value="30000" selected>30 seconds</option>' +
        '<option value="60000">1 minute</option>' +
        '<option value="300000">5 minutes</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '</form>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<div class="form-group">' +
        '<button type="button" id="settingsUpdateButton" ' +
        'class="btn btn-primary" ' +
        'data-dismiss="modal">Update' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
