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

    processListenersForServerSide: function() {
        // overwriting so that dataTable only renders as a result of actions
        // from viz above
    },

    predefinedSearchUrl: null,

    predefinedSearch: function(uuid) {
        var self = this;

        // turn off refresh range as a signal to the user that refreshes
        // will no longer be occuring without changing the lookback
        // or refresh. setZoomed will block the action of the cached refresh
        $('#global-refresh-range').val(-1);
        this.trigger('setZoomed', true);

        // the presence of a predefinedSearchUrl will take precidence
        // when creating a fetch url in the ajax.beforeSend routine.
        this.predefinedSearchUrl = uuid;
        oTable = $("#reports-result-table").DataTable();
        oTable.ajax.reload(function() {
            setTimeout(function() {

                // manually retrigger column auto adjust which was not firing
                oTable.columns.adjust().draw();
            }, 10);

        });
    },

    update: function() {
        var oTable;

        // clear out the saved search url so next time the viz is
        // triggered it will not return the previously saved url
        this.predefinedSearchUrl = null;

        if ($.fn.dataTable.isDataTable("#reports-result-table")) {
            oTable = $("#reports-result-table").DataTable();
            oTable.ajax.reload(function() {
                setTimeout(function() {

                    // manually retrigger column auto adjust which was not firing
                    oTable.columns.adjust().draw();
                }, 10);

            });
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
            "ordering": true,
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
                    // the pageSize and searchQuery are jQuery values
                    var pageSize = $(self.el).find('select.form-control').val();
                    var searchQuery = $(self.el).find('input.form-control').val();

                    // the paginationStart is taken from the dataTables
                    // generated serverSide query string that will be
                    // replaced by this.defaults.url after the required
                    // components are parsed out of it
                    var paginationStart = settings.url.match(/start=\d{1,}&/gi);
                    paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
                    var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                    var urlColumnOrdering = decodeURIComponent(settings.url).match(/order\[0\]\[column\]=\d*/gi);

                    // capture which column was clicked
                    // and which direction the sort is called for

                    var urlOrderingDirection = decodeURIComponent(settings.url).match(/order\[0\]\[dir\]=(asc|desc)/gi);

                    // if a predefined search url has been set
                    // use that instead of the generated url
                    settings.url = (self.predefinedSearchUrl ? self.predefinedSearchUrl + '?' : self.collectionMixin.url + '&') + "page_size=" + pageSize +
                        "&page=" + computeStartPage;

                    // here begins the combiation of additional params
                    // to construct the final url for the dataTable fetch
                    if (searchQuery) {
                        settings.url += "&_all__regexp=.*" +
                            searchQuery + ".*";
                    }

                    // if no interesting sort, ignore it
                    if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

                        // or, if something has changed, capture the
                        // column to sort by, and the sort direction

                        // generalize if sorting is implemented server-side
                        var columnLabelHash = {
                            0: '@timestamp',
                            1: 'syslog_severity',
                            2: 'component',
                            3: 'host',
                            4: 'log_message'
                        };

                        var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

                        var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

                        var ascDec;
                        if (orderByDirection === 'asc') {
                            ascDec = '';
                        } else {
                            ascDec = '-';
                        }

                        // uncomment when ordering is in place.
                        // settings.url = settings.url + "&ordering=" +
                            // ascDec + columnLabelHash[orderByColumn];
                    }

                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = self.serverSideDataPrep(data);
                    return data;
                }
            }
        };
    },

    serverSideDataPrep: function(data) {
        data = JSON.parse(data);

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
