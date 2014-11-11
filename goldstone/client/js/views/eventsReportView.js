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

        // bind to backbone collection
        // invoke this.update(), when the collection 'fetch' is complete
        this.collection.on('sync', this.update, this);

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';

        $(this.el).find('#spinner').hide();

        this.drawSearchTable('#events-report-table');

    },

    drawSearchTable: function(location) {

        var ns = this.defaults;
        var self = this;

        var tableData = this.collection.toJSON();

        var finalResults = [];

        _.each(tableData, function(item) {

            item.id = item.id || '';
            item.event_type = item.event_type || '';
            item.source_id = item.source_id || '';
            item.source_name = item.source_name || '';
            item.message = item.message || '';
            item.created = item.created || '';

            finalResults.push([item.created, item.event_type, item.message, item.id, item.source_id, item.source_name]);
        });


        var oTable;

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();

            // draw(false) = keep current page when adding additional rows
            oTable.rows.add(finalResults).draw(false);
        } else {
            var oTableParams = {
                "info": false,
                "processing": false,
                "lengthChange": true,
                "paging": true,
                "searching": true,
                "order": [
                    [0, 'desc']
                ],
                "ordering": true,
                "serverSide": false,
                "data": finalResults,
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
        // '<th>Id</th>' +
        // '<th>Source Id</th>' +
        // '<th>Source Name</th>' +
        '</tr>' +
        '</thead>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>')
});
