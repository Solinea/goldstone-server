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
Much of the functionality is encompassed by the jQuery
dataTables plugin which is documented at
http://datatables.net/reference/api/

EXAMPLE SERVERSIDE DATATABLE IMPLEMENTATION ON APIBROWSERPAGEVIEW:
------------------------------------------------------------------

// instantiated only for access to url generation functions
    this.apiBrowserTableCollection = new GoldstoneBaseCollection({
        skipFetch: true
    });
    this.apiBrowserTableCollection.urlBase = "/core/apiperf/search/";
    this.apiBrowserTableCollection.addRange = function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    };

    this.apiBrowserTable = new ApiBrowserDataTableView({
        chartTitle: 'Api Browser',
        collectionMixin: this.apiBrowserTableCollection,
        el: '#api-browser-table',
        infoIcon: 'fa-table',
        width: $('#api-browser-table').width()
    });

*/

var DataTableBaseView = GoldstoneBaseView2.extend({

    render: function() {
        this.$el.html(this.template());
        $(this.el).find('.refreshed-report-container').append(this.dataTableTemplate());
        return this;
    },

    preprocess: function(data) {
        return data;
    },

    // keys will be pinned in descending value order due to 'unshift' below
    headingsToPin: {
        'name': 0
    },

    update: function() {
        console.log('MUST DEFINE UPDATE IN SUBCLASS');
    },

    // search for headingsToPin anywhere in column heading
    // exact match only
    isPinnedHeading: function(item) {
        for (var key in this.headingsToPin) {
            if (item === key) {
                return true;
            }
        }
        return false;
    },

    sortRemainingKeys: function(arr) {
        arr = arr.sort(function(a, b) {
            if (a < b) {
                return -1;
            } else {
                return 1;
            }
        });
        return arr;
    },

    pruneUndefinedValues: function(arr) {
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === undefined) {
                arr.splice(i, 1);
                i--;
            }
        }
        return arr.reverse();
    },

    dataPrep: function(tableData) {
        var self = this;

        // add a preprocessing step, if needed
        tableData = this.preprocess(tableData);

        // initialize array that will be returned after processing
        var finalResults = [];

        if (typeof (tableData[0]) === "object") {

            // chained underscore function that will scan for the existing
            // object keys, and return a list of the unique keys
            // as not every object contains every key

            var uniqueObjectKeys = _.uniq(_.flatten(_.map(tableData, function(item) {
                return Object.keys(item);
            })));

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

            // append data table headers that match the unique keys
            _.each(uniqueObjectKeys, function(item) {
                $('.data-table-header-container').append('<th>' + item + '</th>');
            });

            // iterate through tableData, and push object values to results
            // array, inserting '' where there is no existing value

            _.each(tableData, function(value) {
                var subresult = [];
                _.each(uniqueObjectKeys, function(item) {
                    if (value[item] === undefined) {
                        subresult.push('');
                    } else {
                        subresult.push(value[item]);
                    }
                });
                finalResults.push(subresult);
            });

        } else {

            $('.data-table-header-container').append('<th>Result</th>');
            _.each(tableData, function(item) {
                finalResults.push([item]);
            });
        }
        return finalResults;
    },

    oTableParamGeneratorBase: function(data) {
        return {
            "scrollX": "100%",
            "info": true,
            "processing": false,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "order": [
                [0, 'desc']
            ],
            "ordering": true,
            "data": data,
            "serverSide": false
        };
    },

    addOTableParams: function(options) {
        return options;
    },

    oTableParamGenerator: function(data) {
        result = this.oTableParamGeneratorBase(data);

        // hook to add additional paramaters to the options hash
        result = this.addOTableParams(result);
        return result;
    },


    // invoked on subclass
    drawSearchTable: function(location, data) {

        // variables to capture current state of dataTable
        var currentTop; // capture top edge of screen
        var recordsPerPage; // capture records per page
        var currentSearchBox; // capture search box contents

        this.hideSpinner();

        if (data === null) {
            data = ['No results within selected time range'];
        }

        var self = this;
        var oTable;

        // removes initial placeholder message
        $(this.el).find('.reports-info-container').remove();

        if ($.fn.dataTable.isDataTable(location)) {

            // first use jquery to store current top edge of visible screen
            currentTop = $(document).scrollTop();
            recordsPerPage = $(this.el).find('[name="reports-result-table_length"]').val();
            currentSearchBox = $(this.el).find('[type="search"]').val();

            // if dataTable already exists:
            // complete remove it from memory and the dom
            oTable = $(location).DataTable();
            oTable.destroy({
                remove: true
            });

            // and re-append the table structure that will be repopulated
            // with the new data
            $(this.el).find('.refreshed-report-container')
                .html(this.dataTableTemplate());
        }

        data = this.dataPrep(data);
        var oTableParams = this.oTableParamGenerator(data);
        oTable = $(location).DataTable(oTableParams);

        // restore recordsPerPage
        if (recordsPerPage !== undefined) {
            oTable.page.len(recordsPerPage);
        }

        // lowercase dataTable returns reference to instantiated table
        oTable = $(location).dataTable();

        // restore currentSearchBox
        if (currentSearchBox !== undefined) {
            oTable.fnFilter(currentSearchBox);
        }

        // restore top edge of screen to couteract 'screen jump'
        if (currentTop !== undefined) {
            $(document).scrollTop(currentTop);
        }

    },

    drawSearchTableServerSide: function(location) {
        var self = this;
        this.hideSpinner();

        // lookback listeners not already added,
        // see note in processListenersForServerSide
        this.processListenersForServerSide();

        var oTableParams = this.oTableParamGenerator();

        // removes initial placeholder message
        $(this.el).find('.reports-info-container').remove();

        // inserts table column headers
        $(this.el).find('.data-table-header-container').remove();
        $(this.el).find('.data-table-thead').append(this.serverSideTableHeadings());

        self.oTable = $(location).DataTable(oTableParams);

    },

    processListenersForServerSide: function() {
        /*
        listeners are added in the BaseView only for views that are linked to
        collections. Since this is a server-side-processing dataTable, it has
        not been linked. Therefore, add a listener so that when the
        globalLookback selector is changed, invoke the update function
        */

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            this.getGlobalLookbackRefresh();
            this.update();
        });
    },

    // specify <tr>'s' and <th>'s on subclass
    serverSideTableHeadings: _.template(''),

    template: _.template(

        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="reports-info-container">' +
        '<br>Loading...' +
        '</div>' +
        '<div class="refreshed-report-container"></div>'
    ),

    dataTableTemplate: _.template(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead class="data-table-thead">' +
        '<tr class="header data-table-header-container">' +

        // necessary <th> is appended here by jQuery in this.dataPrep()
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>'
    )
});
