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

instantiated on eventsBrowserPageView as:

    this.eventsBrowserTable = new EventsBrowserDataTableView({
        el: '.events-browser-table',
        chartTitle: 'Events Browser',
        infoIcon: 'fa-table',
        width: $('.events-browser-table').width()
    });

*/

// UPDATE NEEDS TO BE MODIFIED TO CALL THE NEW SEQUENCE OF EVENTS THAT WILL NOT JUST CALL AJAX.UPDATE

var EventsBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        // processes the hash of options passed in when object is instantiated
        this.processOptions();
        this.processListeners();
        this.renderReportContainer();
        this.appendChartHeading();
        this.addModalAndHeadingIcons();
        this.setSpinner();
        this.processListenersForServerSide();
        this.renderFreshTable();
        this.initializeSearchTableServerSide('#reports-result-table');
    },

    processListenersForServerSide: function() {
        this.listenTo(this, 'lookbackSelectorChanged', function() {
            this.getGlobalLookbackRefresh();
            this.update();
        });
    },

    update: function() {
        this.currentTop = $(document).scrollTop();
        this.oTable.ajax.reload();
    },

    oTableParamGeneratorBase: function() {
        var self = this;
        var standardAjaxOptions = {
            "iDisplayLength": self.cachedPageSize,
            "iDisplayStart": self.cachedPaginationStart,
            "lengthChange": true,
            "oSearch": {
                sSearch: self.cachedSearch
            },
            "ordering": false,
            "processing": false,
            "paging": true,
            "scrollX": true,
            "searching": true,
            "serverSide": true,
            "ajax": {
                beforeSend: function(obj, settings) {

                    self.currentTop = $(document).scrollTop();

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


                    // cache values for next serverside deferred rendering
                    self.cachedSearch = searchQuery;
                    self.cachedPageSize = parseInt(pageSize, 10);
                    self.cachedPaginationStart = parseInt(paginationStart, 10);

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
                    /*if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

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
                        //     ascDec + columnLabelHash[orderByColumn];
                    }
                    */

                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = self.serverSideDataPrep(data);

                    // add to event loop to be 
                    setTimeout(function() {
                        self.createNewDataTableFromResults(self.cachedTableHeadings, self.cachedResults);

                    }, 0);

                    return JSON.stringify({
                        results: []
                    });
                },
            }
        }; // end standardAjaxOptions

        // in the case of their being cached data from the last call,
        // deferLoading will skip the ajax call and use the 
        // data already present in the dom
        if (self.cachedResults) {
            standardAjaxOptions.deferLoading = self.cachedResults.recordsTotal;
        }

        return standardAjaxOptions;

    },

    createNewDataTableFromResults: function(headings, results) {
        // at least one <th> required or else dataTables will error
        headings = headings || '<th></th>';

        // removes dataTable handling of table
        // but keeps table present in DOM
        this.oTableApi.fnDestroy();

        this.serverSideTableHeadings = headings;
        this.renderFreshTable();

        var constructedResults = '';
        _.each(results.results, function(line) {
            constructedResults += '<tr><td>';
            constructedResults += line.join('</td><td>');
            constructedResults += '</td></tr>';
        });

        this.$el.find('.data-table-body').append(constructedResults);

        this.initializeSearchTableServerSide('#reports-result-table');

    },

    serverSideDataPrep: function(data) {
        data = JSON.parse(data);
        var result = {
            results: this.extractUniqAndDataSet(data.results),
            recordsTotal: data.count,
            recordsFiltered: data.count
        };
        this.cachedResults = result;
        result = JSON.stringify(result);
        return result;
    },

    serverSideTableHeadings: '' +
        '<th></th>',

    extractUniqAndDataSet: function(data) {
        /*
        strip object down to things in 'traits'
        and then flatten object before returning it to the dataPrep function
        */

        var self = this;
        var result = data.map(function(record) {
            return record._source.traits;
        });

        var uniqueObjectKeys = _.uniq(_.flatten(result.map(function(record) {
            return _.keys(record);
        })));


        // START SORT

        // sort uniqueHeadings to favor order defined
        // by the hash in this.headingsToPin

        // if there is a unique key with "name" somewhere in it,
        // reorder the keys so that it is first
        var keysWithName = [];
        for (var i = 0; i < uniqueObjectKeys.length; i++) {
            var item = uniqueObjectKeys[i];
            if (this.isPinnedHeading(item)) {
                var spliced = uniqueObjectKeys.splice(i, 1);
                keysWithName[this.headingsToPin[item]] = spliced;
                i--;
            } else {
                continue;
            }
        }

        keysWithName = this.pruneUndefinedValues(keysWithName);
        uniqueObjectKeys = this.sortRemainingKeys(uniqueObjectKeys);

        _.each(keysWithName, function(item) {
            uniqueObjectKeys.unshift(item[0]);
        });

        // END SORT


        var headerResult = '';
        _.each(uniqueObjectKeys, function(heading) {
            headerResult += '<th>' + heading + '</th>';
        });
        self.cachedTableHeadings = headerResult;

        // make nested arrays of the final data to return
        var finalResult = result.map(function(unit) {

            return _.map(uniqueObjectKeys, function(heading) {
                return unit[heading] || '';
            });

        });

        return finalResult;
    },

    // keys will be pinned in ascending value order of key:value pair
    headingsToPin: {
        'eventTime': 0,
        'eventType': 1,
        'id': 2,
        'action': 3,
        'outcome': 4,
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="refreshed-report-container"></div>'
    ),

    dataTableTemplate: _.template(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead class="data-table-thead">' +
        '<tr class="header data-table-header-container">' +

        // necessary <th> is appended here by jQuery in this.dataPrep()
        '</tr>' +
        '</thead>' +
        '<tbody class="data-table-body"></tbody>' +
        '</table>'
    ),

    renderReportContainer: function() {
        this.$el.html(this.template());
    },

    renderFreshTable: function() {
        this.hideSpinner();
        $(this.el).find('.refreshed-report-container').html(this.dataTableTemplate());
        $(this.el).find('.data-table-header-container').html(this.serverSideTableHeadings);

        return this;
    },

    initializeSearchTableServerSide: function(location) {
        var oTableParams = this.oTableParamGeneratorBase();

        oTable = this.oTable = $(location).DataTable(oTableParams);
        oTableApi = this.oTableApi = $(location).dataTable();


        // bring focus to search box if not empty
        if ($('input.form-control').val() !== '') {
            $('input.form-control').focus();
        }

        // reposition page to pre-refresh height
        if (this.currentTop !== undefined) {
            $(document).scrollTop(this.currentTop);
        }


    }
});
