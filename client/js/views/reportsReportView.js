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
This view makes up the "Reports" tab of nodeReportView.js
It is sub-classed from GoldstoneBaseView.

Instantiated on nodeReportView as:

this.reportsReportCollection = new ReportsReportCollection({
    globalLookback: ns.globalLookback,
    nodeName: hostName
});

this.reportsReport = new ReportsReportView({
    collection: this.reportsReportCollection,
    el: '#node-report-panel #reportsReport',
    width: $('#node-report-panel #reportsReport').width(),
    nodeName: hostName
});
*/

var ReportsReportView = GoldstoneBaseView.extend({

    urlGen: function(report) {

        // request page_size=1 in order to only
        // retrieve the latest result

        var urlRouteConstruction = '/core/reports/?name=' +
            report + '&page_size=1&node=' +
            this.defaults.hostName;
        return urlRouteConstruction;
    },

    instanceSpecificInit: function(options) {

        // processes the passed in hash of options when object is instantiated
        this.processOptions();
        // sets page-element listeners, and/or event-listeners
        this.processListeners();
        // creates the popular mw / mh calculations for the D3 rendering
        this.processMargins();
        // Appends this basic chart template, usually overwritten
        this.render();
        // basic assignment of variables to be used in chart rendering
        this.standardInit();
        // appends spinner to el
        this.showSpinner();
        // allows a container for any special afterthoughts that need to
        // be invoked during the initialization of this View, or those that
        // are descendent from this view.
    },

    processOptions: function() {
        this.defaults.chartTitle = this.options.chartTitle || null;
        this.defaults.height = this.options.height || null;
        this.defaults.infoCustom = this.options.infoCustom || null;
        this.el = this.options.el;
        this.defaults.width = this.options.width || null;

        // easy to pass in a unique yAxisLabel. This pattern can be
        // expanded to any variable to allow overriding the default.
        if (this.options.yAxisLabel) {
            this.defaults.yAxisLabel = this.options.yAxisLabel;
        } else {
            this.defaults.yAxisLabel = goldstone.translate("Response Time (s)");
        }

        this.defaults.hostName = this.options.nodeName;
        this.defaults.globalLookback = this.options.globalLookback;

    },

    processListeners: function() {

        var ns = this.defaults;
        var self = this;

        // triggered whenever this.collection finishes fetching
        this.listenTo(this.collection, 'sync', function() {

            // removes spinner that was appended
            // during chart-load
            self.hideSpinner();

            // clears existing 'Reports Available' in dropdown
            $(self.el).find('.reports-available-dropdown-menu > li').remove();

            // if no reports available, appends 'No reports available'
            if (self.collection.toJSON()[0] === undefined || self.collection.toJSON()[0].result.length === 0) {

                $(self.el).find('.reports-available-dropdown-menu').append("<li id='report-result'>" + goldstone.contextTranslate('No reports available.', 'reportsreport') + "</li>");


            } else {
                self.populateReportsDropdown();
            }

            self.clearDataErrorMessage();
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        // this is triggered by a listener set on nodeReportView.js
        this.on('lookbackSelectorChanged', function() {

            // reconstructs the url to fetch in this.collection
            self.collection.defaults.globalLookback = $('#global-lookback-range').val();

            // fetches reports available as far back as the global lookback period
            self.collection.retrieveData();

        });
    },

    processMargins: function() {
        // overwritten so as not to conflict with super-class'
        // method that will calculate irrelevant margins.
        return null;
    },

    render: function() {
        $(this.el).append(this.template());
        $(this.el).find('.refreshed-report-container').append(this.dataTableTemplate());
        return this;
    },

    standardInit: function() {
        // overwritten so as not to conflict with super-class'
        // method that will calculate irrelevant margins.
        return null;
    },

    dataPrep: function(tableData) {

        var ns = this.defaults;
        var self = this;

        // initialize array that will be returned after processing
        var finalResults = [];

        if (typeof(tableData[0]) === "object") {

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
                if (item.indexOf('name') === -1) {
                    continue;
                } else {
                    var spliced = uniqueObjectKeys.splice(i, 1);
                    keysWithName.push(spliced);
                    i--;
                }
            }
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

    drawSearchTable: function(location, data) {

        if (data !== null) {
            data = [goldstone.translate('No results within selected time range.')];
        }

        var ns = this.defaults;
        var self = this;
        var oTable;

        // removes initial placeholder message
        $(this.el).find('.reports-info-container').remove();

        if ($.fn.dataTable.isDataTable(location)) {

            // if dataTable already exists:
            oTable = $(location).DataTable();

            // complete remove it from memory and the dom
            oTable.destroy({
                remove: true
            });

            // and re-append the table structure that will be repopulated
            // with the new data
            $(this.el).find('.refreshed-report-container')
                .html(this.dataTableTemplate());
        }

        data = this.dataPrep(data);
        var oTableParams = {
            "info": true,
            "processing": false,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "order": [
                [0, 'asc']
            ],
            "ordering": true,
            "data": data,
            "serverSide": false
        };
        oTable = $(location).DataTable(oTableParams);

    },

    populateReportsDropdown: function() {
        var ns = this.defaults;
        var self = this;

        _.each(self.collection.toJSON()[0].result, function(item) {
            $(self.el).find('.reports-available-dropdown-menu').append('<li style="cursor: context-menu;" id="report-result">' + _.keys(item)[0] + "</li>");
        });

        // add click listeners to dropdown entries
        $(self.el).find('.reports-available-dropdown-menu > li').on('click', function(e) {
            ns.spinnerDisplay = "inline";
            $(self.el).find('#spinner').show();

            // $.get report based on
            var reportUrl = self.urlGen(e.currentTarget.innerText);

            $.ajax({
                url: reportUrl,
                success: function(data) {
                    $(self.el).find('.panel-header-report-title').text(': ' + e.currentTarget.innerText);
                    $(self.el).find('#spinner').hide();

                    // render data table:
                    self.drawSearchTable('#reports-result-table', data.results[0].value);
                    self.clearDataErrorMessage();
                },
                error: function(data) {
                    self.dataErrorMessage(null, data);
                }
            });

        });
    },

    template: _.template(

        // render dropdown button
        '<div class="dropdown">' +
        '<button id="dLabel" type="button" class="btn btn-default" data-toggle="dropdown" aria-haspopup="true" role="button" aria-expanded="false">' +
        '<%=goldstone.contextTranslate(\'Reports Available\', \'reportsreport\')%> ' +
        '<span class="caret"></span>' +
        '</button>' +
        '<ul class="reports-available-dropdown-menu dropdown-menu" role="menu" aria-labelledby="dLabel">' +
        '<li><%=goldstone.contextTranslate(\'Reports list loading or not available.\', \'reportsreport\')%></li>' +
        '</ul>' +
        '</div><br>' +

        // spinner container
        '<div class="reports-spinner-container"></div>' +

        // render report data title bar
        '<div class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> <%=goldstone.contextTranslate(\'Report Data\', \'reportsreport\')%>' +
        '<span class="panel-header-report-title"></span>' +
        '</h3>' +
        '</div>' +

        // initially rendered message this will be overwritten by dataTable
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="reports-info-container">' +
        '<br><%=goldstone.contextTranslate(\'Selecting a report from the dropdown above will populate this area with the report results.\', \'reportsreport\')%>' +
        '</div>' +

        '</div>' +
        '<div class="refreshed-report-container"></div>'
    ),

    dataTableTemplate: _.template(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header data-table-header-container">' +

        // necessary <th> is appended here by jQuery in this.dataPrep()
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>'
    )


});
