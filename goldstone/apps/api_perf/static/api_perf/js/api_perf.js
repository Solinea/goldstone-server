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
        idAttribute: "key"
    });

    var ApiPerfCollection = Backbone.Collection.extend({

        parse: function(data){
            return JSON.parse(data);
        },

        model: ApiPerfModel,

        url: "/nova/api_perf?start=1409006640&end=1409011712&interval=120s&render=false"
    });

    var ApiPerfView = Backbone.View.extend({

        defaults: {
            margin: {top: 30, right: 30, bottom: 60, left: 60},
            width: 525,
            height: 200,
            svg: null,
            yAxisLabel: "Response Time (ms)"
        },

        initialize: function(){

            var height = this.defaults.height;

            this.defaults.svg = d3.select("#api-perf-report-r3-c2").append("svg")
                .attr("width", this.defaults.width)
                .attr("height", this.defaults.height);

            this.defaults.chart = this.defaults.svg
                .append("g")
                .attr("class", "chart")
                .attr("transform", "translate(" + this.defaults.margin.left + "," + this.defaults.margin.top + ")");

            this.model.on('sync', this.render, this);

            var mw = this.defaults.width - this.defaults.margin.left - this.defaults.margin.right;
            var mh = this.defaults.height - this.defaults.margin.top - this.defaults.margin.bottom;
        },

        render: function(){


            var height = this.defaults.height;
            console.log('render called');
            // var svg = this.defaults.svg;
            var json = this.model.toJSON();
            var ns = this.defaults;
            var mw = this.defaults.width - this.defaults.margin.left - this.defaults.margin.right;
            var mh = this.defaults.height - this.defaults.margin.top - this.defaults.margin.bottom;

            // var svg = this.defaults.svg[0];
            // var chart = this.defaults.chart[0];

            /* var rectangles = svg.selectAll("rect")
                .data(this.model.toJSON());

            rectangles
                .attr("width", function(d) { return 4; })
                .attr("height", function(d) { return 4; })
                .attr("x", function(d, i) { return i*3; })
                .attr("y", function(d) { return (height - d.max/10); });

            rectangles
                .enter().append("rect")
                .attr("width", function(d) { return 4; })
                .attr("height", function(d) { return 4; })
                .attr("x", function(d, i) { return i*3; })
                .attr("y", function(d) { return (height - d.max/10); });

            rectangles
                .exit().remove();
            */

            if(this.model.toJSON().length === 0){
                $(this.ns.location).append("<p>Response was empty.");
                $(this.ns.spinner).hide();
                return;
            }

            json.forEach(function(d){
                d.time = moment(Number(d.key));
            });

            var x = d3.time.scale()
                .domain(d3.extent(json, function (d) { return d.time; }))
                .rangeRound([0, mw]),
            y = d3.scale.linear()
                .domain([0, d3.max(json, function (d) { return d.max; })])
                .range([mh, 0]),
            area = d3.svg.area()
                .interpolate("basis")
                .tension(0.85)
                .x(function (d) { return x(d.time); })
                .y0(function (d) { return y(d.min); })
                .y1(function (d) { return y(d.max); }),
            maxLine = d3.svg.line()
                .interpolate("basis")
                .tension(0.85)
                .x(function (d) { return x(d.time); })
                .y(function (d) { return y(d.max); }),
            minLine = d3.svg.line()
                .interpolate("basis")
                .tension(0.85)
                .x(function (d) { return x(d.time); })
                .y(function (d) { return y(d.min); }),
            avgLine = d3.svg.line()
                .interpolate("basis")
                .tension(0.85)
                .x(function (d) { return x(d.time); })
                .y(function (d) { return y(d.avg); }),
            hiddenBar = ns.chart.selectAll(ns.location + ' .hiddenBar')
                .data(json),
            hiddenBarWidth = mw / json.length,
            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom"),
            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left"),
            tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(function (d) {
                    return "<p>" + d.time.format()  + "<br>Max: " + d.max.toFixed(2) +
                        "<br>Avg: " + d.avg.toFixed(2) + "<br>Min: " + d.min.toFixed(2) + "<p>";
                });

            // initialized the axes

            ns.svg.append("text")
                .attr("class", "axis.label")
                .attr("transform", "rotate(-90)")
                .attr("x", 0 - (ns.height / 2))
                .attr("y", -5)
                .attr("dy", "1.5em")
                .text(ns.yAxisLabel)
                .style("text-anchor", "middle");

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
                .attr("transform", function (d, i) {
                    return "translate(" + i * hiddenBarWidth + ",0)";
                });

            // ENTER + UPDATE
            // Appending to the enter selection expands the update selection to include
            // entering elements; so, operations on the update selection after appending to
            // the enter selection will apply to both entering and updating nodes.

            // hidden rectangle for tooltip tethering
            hiddenBar.append("rect")
                .attr('class', 'partialHiddenBar')
                .attr("id", function (d, i) { return "verticalRect" + i; })
                .attr("y", function (d) { return y(d.max); })
                .attr("height", function (d) { return mh - y(d.max); })
                .attr("width", hiddenBarWidth);
            // narrow guideline turns on when mouse enters hidden bar
            hiddenBar.append("rect")
                .attr("class", "verticalGuideLine")
                .attr("id", function (d, i) { return "verticalGuideLine" + i; })
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
                .on('mouseenter', function (d, i) {
                    var rectId = ns.location + " #verticalRect" + i,
                        guideId = ns.location + " #verticalGuideLine" + i,
                        targ = d3.select(guideId).pop().pop();
                    d3.select(guideId).style("opacity", 0.8);
                    tip.offset([50, 0]).show(d, targ);
                })
                .on('mouseleave', function (d, i) {
                    var id = ns.location + " #verticalGuideLine" + i;
                    d3.select(id).style("opacity", 0);
                    tip.hide();
                });

            // EXIT
            // Remove old elements as needed.
            console.log('hiddenBar',hiddenBar);
            hiddenBar.exit().remove();

        }

    });



// backbone test end
