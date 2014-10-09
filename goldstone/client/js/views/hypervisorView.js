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

var HypervisorView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 10,
            right: 10,
            bottom: 18,
            left: 25
        }
    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.width = options.width;

        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', this.update, this);

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.width * 2 - ns.margin.top - ns.margin.bottom;

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.color = d3.scale.category20();

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format(".1s"));

        ns.svg = d3.select(ns.location).append("svg")
            .attr("width", ns.mw + ns.margin.left + ns.margin.right)
            .attr("height", ns.mh + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(ns.location).css({
                'position': 'relative',
                'margin-top': -(ns.mh / 2),
                'display': ns.spinnerDisplay

            });
        });

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(ns.location).find('#spinner').hide();

        var allTheLogs = this.collection.toJSON();

        if (allTheLogs.length === 0) {
            console.log('no data returned');
            return;
        }

        var data = allTheLogs;

        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "date";
        }));

        data.forEach(function(d) {
            var y0 = 0;
            d.cores = ns.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });
            d.total = d.cores[d.cores.length - 1].y1;
        });

        data.sort(function(a, b) {
            return b.total - a.total;
        });

        ns.x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Popluation");

        var vmCore = ns.svg.selectAll(".vmCore")
            .data(data)
            .enter().append("g")
            .attr("class", "g");

        vmCore.selectAll("rect")
            .data(function(d) {
                return d.cores;
            })
            .enter().append("rect")
            .attr("width", ns.mw)
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .style("fill", function(d) {
                return ns.color(d.name);
            });

        data[0].cores.forEach(function(d) {

            vmCore.append("text")
                .text(d.name + ": " + (Math.round((d.y1 - d.y0) * 100)) / 100 + "%")
                .attr("x", ns.mw / 2)
                .attr("y", ns.y.range()[1] + ns.y(d.y1) + 15)
                .attr("text-anchor", "middle");
        });

        var legend = ns.svg.selectAll(".legend")
            .data(data)
            .enter().append("g")
            .attr("class", "legend");

        legend.append("text")
            .attr("x", ns.mw / 2)
            .attr("y", ns.mh + 12)
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return moment(d.date).calendar();
            });

    }

});
