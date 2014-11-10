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

        this.localStorer();

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

        var end = now;
        var start = oneDayAgo;

        this.drawSearchTable('#log-search-table', start, end);

    },

    drawSearchTable: function(location, start, end) {
        var ns = this.defaults;
        var self = this;

        // $("#log-table-loading-indicator").show();

        // end = typeof end !== 'undefined' ?
        //     new Date(Number(end)) :
        //     new Date();

        end = new Date(end);
        start = new Date(Number(start));

        var oTable;

        var uri = '/intelligence/log/search/data'.concat(
            "?start_time=", String(Math.round(start.getTime() / 1000)),
            "&end_time=", String(Math.round(end.getTime() / 1000)));

        // var uri = ns.urlRouteConstruction;

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
                "ajax": function(data, callback, settings) {
                    callback(
                        JSON.parse(localStorage.getItem('dataTablesData'))
                    );
                },
                "columnDefs": [{
                    "visible": false,
                    "targets": [5, 6, 7, 8, 9, 10]
                }, {
                    "name": "timestamp",
                    "type": "date",
                    "targets": 0,
                    "render": function(data, type, full, meta) {
                        return moment(data).format();
                    }
                }, {
                    "name": "loglevel",
                    "targets": 1
                }, {
                    "name": "component",
                    "targets": 2
                }, {
                    "name": "host",
                    "targets": 3
                }, {
                    "name": "message",
                    "targets": 4
                }, {
                    "name": "location",
                    "targets": 5
                }, {
                    "name": "pid",
                    "targets": 6
                }, {
                    "name": "source",
                    "targets": 7
                }, {
                    "name": "request_id",
                    "targets": 8
                }, {
                    "name": "type",
                    "targets": 9
                }, {
                    "name": "received",
                    "type": "date",
                    "targets": 10
                }]
            };

            oTable = $(location).DataTable(oTableParams);

            $(window).bind('resize', function() {
                oTable.fnAdjustColumnSizing();
            });
        }
        // $("#log-table-loading-indicator").hide();
    },

    render: function() {
        $(this.el).append(this.template());
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
        // '<img src="{% static "images/ajax-loader-solinea-blue.gif" %}" id="log-table-loading-indicator" class="ajax-loader"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'),

localStorer: function(){
    localStorage.setItem('dataTablesData', JSON.stringify({
    "count": 5863,
    "next": "http://localhost:8000/core/events?source_name=controller-01&created__gte=1415566438295&page=2&created__lte=1415652838295",
    "previous": null,
    "data": [
        {
            "id": "a9d0687c-11bd-4a4c-99d3-a8c9742133cc",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "./goldstone-agent[11702]: goldstone-agent 11702 goldstone.agent.libvirtmetrics exit status 1",
            "created": "2014-11-10T20:53:56.000269+00:00"
        },
        {
            "id": "cd2fbf39-fdf1-42e2-838c-8ad86005eeef",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "./goldstone-agent[11702]: goldstone-agent 11702 goldstone.agent.vmlistreport exit status 1",
            "created": "2014-11-10T20:52:57.000429+00:00"
        },
        {
            "id": "400e0446-8aba-4945-9b08-07e0bc566edd",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "./goldstone-agent[11702]: goldstone-agent 11702 goldstone.agent.libvirtmetrics exit status 1",
            "created": "2014-11-10T20:52:56.000270+00:00"
        },
        {
            "id": "a4175249-cc14-4c21-acf0-25888260dd9b",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: ERROR with Account server 192.168.203.3:6002/device1 re: Trying to HEAD /v1/AUTH_3aa3b6e4ce0048a7997d900ddde95d41: ConnectionTimeout (0.5s) (txn: tx224811c588e143bb98f69-0054612588) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:26.000456+00:00"
        },
        {
            "id": "3afcb881-fa05-400e-8aa3-9f7475e669d0",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: Account HEAD returning 503 for [] (txn: tx224811c588e143bb98f69-0054612588) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:26.000457+00:00"
        },
        {
            "id": "0a7ffe33-5990-46de-904f-4a4eadffe394",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: ERROR with Account server 192.168.203.2:6002/device1 re: Trying to HEAD /v1/AUTH_3aa3b6e4ce0048a7997d900ddde95d41: ConnectionTimeout (0.5s) (txn: tx224811c588e143bb98f69-0054612588) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:25.000456+00:00"
        },
        {
            "id": "e0b9a82a-6d78-43f9-ae53-8160b427aa5d",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: ERROR with Account server 192.168.203.4:6002/device1 re: Trying to HEAD /v1/AUTH_3aa3b6e4ce0048a7997d900ddde95d41: ConnectionTimeout (0.5s) (txn: tx224811c588e143bb98f69-0054612588) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:25.000956+00:00"
        },
        {
            "id": "f82abad7-e183-4522-8cb7-46533f98ac3a",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: Account HEAD returning 503 for [] (txn: txc5f031a1ea534a69b6f79-0054612587) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:24.000944+00:00"
        },
        {
            "id": "bffae52a-cf33-44e8-bd08-9565cba78b29",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: ERROR with Account server 192.168.203.4:6002/device1 re: Trying to HEAD /v1/AUTH_3aa3b6e4ce0048a7997d900ddde95d41: ConnectionTimeout (0.5s) (txn: txc5f031a1ea534a69b6f79-0054612587) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:24.000944+00:00"
        },
        {
            "id": "d453af71-a4cf-4f5b-86bd-3f6db5ef4b5b",
            "event_type": "GenericSyslogError",
            "source_id": "b6b222c4-f748-4105-8612-67eb8b9eec2e",
            "source_name": "controller-01",
            "message": "proxy-server: ERROR with Account server 192.168.203.2:6002/device1 re: Trying to HEAD /v1/AUTH_3aa3b6e4ce0048a7997d900ddde95d41: ConnectionTimeout (0.5s) (txn: txc5f031a1ea534a69b6f79-0054612587) (client_ip: 208.52.143.92)",
            "created": "2014-11-10T20:52:24.000443+00:00"
        }
    ]
}));
}

});
