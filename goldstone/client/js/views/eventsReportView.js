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

var EventsReportView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.width = options.width;
        this.defaults.hostName = options.nodeName;

        var ns = this.defaults;
        var self = this;

        console.log('hostname:', ns.hostName);

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(this.el).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'display': ns.spinnerDisplay
            });
        });

        this.update();
    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        var now = +new Date();
        var oneDayAgo = (+new Date()) - (1000 * 60 * 60 * 24);
        var oneWeekAgo = (+new Date()) - (1000 * 60 * 60 * 24 * 7);

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';

        $(this.el).find('#spinner').hide();

        ns.urlRouteConstruction = '/core/events?source_name=' + this.defaults.hostName + '&created__lte=' + now + '&created__gte=' + oneDayAgo;

        this.render();

        console.log('urlRouteConstruction', ns.urlRouteConstruction);

    },

    drawSearchTable: function(location, start, end) {
    // $("#log-table-loading-indicator").show();

    end = typeof end !== 'undefined' ?
        new Date(Number(end)) :
        new Date();

    if (typeof start !== 'undefined') {
        start = new Date(Number(start));
    } else {
        start = new Date(Number(start));
        start.addWeeks(-1);
    }

    var oTable;
    var uri = '/intelligence/log/search/data'.concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)));

    console.log('uri in drawSearchTable', uri);

    if ($.fn.dataTable.isDataTable(location)) {
        oTable = $(location).DataTable();
        oTable.ajax.url(uri);
        oTable.ajax.reload();
    } else {
        var oTableParams = {
            "info": false,
            "autoWidth": true,
            "processing": true,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "ordering": true,
            "serverSide": true,
            "ajax": uri,
            "columnDefs": [
                { "visible": false, "targets": [ 5, 6, 7, 8, 9, 10 ] },
                { "name": "timestamp", "type": "date", "targets": 0,
                  "render": function (data, type, full, meta) {
                        return moment(data).format();
                    }
                },
                { "name": "loglevel", "targets": 1 },
                { "name": "component", "targets": 2 },
                { "name": "host", "targets": 3 },
                { "name": "message", "targets": 4 },
                { "name": "location", "targets": 5 },
                { "name": "pid", "targets": 6 },
                { "name": "source", "targets": 7 },
                { "name": "request_id", "targets": 8 },
                { "name": "type", "targets": 9 },
                { "name": "received", "type": "date", "targets": 10 }
            ]
        };

        oTable = $(location).DataTable(oTableParams);

        $(window).bind('resize', function () {
            oTable.fnAdjustColumnSizing();
        });
    }
    // $("#log-table-loading-indicator").hide();
},

    render: function() {
        $(this.el).append(this.template());

        var end = +new Date();
        var start = (+new Date() - (1000 * 60 * 60 * 24 * 7));

        this.drawSearchTable('#log-search-table', start, end);
        return this;
    },

    template: _.template(

'<div class="row">' +
'<div id="table-col" class="col-md-12">' +
'<div class="panel panel-primary log_table_panel">' +
'<div class="panel-heading">' +
'<h3 class="panel-title"><i class="fa fa-dashboard"></i>Search Results' +
'</h3>' +
'</div>' +
'<div id="intel-search-data-table" class="panel-body">' +
'<table id="log-search-table" class="table table-hover">' +

'<!-- table rows filled by draw_search_table -->' +

'<thead>' +
'<tr class="header">' +
'<th>Timestampp</th>' +
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
// '<img src="{% static "images/ajax-loader-solinea-blue.gif" %}" id="log-table-loading-indicator" class="ajax-loader"/>' +
'</div>' +
'</div>' +
'</div>' +
'</div>')
});
