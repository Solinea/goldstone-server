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
                console.log('no len');
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
                var result = data.results[0].value;
                $(self.el).find('.reports-results-container').html('');
                _.each(result, function(item, i) {
                    $(self.el).find('.reports-results-container').append(_.keys(result)[i] + ' ', result[i]);
                });

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
        '<li>No reports available</li>' +
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
        '</div>')

});
