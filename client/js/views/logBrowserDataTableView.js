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
the jQuery dataTables plugin is documented at
http://datatables.net/reference/api/

instantiated on apiBrowserPageView as:

    this.eventsBrowserTable = new EventsBrowserDataTableView({
        el: '.events-browser-table',
        chartTitle: 'Events Browser',
        infoIcon: 'fa-table',
        width: $('.events-browser-table').width()
    });

*/

var LogBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        LogBrowserDataTableView.__super__.instanceSpecificInit.apply(this, arguments);
        this.drawSearchTableServerSide('#reports-result-table');
    },

    processListeners: function() {
        // overwriting to remove any chance of sensitivity to inherited
        // listeners of lookback/refresh
    },

    processListenersForServerSide: function() {
        // overwriting to remove sensitivity to global
        // refresh/lookback which is being listened to by the 
        // logBrowserViz view.
    },

    update: function() {
        var oTable;

        if ($.fn.dataTable.isDataTable("#reports-result-table")) {
            oTable = $("#reports-result-table").DataTable();
            oTable.ajax.reload();
        }
    },

    oTableParamGeneratorBase: function() {
        var self = this;
        return {
            "scrollX": "100%",
            "processing": false,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "ordering": false,
            "order": [
                [0, 'desc']
            ],
            "columnDefs": [{
                "data": "@timestamp",
                "type": "date",
                "targets": 0,
                "sortable": false,
                "render": function(data, type, full, meta) {
                    return moment(data).format();
                }
            }, {
                "data": "syslog_severity",
                "targets": 1,
                "sortable": false
            }, {
                "data": "component",
                "targets": 2,
                "sortable": false
            }, {
                "data": "host",
                "targets": 3,
                "sortable": false
            }, {
                "data": "log_message",
                "targets": 4,
                "sortable": false
            }],
            "serverSide": true,
            "ajax": {
                beforeSend: function(obj, settings) {
                    self.collectionMixin.urlGenerator();

                    // extraction methods defined on dataTableBaseView
                    // for the dataTables generated url string that will
                    //  be replaced by self.collectionMixin.url after
                    // the required components are parsed out of it
                    var pageSize = self.getPageSize(settings.url);
                    var searchQuery = self.getSearchQuery(settings.url);
                    var paginationStart = self.getPaginationStart(settings.url);
                    var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                    var sortByColumnNumber = self.getSortByColumnNumber(settings.url);
                    var sortAscDesc = self.getSortAscDesc(settings.url);

                    // the url that will be fetched is now about to be
                    // replaced with the urlGen'd url before adding on
                    // the parsed components
                    settings.url = self.collectionMixin.url + "&page_size=" + pageSize +
                        "&page=" + computeStartPage;

                    // here begins the combiation of additional params
                    // to construct the final url for the dataTable fetch
                    if (searchQuery) {
                        settings.url += "&_all__regexp=.*" +
                            searchQuery + ".*";
                    }

                    // uncomment for ordering by column
                    /*
                    var columnLabelHash = {
                        0: '@timestamp',
                        1: 'syslog_severity',
                        2: 'component',
                        3: 'host',
                        4: 'log_message'
                    };
                    var ascDec = {
                        asc: '',
                        'desc': '-'
                    };
                    settings.url = settings.url + "&ordering=" + ascDec[sortAscDesc] + columnLabelHash[sortByColumnNumber];
                    */
                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = JSON.parse(data);

                    // logViz will handle rendering of aggregations
                    self.sendAggregationsToViz(data);

                    // process data for dataTable consumption
                    data = self.serverSideDataPrep(data);
                    return data;
                }
            }
        };
    },

    sendAggregationsToViz: function(data) {

        // send data to collection to be rendered via logBrowserViz
        // when the 'sync' event is triggered
        this.collectionMixin.reset();
        this.collectionMixin.add(data);
        this.collectionMixin.trigger('sync');
    },

    serverSideDataPrep: function(data) {
        var self = this;

        _.each(data.results, function(item) {

            // if any field is undefined, dataTables throws an alert
            // so set to empty string if otherwise undefined
            item['@timestamp'] = item._source['@timestamp'] || '';
            item.syslog_severity = item._source.syslog_severity || '';
            item.component = item._source.component || '';
            item.log_message = item._source.log_message || '';
            item.host = item._source.host || '';
        });


        var result = {
            results: data.results,
            recordsTotal: data.count,
            recordsFiltered: data.count
        };
        result = JSON.stringify(result);
        return result;
    },

    serverSideTableHeadings: _.template('' +
        '<tr class="header">' +
        '<th><%=goldstone.contextTranslate(\'Timestamp\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Syslog Severity\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Component\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Host\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Message\', \'logbrowserdata\')%></th>' +
        '</tr>'
    )
});
