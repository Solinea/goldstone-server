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

// backbone test start

var ApiPerfModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
        "avg": 1,
        "key": 1,
        "max": 1,
        "min": 0
    }
});

var ApiPerfCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log('data.length',data.length);
        return JSON.parse(data);
    },

    model: ApiPerfModel,
    url: "/nova/api_perf?start=1409006640&end=1409011712&interval=120s&render=false",

    initialize: function() {
        this.fetch();
    }
});

var ApiPerfView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 30, right: 30, bottom: 60, left: 60
        },
        width: 525,
        height: 300,
        svg: null,
        chart: null,
        yAxisLabel: "Response Time (ms)",
        location: "#api-perf-report-r3-c2",
        start: 1409006640,
        end: 1409011712,
        interval: 120,
        infoCustom: [{
            key: "API Call",
            value: "demo chart"
        }],
        mw: null,
        mh: null

    },

    initialize: function() {

        this.model.on('sync', this.render, this);

        var ns = this.defaults;
        var height = ns.height;
        var json = this.model.toJSON();
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;

        $(ns.location).append(
            '<div id = "glance-api-perf-panel" class="panel panel-primary">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title"><i class="fa fa-tasks"></i> Demo API Performance' +
            '<i class="pull-right fa fa-info-circle panel-info"  id="demo-api-perf-info"></i>' +
            '</h3></div>');

        this.defaults.svg = d3.select(ns.location).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        this.defaults.chart = ns.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        json.forEach(function(d) {
            d.time = moment(Number(d.key));
        });

        // chart info button popover generator
        var htmlGen = function() {
            var start = moment(goldstone.time.fromPyTs(ns.start)).format(),
                end = moment(goldstone.time.fromPyTs(ns.end)).format(),
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

        $('#demo-api-perf-info').popover({
            trigger: 'manual',
            content: htmlGen.apply(this),
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('toggle');

                // passing an arg to setTimeout is not supported in IE < 10
                // see https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout#Callback_arguments
                setTimeout(function(d) {
                    $(d).popover('hide');
                }, 3000, targ);
            });


    },

    render: function() {

        console.log('render called');

        var ns = this.defaults;
        var json = this.model.toJSON();
        var mw = ns.mw;
        var mh = ns.mh;

        if (this.model.toJSON().length === 0) {
            $(ns.location).append("<p>Response was empty.</p>");
            $(ns.spinner).hide();
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
            .rangeRound([0, mw]),
            y = d3.scale.linear()
            .domain([0, d3.max(json, function(d) {
                return d.max;
            })])
            .range([mh, 0]),
            area = d3.svg.area()
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
            .orient("bottom"),
            yAxis = d3.svg.axis()
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

    }
});

// backbone test end
