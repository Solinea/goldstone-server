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

var ApiBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        ApiBrowserDataTableView.__super__.instanceSpecificInit.apply(this, arguments);
        this.drawSearchTableServerSide('#reports-result-table');
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
            "ordering": true,
            "order": [
                [0, 'desc']
            ],
            "columnDefs": [{
                    "data": "_source.@timestamp",
                    "type": "date",
                    "targets": 0,
                    "sortable": false,
                    "render": function(data, type, full, meta) {
                        return moment(data).format();
                    }
                }, {
                    "data": "_source.host",
                    "targets": 1,
                    "sortable": false
                }, {
                    "data": "_source.client_ip",
                    "targets": 2,
                    "sortable": false
                }, {
                    "data": "_source.uri",
                    "targets": 3,
                    "sortable": false
                }, {
                    "data": "_source.response_status",
                    "targets": 4,
                    "sortable": false
                }, {
                    "data": "_source.response_time",
                    "targets": 5,
                    "sortable": false
                }, {
                    "data": "_source.response_length",
                    "targets": 6,
                    "sortable": false
                }, {
                    "data": "_source.component",
                    "targets": 7,
                    "sortable": false
                }, {
                    "data": "_source.type",
                    "targets": 8,
                    "sortable": false
                }

            ],
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

                    // if no interesting sort, ignore it
                    if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

                        // or, if something has changed, capture the
                        // column to sort by, and the sort direction

                        // generalize if sorting is implemented server-side
                        var columnLabelHash = {
                            0: '@timestamp',
                            1: 'host',
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
                    data = JSON.parse(data);

                    // apiViz will handle rendering of aggregations
                    self.sendAggregationsToViz(data);

                    // process data for dataTable consumption
                    data = self.serverSideDataPrep(data);
                    return data;
                }
            }
        };
    },

    prepDataForViz: function(data) {
        // initialize container for formatted results
        var finalResult = [];

        // for each array index in the 'data' key
        _.each(data.aggregations.per_interval.buckets, function(item) {
            var tempObj = {};
            tempObj.time = item.key;
            tempObj.count = item.doc_count;
            finalResult.push(tempObj);
        });

        return finalResult;
    },

    sendAggregationsToViz: function(data) {

        // send data to collection to be rendered via apiBrowserView
        // when the 'sync' event is triggered
        this.collectionMixin.reset();
        this.collectionMixin.add(this.prepDataForViz(data));
        this.collectionMixin.trigger('sync');
    },

    serverSideDataPrep: function(data) {
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
        '<th><%=goldstone.contextTranslate(\'timestamp\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'host\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'client ip\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'uri\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'status\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'response time\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'length\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'component\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'type\', \'apibrowserdata\')%></th>' +
        '</tr>'
    )
});
