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

// view is linked to collection when instantiated in api_perf_report.html

var ApiPerfView = Backbone.View.extend({

    // adapted from
    // goldstone.charts.bivariateWithAverage

    defaults: {
        margin: {

            // goldstone.settings.charts.margins:
            // {top: 30, bottom: 60, right: 30, left: 50}
            top: goldstone.settings.charts.margins.top,
            right: goldstone.settings.charts.margins.right,
            bottom: goldstone.settings.charts.margins.bottom,

            // creates breathing room between y-axis-label and chart
            left: goldstone.settings.charts.margins.left + 20
        },
        yAxisLabel: "Response Time (ms)"
    },

    initialize: function(options) {

        this.options = options || {};

        // essential for unique chart objects,
        // as objects/arrays are pass by reference
        this.defaults = _.clone(this.defaults);

        this.defaults.chartTitle = this.options.chartTitle;
        this.defaults.height = this.options.height;
        this.defaults.infoCustom = this.options.infoCustom;
        this.el = this.options.el;
        this.defaults.width = this.options.width;
        this.defaults.start = this.collection.defaults.reportParams.start;
        this.defaults.end = this.collection.defaults.reportParams.end;
        this.defaults.interval = this.collection.defaults.reportParams.interval;

        // easy to pass in a unique yAxisLabel. This pattern can be
        // expanded to any variable to allow overriding the default.
        if (this.options.yAxisLabel) {
            this.defaults.yAxisLabel = this.options.yAxisLabel;
        }

        var ns = this.defaults;
        var self = this;

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

            $(this.el).find('#api-perf-info').popover({
                content: this.htmlGen.apply(this),
            });

            $(this.el).find('#spinner').show();
        });


        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height / 2)
            });
        });

        this.render();

        this.defaults.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        this.defaults.chart = ns.svg
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

        // chart info button popover generator
        this.htmlGen = function() {
            var start = moment(goldstone.time.fromPyTs(ns.start / 1000)).format();
            var end = moment(goldstone.time.fromPyTs(ns.end / 1000)).format();
            var custom = _.map(ns.infoCustom, function(e) {
                return e.key + ": " + e.value + "<br>";
            });
            var result = '<div class="infoButton"><br>' + custom +
                'Start: ' + start + '<br>' +
                'End: ' + end + '<br>' +
                'Interval: ' + ns.interval + '<br>' +
                '<br></div>';
            return result;
        };

        $(this.el).find('#api-perf-info').popover({
            trigger: 'manual',
            content: function() {
                return self.htmlGen.apply(this);
            },
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('toggle');
            })
            .on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('hide');
            });

        ns.colorArray = new GoldstoneColors().get('colorSets');

    },

    clearDataErrorMessage: function() {
        // if error message already exists on page,
        // remove it in case it has changed
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }
    },

    dataErrorMessage: function(message, errorMessage) {

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        this.clearDataErrorMessage();

        if (errorMessage !== undefined) {
            message = errorMessage.responseText;
            // message = message.slice(1, -1);
            message = '' + errorMessage.status + ' error: ' + message;
        }

        $('<span id="noDataReturned">' + message + '</span>').appendTo(this.el)
            .css({
                'position': 'relative',
                'margin-left': -200,
                'top': -$(this.el).height() / 2 - 50
            });

    },

    update: function() {

        var ns = this.defaults;
        var self = this;
        var json = this.collection.toJSON();
        var mw = ns.mw;
        var mh = ns.mh;


        if (this.collection.toJSON().length === 0) {

            this.dataErrorMessage('No Data Returned');
            return;
        }

        this.clearDataErrorMessage();

        $(this.el).find('svg').find('.chart').html('');
        $(this.el + '.d3-tip').detach();

        json.forEach(function(d) {
            d.time = moment(Number(d.key));
        });

        var x = d3.time.scale()
            .domain(d3.extent(json, function(d) {
                return d.time;
            }))
            .rangeRound([0, mw]);

        var y = d3.scale.linear()
            .domain([0, d3.max(json, function(d) {
                return d.max;
            })])
            .range([mh, 0]);

        var area = d3.svg.area()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return x(d.time);
            })
            .y0(function(d) {
                return y(d.min);
            })
            .y1(function(d) {
                return y(d.max);
            });

        var maxLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return x(d.time);
            })
            .y(function(d) {
                return y(d.max);
            });

        var minLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return x(d.time);
            })
            .y(function(d) {
                return y(d.min);
            });

        var avgLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return x(d.time);
            })
            .y(function(d) {
                return y(d.avg);
            });

        var hiddenBar = ns.chart.selectAll(this.el + ' .hiddenBar')
            .data(json);

        var hiddenBarWidth = mw / json.length;

        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(5)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return "<p>" + d.time.format() + "<br>Max: " + d.max.toFixed(2) +
                    "<br>Avg: " + d.avg.toFixed(2) + "<br>Min: " + d.min.toFixed(2) + "<p>";
            });

        // Invoke the tip in the context of your visualization

        ns.chart.call(tip);

        // initialize the chart lines

        ns.chart.append("path")
            .datum(json)
            .attr("class", "area")
            .attr("id", "minMaxArea")
            .attr("d", area)
            .attr("fill", ns.colorArray.distinct[3][1])
            .style("opacity", 0.3);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'minLine')
            .attr('data-legend', "Min")
            .style("stroke", ns.colorArray.distinct[3][0])
            .datum(json)
            .attr('d', minLine);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'maxLine')
            .attr('data-legend', "Max")
            .style("stroke", ns.colorArray.distinct[3][2])
            .datum(json)
            .attr('d', maxLine);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'avgLine')
            .attr('data-legend', "Avg")
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke", ns.colorArray.grey[0][0])
            .datum(json)
            .attr('d', avgLine);

        ns.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + mh + ')')
            .call(xAxis);

        ns.chart.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        var legend = ns.chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20,0)")
            .call(d3.legend);

        // UPDATE
        // Update old elements as needed.

        // ENTER
        // Create new elements as needed.

        hiddenBar.enter()
            .append('g')
            .attr("transform", function(d, i) {
                return "translate(" + i * hiddenBarWidth + ",0)";
            });

        // ENTER + UPDATE
        // Appending to the enter selection expands the update selection to include
        // entering elements; so, operations on the update selection after appending to
        // the enter selection will apply to both entering and updating nodes.

        // hidden rectangle for tooltip tethering

        hiddenBar.append("rect")
            .attr('class', 'partialHiddenBar')
            .attr("id", function(d, i) {
                return "verticalRect" + i;
            })
            .attr("y", function(d) {
                return y(d.max);
            })
            .attr("height", function(d) {
                return mh - y(d.max);
            })
            .attr("width", hiddenBarWidth);

        // narrow guideline turns on when mouse enters hidden bar

        hiddenBar.append("rect")
            .attr("class", "verticalGuideLine")
            .attr("id", function(d, i) {
                return "verticalGuideLine" + i;
            })
            .attr("x", 0)
            .attr("height", mh)
            .attr("width", 1)
            .style("opacity", 0);

        // wide guideline with mouse event handling to show guide and
        // tooltip.

        hiddenBar.append("rect")
            .attr('class', 'hiddenBar')
            .attr("height", mh)
            .attr("width", hiddenBarWidth)
            .on('mouseenter', function(d, i) {
                var rectId = self.el + " #verticalRect" + i,
                    guideId = self.el + " #verticalGuideLine" + i,
                    targ = d3.select(guideId).pop().pop();
                d3.select(guideId).style("opacity", 0.8);
                tip.offset([50, 0]).show(d, targ);
            })
            .on('mouseleave', function(d, i) {
                var id = self.el + " #verticalGuideLine" + i;
                d3.select(id).style("opacity", 0);
                tip.hide();
            });

        // EXIT
        // Remove old elements as needed.

        $(this.el).find('#spinner').hide();

    },

    template: _.template(
        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="api-perf-info"></i>' +
        '</h3></div>'),

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});
