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

// view is linked to collection when instantiated in goldstone_discover.html

var BulletChartView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {

        this.options = options || {};
        this.defaults = _.clone(this.defaults); 
        this.el = options.el;

        this.defaults.w = options.w;
        this.defaults.data = options.data;
        this.defaults.chartHeader = options.chartHeader || null;

        var ns = this.defaults;
        var self = this;

        this.render();
        this.initSvg();
        this.collection.on('sync', this.update, this);

    },

    initSvg: function() {
        var self = this;
        var ns = this.defaults;

    },

    update: function() {
        var self = this;
        var ns = this.defaults;
        var data = this.collection.toJSON();

        var margin = {
                top: 5,
                right: 40,
                bottom: 20,
                left: 120
            },
            width = 960 - margin.left - margin.right,
            height = 50 - margin.top - margin.bottom;

        d3.bullet = function() {
            var orient = "left", // TODO top & bottom
                reverse = false,
                duration = 0,
                ranges = bulletRanges,
                markers = bulletMarkers,
                measures = bulletMeasures,
                width = 380,
                height = 30,
                tickFormat = null;

            // For each small multiple…
            function bullet(g) {
                g.each(function(d, i) {
                    var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                        markerz = markers.call(this, d, i).slice().sort(d3.descending),
                        measurez = measures.call(this, d, i).slice().sort(d3.descending),
                        g = d3.select(this);

                    // Compute the new x-scale.
                    var x1 = d3.scale.linear()
                        .domain([0, Math.max(rangez[0], markerz[0], measurez[0])])
                        .range(reverse ? [width, 0] : [0, width]);

                    // Retrieve the old x-scale, if this is an update.
                    var x0 = this.__chart__ || d3.scale.linear()
                        .domain([0, Infinity])
                        .range(x1.range());

                    // Stash the new scale.
                    this.__chart__ = x1;

                    // Derive width-scales from the x-scales.
                    var w0 = bulletWidth(x0),
                        w1 = bulletWidth(x1);

                    // Update the range rects.
                    var range = g.selectAll("rect.range")
                        .data(rangez);

                    range.enter().append("rect")
                        .attr("class", function(d, i) {
                            return "range s" + i;
                        })
                        .attr("width", w0)
                        .attr("height", height)
                        .attr("x", reverse ? x0 : 0)
                        .attr("fill", function(d, i) {
                            var fills = ['#eee', '#ddd', '#ccc'];
                            return fills[i];
                        })
                        .transition()
                        .duration(duration)
                        .attr("width", w1)
                        .attr("x", reverse ? x1 : 0);

                    range.transition()
                        .duration(duration)
                        .attr("x", reverse ? x1 : 0)
                        .attr("width", w1)
                        .attr("height", height);

                    // Update the measure rects.
                    var measure = g.selectAll("rect.measure")
                        .data(measurez);

                    measure.enter().append("rect")
                        .attr("class", function(d, i) {
                            return "measure s" + i;
                        })
                        .attr("width", w0)
                        .attr("height", height / 3)
                        .attr("x", reverse ? x0 : 0)
                        .attr("y", height / 3)
                        .attr("fill", function(d, i) {
                            var fills = ['lightsteelblue', 'steelblue'];
                            return fills[i];
                        })
                        .transition()
                        .duration(duration)
                        .attr("width", w1)
                        .attr("x", reverse ? x1 : 0);

                    measure.transition()
                        .duration(duration)
                        .attr("width", w1)
                        .attr("height", height / 3)
                        .attr("x", reverse ? x1 : 0)
                        .attr("y", height / 3);

                    // Update the marker lines.
                    var marker = g.selectAll("line.marker")
                        .data(markerz);

                    marker.enter().append("line")
                        .attr("class", "marker")
                        .attr("x1", x0)
                        .attr("x2", x0)
                        .attr("y1", height / 6)
                        .attr("y2", height * 5 / 6)
                        .attr("stroke", "#000")
                        .attr("stroke-width", "2px")
                        .transition()
                        .duration(duration)
                        .attr("x1", x1)
                        .attr("x2", x1);

                    marker.transition()
                        .duration(duration)
                        .attr("x1", x1)
                        .attr("x2", x1)
                        .attr("y1", height / 6)
                        .attr("y2", height * 5 / 6);

                    // Compute the tick format.
                    var format = tickFormat || x1.tickFormat(8);

                    // Update the tick groups.
                    var tick = g.selectAll("g.tick")
                        .data(x1.ticks(8), function(d) {
                            return this.textContent || format(d);
                        });

                    // Initialize the ticks with the old scale, x0.
                    var tickEnter = tick.enter().append("g")
                        .attr("class", "tick")
                        .attr("stroke", "#666")
                        .attr("stroke-width", "0.5px")
                        .attr("transform", bulletTranslate(x0))
                        .style("opacity", 1e-6);

                    tickEnter.append("line")
                        .attr("y1", height)
                        .attr("y2", height * 7 / 6);

                    tickEnter.append("text")
                        .attr("text-anchor", "middle")
                        .attr("dy", "1em")
                        .attr("y", height * 7 / 6)
                        .text(format);

                    // Transition the entering ticks to the new scale, x1.
                    tickEnter.transition()
                        .duration(duration)
                        .attr("transform", bulletTranslate(x1))
                        .style("opacity", 1);

                    // Transition the updating ticks to the new scale, x1.
                    var tickUpdate = tick.transition()
                        .duration(duration)
                        .attr("transform", bulletTranslate(x1))
                        .style("opacity", 1);

                    tickUpdate.select("line")
                        .attr("y1", height)
                        .attr("y2", height * 7 / 6);

                    tickUpdate.select("text")
                        .attr("y", height * 7 / 6);

                    // Transition the exiting ticks to the new scale, x1.
                    tick.exit().transition()
                        .duration(duration)
                        .attr("transform", bulletTranslate(x1))
                        .style("opacity", 1e-6)
                        .remove();
                });
                d3.timer.flush();
            }

            // left, right, top, bottom
            bullet.orient = function(x) {
                if (!arguments.length) return orient;
                orient = x;
                reverse = orient == "right" || orient == "bottom";
                return bullet;
            };

            // ranges (bad, satisfactory, good)
            bullet.ranges = function(x) {
                if (!arguments.length) return ranges;
                ranges = x;
                return bullet;
            };

            // markers (previous, goal)
            bullet.markers = function(x) {
                if (!arguments.length) return markers;
                markers = x;
                return bullet;
            };

            // measures (actual, forecast)
            bullet.measures = function(x) {
                if (!arguments.length) return measures;
                measures = x;
                return bullet;
            };

            bullet.width = function(x) {
                if (!arguments.length) return width;
                width = x;
                return bullet;
            };

            bullet.height = function(x) {
                if (!arguments.length) return height;
                height = x;
                return bullet;
            };

            bullet.tickFormat = function(x) {
                if (!arguments.length) return tickFormat;
                tickFormat = x;
                return bullet;
            };

            bullet.duration = function(x) {
                if (!arguments.length) return duration;
                duration = x;
                return bullet;
            };

            return bullet;
        };

        function bulletRanges(d) {
            return d.ranges;
        }

        function bulletMarkers(d) {
            return d.markers;
        }

        function bulletMeasures(d) {
            return d.measures;
        }

        function bulletTranslate(x) {
            return function(d) {
                return "translate(" + x(d) + ",0)";
            };
        }

        function bulletWidth(x) {
            var x0 = x(0);
            return function(d) {
                return Math.abs(x(d) - x0);
            };
        }

        var chart = d3.bullet()
            .width(width)
            .height(height);

        function randomize(d) {
            if (!d.randomizer) d.randomizer = randomizer(d);
            d.ranges = d.ranges.map(d.randomizer);
            d.markers = d.markers.map(d.randomizer);
            d.measures = d.measures.map(d.randomizer);
            return d;
        }

        function randomizer(d) {
            var k = d3.max(d.ranges) * 0.2;
            return function(d) {
                return Math.max(0, d + k * (Math.random() - 0.5));
            };
        }

        var svg = d3.select(this.el).selectAll("svg")
            .data(data)
            .enter().append("svg")
            .attr("class", "bullet")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(chart);

        var title = svg.append("g")
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + height / 2 + ")");

        title.append("text")
            .attr("class", "title")
            .text(function(d) {
                return d.title;
            });

        title.append("text")
            .attr("class", "subtitle")
            .attr("dy", "1em")
            .text(function(d) {
                return d.subtitle;
            });

        d3.selectAll("button").on("click", function() {
            svg.datum(randomize).call(chart.duration(1000)); // TODO automatic transition
        });



    },

    render: function() {

        var ns = this.defaults;

        if (ns.chartHeader !== null) {
            new ChartHeaderView({
                el: ns.chartHeader[0],
                chartTitle: ns.chartHeader[1],
                infoText: ns.chartHeader[2],
                columns: 12
            });
        }

        this.$el.append(this.template());
        return this;
    },

    template: _.template('' +
        '<button style="position: absolute; right: 100px; top:60px;">Update</button>'
    )
});
