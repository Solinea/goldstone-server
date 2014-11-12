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

    urlGen: function() {

        // urlGen is instantiated inside the beforeSend AJAX hook
        // which means it is run again before every dataTables server query

        var now = +new Date();
        var oneDayAgo = (+new Date()) - (1000 * 60 * 60 * 24);
        var oneHourAgo = (+new Date()) - (1000 * 60 * 60);
        var oneWeekAgo = (+new Date()) - (1000 * 60 * 60 * 24 * 7);

        // default to 24 hour lookback
        var urlRouteConstruction = '/core/events?source_name=' +
        this.defaults.hostName + '&created__lte=' + now + '&created__gte='+
        oneDayAgo;

        this.defaults.url = urlRouteConstruction;

    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.width = options.width;
        this.defaults.hostName = options.nodeName;

        var ns = this.defaults;
        var self = this;

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        var spinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(spinnerLocation).css({
                'position': 'relative',
                'margin-top': -20,
                'margin-left': (ns.width / 2),
                'display': ns.spinnerDisplay
            });
        });

        // appends display and modal html elements to this.el
        this.render();
    },

    dataPrep: function(data) {
        var ns = this.defaults;
        var self = this;

        // initial result is stringified JSON
        var tableData = JSON.parse(data);

        var finalResults = [];

        _.each(tableData.results, function(item) {

            // if any field is undefined, dataTables throws an alert
            item.id = item.id || '';
            item.event_type = item.event_type || '';
            item.source_id = item.source_id || '';
            item.source_name = item.source_name || '';
            item.message = item.message || '';
            item.created = item.created || '';

            finalResults.push([item.created, item.event_type, item.message, item.id, item.source_id, item.source_name]);
        });

        return {
            recordsTotal: tableData.count,
            recordsFiltered: tableData.count,
            result: finalResults
        };
    },

    drawSearchTable: function(location) {

        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

        var oTable;

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();

            // draw(false) = keep current pagination when adding additional rows
            oTable.rows.add(finalResults).draw(false);
        } else {
            var oTableParams = {
                "info": false,
                "processing": true,
                "lengthChange": true,
                "paging": true,
                "searching": true,
                "order": [
                    [0, 'desc']
                ],
                "ordering": false,
                "serverSide": true,
                "ajax": {
                    beforeSend: function(obj, settings) {

                        self.urlGen();

                        var pageSize = $('select.form-control').val();
                        var searchQuery = $('input.form-control').val();
                        var paginationStart = settings.url.match(/start=\d{1,}&/gi);
                        paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
                        var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                        settings.url = self.defaults.url + "&page_size=" + pageSize + "&page=" + computeStartPage;

                        if (searchQuery) {
                            settings.url = settings.url + "&message__prefix=" + searchQuery;
                        }
                    },
                    dataFilter: function(data) {

                        // runs result through this.dataPrep
                        var result = self.dataPrep(data);

                        // dataTables expects JSON encoded result
                        return JSON.stringify(result);
                    },
                    // tells dataTable to look for 'result' param of result object
                    dataSrc: "result"
                },
                "columnDefs": [{
                    "name": "created",
                    "type": "date",
                    "targets": 0,
                    "render": function(data, type, full, meta) {
                        return moment(data).format();
                    }
                }, {
                    "name": "event_type",
                    "targets": 1
                }, {
                    "name": "message",
                    "targets": 2
                }, {
                    "name": "id",
                    "targets": 3
                }, {
                    "name": "source_id",
                    "targets": 4
                }, {
                    "name": "source_name",
                    "targets": 5
                }, {
                    "visible": false,
                    "targets": [3, 4, 5]
                }]
            };

            oTable = $(location).DataTable(oTableParams);
        }
    },

    render: function() {
        $(this.el).append(this.template());
        this.drawSearchTable('#events-report-table');
        return this;
    },

    template: _.template(

        '<div class="row">' +
        '<div id="table-col" class="col-md-12">' +
        '<div class="panel panel-primary log_table_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Events Report' +
        '</h3>' +
        '</div>' +
        '<div id="node-event-data-table" class="panel-body">' +
        '<table id="events-report-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header">' +
        '<th>Created</th>' +
        '<th>Event Type</th>' +
        '<th>Message</th>' +
        '</tr>' +
        '</thead>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>')
});
