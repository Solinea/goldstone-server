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

var HypervisorVmCpuView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 25,
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
        ns.mh = ns.width - ns.margin.top - ns.margin.bottom;

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(5);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.line = d3.svg.line()
            .x(function(d) {
                return ns.x(d.date);
            })
            .y(function(d) {
                return ns.y(d[ns.selectedButton]);
            });

        ns.svg = d3.select(ns.location).append("svg")
            .attr("width", ns.mw + ns.margin.left + ns.margin.right)
            .attr("height", ns.mh + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        this.appendButtons();

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(ns.location).css({
                'position': 'relative',
                'margin-top': -(ns.mh / 2),
                'margin-left': (ns.mw / 2),
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

        ns.dataset = allTheLogs;

        ns.x.domain(d3.extent(ns.dataset, function(d) {
            return d.date;
        }));

        ns.y.domain([0, 100]);

        ns.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("y", -10)
            .attr("x", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "left")
            .text("percent utilization(%)");

        ns.svg.append("path")
            .datum(ns.dataset)
            .attr("class", "line")
            .attr("id", "dataPath")
            .attr("d", ns.line)
            .style("stroke", "#000")
            .style("stroke-width", "3px")
            .style("fill", "none");

    },

    refresh: function() {
        var ns = this.defaults;
        var self = this;

        if(ns.dataset === undefined){
            return;
        }

        ns.x.domain(d3.extent(ns.dataset, function(d) {
            return d.date;
        }));

        d3.select(ns.location).selectAll("path")
            .transition()
            .duration(500)
            .attr("d", ns.line);

        d3.select(ns.location).select(".y.axis")
            .transition()
            .duration(500)
            .call(ns.yAxis);

        d3.select(ns.location).select(".x.axis")
            .transition()
            .duration(500)
            .call(ns.xAxis);

    },

    appendButtons: function() {

        var ns = this.defaults;
        var self = this;

        $(ns.location).find("#data-filterer")
            .append("<div class='btn-group pull-left'>" +
                "<div class='btn-group'>" +
                "<button type='button' class='btn btn-default btn-sm active'>User</button>" +
                "<button type='button' class='btn btn-default btn-sm'>System</button>" +
                "<button type='button' class='btn btn-default btn-sm'>Wait</button>" +
                "</div></div>"
        );

        $(function() {
            $(ns.location).find("button").click(function() {
                $("button.active").toggleClass("active");
                $(this).toggleClass("active");
                var buttonPressed = ($(this).context.innerText);
                self.defaults.selectedButton = buttonPressed.toLowerCase();
                self.refresh();
            });
        });

        ns.selectedButton = 'user';

    }

});
