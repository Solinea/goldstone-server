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
        this.el = options.el;
        this.defaults.width = options.width;
        this.defaults.axisLabel = options.axisLabel;

        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', this.update, this);

        this.on('lookbackSelectorChanged', function() {
            self.collection.fetch();
        });

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.width * 2 - ns.margin.top - ns.margin.bottom;

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        var colorArray = goldstone.colorPalette;
        ns.color = d3.scale.ordinal().range(colorArray.distinct[5]);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.mw + ns.margin.left + ns.margin.right)
            .attr("height", ns.mh + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // tooltip:
        // [top-offset, left-offset]
        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-5, 0])
            .html(function(d) {
                d.name = d.name || 'No name reported';
                d.cores = d.y1 - d.y0 || 'No core count reported';

                return "vm: " + d.name + "<br>" +
                    d.cores + " " + ns.axisLabel;
            });

        ns.svg.call(ns.tooltip);

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(this.el).css({
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
        $(this.el).find('#spinner').hide();

        var allthelogs = this.collection.toJSON();

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0) {

            // if 'no data returned' already exists on page, don't reapply it
            if ($(this.el).find('#noDataReturned').length) {
                return;
            }

            $('<span id="noDataReturned"><br>No<br>Data<br>Returned</span>').appendTo(this.el)
                .css({
                    'position': 'relative',
                    'margin-left': $(this.el).width() / 2 - 14,
                    'top': -$(this.el).height() / 2
                });
            return;
        }

        // remove No Data Returned once data starts flowing again
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }

        var data = allthelogs;

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

        ns.svg.selectAll('rect')
            .remove();

        ns.svg.selectAll("g").remove();

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(0)")
            .attr("x", 4)
            .attr("y", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "beginning")
            .text("Total " + ns.axisLabel + ": " + ns.y.domain()[1]);

        var vmCore = ns.svg.selectAll(".vmCore")
            .data(data)
            .enter().append("g")
            .attr("class", "g");

        vmCore.selectAll("rect")
            .data(function(d) {
                return d.cores;
            })
            .enter().append("rect")
            .style("fill", "#f5f5f5")
            .attr("width", ns.mw)
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .on("mouseover", ns.tooltip.show)
            .on("mouseout", function() {
                ns.tooltip.hide();
            })
            .transition()
            .style("fill", function(d) {
                if (d.name === "available") {
                    return 'none';
                }
                return ns.color(d.name);
            })
            .style("opacity", 0.8);

        var legend = ns.svg.selectAll(".legend")
            .data(data);

        legend
            .enter().append("g")
            .attr("class", "legend");

        legend.text('');

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
