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

var ReportsReportView = Backbone.View.extend({

    defaults: {},

    urlGen: function(report) {

        var urlRouteConstruction = '/core/reports?name=' +
            report +
            '&page_size=1&node=' +
            this.defaults.hostName;
        console.log('urlGen', urlRouteConstruction);
        return urlRouteConstruction;
    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.width = options.width;
        this.defaults.hostName = options.nodeName;
        this.defaults.globalLookback = options.globalLookback;

        var ns = this.defaults;
        var self = this;

        // appends display and modal html elements to this.el
        this.render();

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

        this.update();

        this.collection.on('sync', function() {
            if (self.collection.toJSON()[0].result.length === 0) {

                $(self.el).find('.reports-available-dropdown-menu > li').remove();

                $(self.el).find('.reports-available-dropdown-menu').append('<li id="report-result">No reports available</li>');

            } else {
                self.populateReports();
            }
        });

        // this is triggered by a listener set on nodeReportView.js
        this.on('selectorChanged', function() {
            console.log('selectorChanged');
            this.defaults.globalLookback = $('#global-lookback-range').val();
        });

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

    },

    render: function() {
        $(this.el).append(this.template());
        return this;
    },

    dataPrep: function(data) {

        $('.data-table-header-container > th').remove();

        console.log('data before: ', data);
        var ns = this.defaults;
        var self = this;
        var tableData = data;

        // initialize array that will be returned after processing
        var finalResults = [];

        if (typeof(tableData[0]) === "object") {
            console.log('prepping data as an object');

            // chained underscore function that will scan for the existing
            // object keys, and return a list of the unique keys
            // as not every object contains every key
            var uniqueObjectKeys = _.uniq(_.flatten(_.map(tableData, function(item) {
                return Object.keys(item);
            })));
            console.log('uniqueObjectKeys: ', uniqueObjectKeys);

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
            console.log('uniqueObjectKeys after:', uniqueObjectKeys);


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
            console.log('prepping data as an array');
            _.each(tableData, function(item) {

                // if any field is undefined, dataTables throws an alert
                finalResults.push([item]);
            });
        }

        console.log('data after: ', finalResults);

        return finalResults;
    },

    drawSearchTable: function(location, data) {

        var ns = this.defaults;
        var self = this;
        var oTable;

        if ($.fn.dataTable.isDataTable(location)) {
            console.log('table already exists');
            oTable = $(location).DataTable();
            oTable.destroy({
                remove: true
            });

        $(this.el).find('.refreshed-report-container').append(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header data-table-header-container">' +
        // '<th></th>' +
        // '<th>Event Type</th>' +
        // '<th>Message</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>');

        }
        data = this.dataPrep(data);
        var oTableParams = {
            "info": false,
            "processing": true,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "order": [
                [0, 'asc']
            ],
            "ordering": true,
            "data": data,
            "serverSide": false,
        };
        oTable = $(location).DataTable(oTableParams);


    },

    populateReports: function() {
        var ns = this.defaults;
        var self = this;
        console.log('in populateReports', this.collection.models[0].attributes.result);

        // empty and add results to dropdown
        $(self.el).find('.reports-available-dropdown-menu > li').remove();

        _.each(self.collection.models[0].attributes.result, function(item) {
            $(self.el).find('.reports-available-dropdown-menu').append('<li id="report-result">' + item + "</li>");
        });

        // add click listeners to dropdown entries
        $(self.el).find('.reports-available-dropdown-menu > li').on('click', function(e) {
            ns.spinnerDisplay = "inline";
            $(self.el).find('#spinner').show();

            console.log('clicked', e.currentTarget.innerText);

            // $.get report based on
            var reportUrl = self.urlGen(e.currentTarget.innerText);
            $.get(reportUrl, function(data) {

                // append report name to title bar:
                $(self.el).find('.panel-header-report-title').text(': ' + e.currentTarget.innerText);
                $(self.el).find('#spinner').hide();
                console.log('data', data);

                // appends results to report data container
                /*var result = data.results[0].value;
                $(self.el).find('.reports-results-container').html('');
                _.each(result, function(item, i) {
                    $(self.el).find('.reports-results-container').append(_.keys(result)[i] + ' ', result[i]);
                });*/

                // also render data table:
                self.drawSearchTable('#reports-result-table', data.results[0].value);

            });

        });
    },

    template: _.template(

        // render dropdown button
        '<div class="dropdown">' +
        '<button id="dLabel" type="button" class="btn btn-default" data-toggle="dropdown" aria-haspopup="true" role="button" aria-expanded="false">' +
        'Reports Available ' +
        '<span class="caret"></span>' +
        '</button>' +
        '<ul class="reports-available-dropdown-menu dropdown-menu" role="menu" aria-labelledby="dLabel">' +
        '<li>Reports list loading or not available</li>' +
        '</ul>' +
        '</div><br>' +

        // render report data title bar
        '<div class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Report Data' +
        '<span class="panel-header-report-title"></span>' +
        '</h3>' +
        '</div>' +
        '<div class="reports-results-container">' +
        '<br>Selecting a report from the dropdown above will populate this area with the report results.' +
        '</div>' +
        '</div>' +

        '<div class="refreshed-report-container"></div>' +
        // add search table in here:
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header data-table-header-container">' +
        // '<th></th>' +
        // '<th>Event Type</th>' +
        // '<th>Message</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>'


    )

});
