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

var UtilizationView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 25,
            left: 33
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
        ns.mh = ns.width - ns.margin.top - ns.margin.bottom;

        ns.formatPercent = d3.format(".0%");

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.color = d3.scale.category20();

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(4);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(ns.formatPercent);

        ns.area = d3.svg.area()
            .x(function(d) {
                return ns.x(d.date);
            })
            .y0(function(d) {
                return ns.y(d.y0);
            })
            .y1(function(d) {
                return ns.y(d.y0 + d.y);
            });

        ns.stack = d3.layout.stack()
            .values(function(d) {
                return d.values;
            });

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
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.width / 2),
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

        var browsers = ns.stack(ns.color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {
                        date: d.date,
                        y: d[name] / 100
                    };
                })
            };
        }));

        ns.x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        var browser = ns.svg.selectAll(".browser")
            .data(browsers)
            .enter().append("g")
            .attr("class", "browser");

        browser.append("path")
            .attr("class", "area")
            .attr("d", function(d) {
                return ns.area(d.values);
            })
            .style("fill", function(d) {
                return ns.color(d.name);
            });

        browser.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.value.date) + "," + ns.y(d.value.y0 + d.value.y / 2) + ")";
            })
            .attr("x", 1)
            .style("font-size", ".8em")
            .text(function(d) {
                return d.name;
            });

        ns.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis);

    }

});
