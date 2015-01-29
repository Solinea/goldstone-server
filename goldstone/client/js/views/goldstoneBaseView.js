/**
 * Copyright 2014 - 2015 Solinea, Inc.
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

// view is linked to collection when instantiated in api_perf_report.html

var GoldstoneBaseView = Backbone.View.extend({

    initialize: function(options) {

        this.options = options || {};

        // essential for unique chart objects,
        // as objects/arrays are pass by reference
        this.defaults = _.clone(this.defaults);

        // breaks down init into discrete steps
        this.processOptions();
        this.processListeners();
        this.processMargins();
        this.render();
        this.standardInit();
        this.showSpinner();
        this.specialInit();
    },

    defaults: {
        margin: {
            top: 30,
            right: 30,
            bottom: 60,
            left: 70
        }
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
            this.defaults.yAxisLabel = "Response Time (ms)";
        }
    },

    processListeners: function() {
        // registers 'sync' event so view 'watches' collection for data update
        this.collection.on('sync', this.update, this);
        this.collection.on('error', this.dataErrorMessage, this);

        // this is triggered by a listener set on nodeReportView.js
        this.on('selectorChanged', function() {
            this.collection.defaults.globalLookback = $('#global-lookback-range').val();
            this.collection.urlGenerator();
            this.collection.fetch();
            this.defaults.start = this.collection.defaults.reportParams.start;
            this.defaults.end = this.collection.defaults.reportParams.end;
            this.defaults.interval = this.collection.defaults.reportParams.interval;

            if ($(this.el).find('#api-perf-info').length) {
                $(this.el).find('#api-perf-info').popover({
                    content: this.htmlGen.apply(this),
                });
            }

            this.defaults.spinnerDisplay = 'inline';
            $(this.el).find('#spinner').show();
        });

    },

    processMargins: function() {
        this.defaults.mw = this.defaults.width - this.defaults.margin.left - this.defaults.margin.right;
        this.defaults.mh = this.defaults.height - this.defaults.margin.top - this.defaults.margin.bottom;
    },

    showSpinner: function() {
        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation;
        if (ns.spinnerPlace) {
            appendSpinnerLocation = $(this.el).find(ns.spinnerPlace);
        } else {
            appendSpinnerLocation = this.el;
        }

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height / 2),
                'display': ns.spinnerDisplay
            });
        });

    },

    hideSpinner: function() {
        this.defaults.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();
    },

    dblclicked: function(coordinates) {
        return null;
    },

    standardInit: function() {
        var ns = this.defaults;
        var self = this;

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        ns.chart = ns.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // initialized the axes
        ns.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (ns.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(ns.yAxisLabel)
            .style("text-anchor", "middle");

        ns.svg.on('dblclick', function(){
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        ns.x = d3.time.scale()
            .rangeRound([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .ticks(5)
            .orient("bottom");

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.colorArray = new GoldstoneColors().get('colorSets');
    },

    specialInit: function() {},

    clearDataErrorMessage: function() {
        // if error message already exists on page,
        // remove it in case it has changed
        if ($(this.el).find('.popup-message').length) {
            $(this.el).find('.popup-message').fadeOut("slow");
        }
    },

    dataErrorMessage: function(message, errorMessage) {

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        if (errorMessage !== undefined) {

            if (errorMessage.responseJSON) {
                message = '';
                if (errorMessage.responseJSON.status_code) {
                    message += errorMessage.responseJSON.status_code + ' error: ';
                }
                if (errorMessage.responseJSON.message) {
                    message += errorMessage.responseJSON.message;
                }

            } else {
                message = '';
                if (errorMessage.status) {
                    message += errorMessage.status + ' error:';
                }
                if (errorMessage.statusText) {
                    message += ' ' + errorMessage.statusText + '.';
                }
                if (errorMessage.responseText) {
                    message += ' ' + errorMessage.responseText + '.';
                }
            }
        }

        // calling raiseAlert with the 3rd param will supress auto-hiding
        goldstone.raiseAlert($(this.el).find('.popup-message'), message, true);

        this.hideSpinner();
    },

    dataPrep: function(data) {
        var result = data;
        return result;
    },

    checkReturnedDataSet: function(data) {
        if (data.length === 0) {
            this.dataErrorMessage('No Data Returned');
            return false;
        } else {
            this.clearDataErrorMessage();
        }
    },

    update: function() {},

    template: _.template(
        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="api-perf-info"></i>' +
        '</h3></div><div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});
