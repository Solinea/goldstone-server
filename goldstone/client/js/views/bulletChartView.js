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

        this.initSvg();
        this.collection.on('sync', this.update, this);

    },

    initSvg: function() {
        var self = this;
        var ns = this.defaults;

        d3.bullet = this.bullet;

        ns.margin = {
            top: 5,
            right: 40,
            bottom: 20,
            left: 20
        };
        ns.width = ns.w - ns.margin.left - ns.margin.right;
        ns.height = 50 - ns.margin.top - ns.margin.bottom;

        ns.chart = d3.bullet()
            .width(ns.width)
            .height(ns.height);

    },

    update: function() {
        var ns = this.defaults;
        var self = this;

        var data = this.collection.toJSON()[0];
        console.log(data);

        var svg = d3.select("body").selectAll("svg")
            .data(data)
            .enter().append("svg")
            .attr("class", "bullet")
            .attr("width", ns.width + ns.margin.left + ns.margin.right)
            .attr("height", ns.height + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")")
            .call(ns.chart);

        var title = svg.append("g")
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + ns.height / 2 + ")");

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
    },

bullet: function() {
  var orient = "left", // TODO top & bottom
      reverse = false,
      duration = 0,
      ranges = this.bulletRanges,
      markers = this.bulletMarkers,
      measures = this.bulletMeasures,
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
      var w0 = this.bulletWidth(x0),
          w1 = this.bulletWidth(x1);

      // Update the range rects.
      var range = g.selectAll("rect.range")
          .data(rangez);

      range.enter().append("rect")
          .attr("class", function(d, i) { return "range s" + i; })
          .attr("width", w0)
          .attr("height", height)
          .attr("x", reverse ? x0 : 0)
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
          .attr("class", function(d, i) { return "measure s" + i; })
          .attr("width", w0)
          .attr("height", height / 3)
          .attr("x", reverse ? x0 : 0)
          .attr("y", height / 3)
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
          .attr("transform", this.bulletTranslate(x0))
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
          .attr("transform", this.bulletTranslate(x1))
          .style("opacity", 1);

      // Transition the updating ticks to the new scale, x1.
      var tickUpdate = tick.transition()
          .duration(duration)
          .attr("transform", this.bulletTranslate(x1))
          .style("opacity", 1);

      tickUpdate.select("line")
          .attr("y1", height)
          .attr("y2", height * 7 / 6);

      tickUpdate.select("text")
          .attr("y", height * 7 / 6);

      // Transition the exiting ticks to the new scale, x1.
      tick.exit().transition()
          .duration(duration)
          .attr("transform", this.bulletTranslate(x1))
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
},

bulletRanges: function(d) {
  return d.ranges;
},

bulletMarkers: function(d) {
  return d.markers;
},

bulletMeasures: function(d) {
  return d.measures;
},

bulletTranslate: function(x) {
  return function(d) {
    return "translate(" + x(d) + ",0)";
  };
},

bulletWidth: function(x) {
  var x0 = x(0);
  return function(d) {
    return Math.abs(x(d) - x0);
  };
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
        return this;
    }
});
