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
 * Author: John Stanford
 */

goldstone.namespace('apiPerf.report');

//-----------------------------
// backbone test start



//-----------------------------
// define model

var ApiPerfModel = Backbone.Model.extend({
    idAttribute: "key"
});


//-----------------------------
// define collection and link to model

var ApiPerfCollection = Backbone.Collection.extend({

    parse: function(data) {
        return JSON.parse(data);
    },

    model: ApiPerfModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});

//-----------------------------
// define view
// view is linked to collection when instantiated in api_perf_report.html

var ApiPerfView = Backbone.View.extend({

    defaults: {
        chart: null,
        chartTitle: null,
        end: null,
        height: null,
        infoCustom: null,
        interval: null,
        location: null,
        margin: {
            // charts.margins: {top: 30, bottom: 60, right: 30, left: 50}
            top: goldstone.settings.charts.margins.top,
            right: goldstone.settings.charts.margins.right,
            bottom: goldstone.settings.charts.margins.bottom,
            left: goldstone.settings.charts.margins.left + 20
        },
        mh: null,
        mw: null,
        start: null,
        svg: null,
        width: null,
        yAxisLabel: "Response Time (ms)"
    },

    initialize: function(options) {

        this.options = options || {};

        this.defaults = _.clone(this.defaults);

        this.defaults.location = this.options.location;
        this.defaults.width = this.options.width;
        this.defaults.height = this.options.height;
        this.defaults.start = this.options.startStopInterval.start;
        this.defaults.end = this.options.startStopInterval.end;
        this.defaults.interval = this.options.startStopInterval.interval;
        this.defaults.chartTitle = this.options.chartTitle;
        this.defaults.infoCustom = this.options.infoCustom;

        this.collection.on('sync', this.render, this);

        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;


        var appendSpinnerLocation = ns.location;
        $('<img id="spinner" src="http://localhost:8000/static/images/ajax-loader-solinea-blue.gif">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height / 2)
            });
        });

        $(ns.location).append(
            '<div id="api-perf-panel-header" class="panel panel-primary">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title"><i class="fa fa-tasks"></i> ' + ns.chartTitle +
            '<i class="pull-right fa fa-info-circle panel-info"  id="api-perf-info"></i>' +
            '</h3></div>');

        this.defaults.svg = d3.select(ns.location).append("svg")
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
        var htmlGen = function() {
            var start = moment(goldstone.time.fromPyTs(ns.start / 1000)).format(),
                end = moment(goldstone.time.fromPyTs(ns.end / 1000)).format(),
                custom = _.map(ns.infoCustom, function(e) {
                    return e.key + ": " + e.value + "<br>";
                }),
                result = '<div class="body"><br>' + custom +
                'Start: ' + start + '<br>' +
                'End: ' + end + '<br>' +
                'Interval: ' + ns.interval + '<br>' +
                '<br></div>';
            return result;
        };

        $(ns.location).find('#api-perf-info').popover({
            trigger: 'manual',
            content: htmlGen.apply(this),
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(ns.location).find(targ).popover('toggle');

                // passing an arg to setTimeout is not supported in IE < 10
                // see https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout#Callback_arguments
                setTimeout(function(d) {
                    $(ns.location).find(targ).popover('hide');
                }, 3000, targ);
            });


    },

    render: function() {

        var ns = this.defaults;
        var json = this.collection.toJSON();
        var mw = ns.mw;
        var mh = ns.mh;

        if (this.collection.toJSON().length === 0) {
            $(ns.location).append("<p>Response was empty.</p>");
            $(ns.location).find('#spinner').hide();
            return;
        }

        $(ns.location).find('svg').find('.chart').html('');
        $(ns.location + '.d3-tip').detach();

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

        var hiddenBar = ns.chart.selectAll(ns.location + ' .hiddenBar')
            .data(json);

        var hiddenBarWidth = mw / json.length,
            xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', ns.location.slice(1))
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
            .attr("fill", colorbrewer.Spectral[10][4])
            .style("opacity", 0.3);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'minLine')
            .attr('data-legend', "Min")
            .style("stroke", colorbrewer.Spectral[10][8])
            .datum(json)
            .attr('d', minLine);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'maxLine')
            .attr('data-legend', "Max")
            .style("stroke", colorbrewer.Spectral[10][1])
            .datum(json)
            .attr('d', maxLine);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'avgLine')
            .attr('data-legend', "Avg")
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke", colorbrewer.Greys[3][1])
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
                var rectId = ns.location + " #verticalRect" + i,
                    guideId = ns.location + " #verticalGuideLine" + i,
                    targ = d3.select(guideId).pop().pop();
                d3.select(guideId).style("opacity", 0.8);
                tip.offset([50, 0]).show(d, targ);
            })
            .on('mouseleave', function(d, i) {
                var id = ns.location + " #verticalGuideLine" + i;
                d3.select(id).style("opacity", 0);
                tip.hide();
            });

        // EXIT
        // Remove old elements as needed.

        $(ns.location).find('#spinner').hide();

    }
});

// backbone test end
