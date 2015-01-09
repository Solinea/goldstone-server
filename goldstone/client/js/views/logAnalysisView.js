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

// extends UtilizationCpuView
var LogAnalysisView = UtilizationCpuView.extend({

    initialize: function(options) {

        this.options = options || {};

        // essential for unique chart objects,
        // as objects/arrays are pass by reference
        this.defaults = _.clone(this.defaults);

        // breaks down init into discrete steps
        this.processOptions();
        this.processListeners();
        this.processMargins();
        this.render();
        this.standardInit();
        this.showSpinner();
        this.specialInit();
    },

    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 25,
            left: 63
        }
    },

    processOptions: function() {
        this.defaults.chartTitle = this.options.chartTitle || null;
        this.defaults.height = this.options.height || null;
        this.defaults.infoCustom = this.options.infoCustom || null;
        this.el = this.options.el;
        this.defaults.width = this.options.width || null;

        // easy to pass in a unique yAxisLabel. This pattern can be
        // expanded to any variable to allow overriding the default.

        if (this.options.yAxisLabel) {
            this.defaults.yAxisLabel = this.options.yAxisLabel;
        } else {
            this.defaults.yAxisLabel = "Response Time (ms)";
        }

        // this.defaults.url = this.collection.url;

        this.defaults.featureSet = this.options.featureSet || null;
        var ns = this.defaults;

        ns.height = this.options.height || this.options.width;
        ns.yAxisLabel = 'Log Events';
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', function() {
            self.update();
        });

        this.collection.on('error', this.dataErrorMessage, this);

        this.on('selectorChanged', function() {
            console.log('selectorChanged registered on prototype chart');
            $(this.el).find('#spinner').show();
        });
    },

    processMargins: function() {
        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;
    },

    standardInit: function() {

        var ns = this.defaults;
        var self = this;

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        ns.chart = ns.svg
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

        ns.x = d3.time.scale()
            .rangeRound([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .ticks(5)
            .orient("bottom");

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.colorArray = new GoldstoneColors().get('colorSets');

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(4);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.color = d3.scale.ordinal().range(ns.colorArray.distinct[5]);

        ns.area = d3.svg.area()
            .interpolate("monotone")
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

    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();
        console.log('allthelogs', allthelogs[0]);

        var data = allthelogs[0].data;

        finalData = [];

        _.each(data, function(item) {

            // item.debug = item.debug || 0;
            // item.audit = item.audit || 0;
            // item.info = item.info || 0;
            // item.warning = item.warning || 0;
            // item.error = item.error || 0;
            // item.date = item.time;
            // delete item.time;

            console.log(item.audit);

            item.date = item.time;
            item.error = item.error || 0;
            item.warning = item.warning || 0;
            item.info = item.info || 0;
            item.audit = item.audit || 0;
            item.debug = item.debug || 0;
            delete item.time;

            finalData.push(item);
        });

        console.log('final data', finalData);
        return finalData;

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

        var allthelogs = this.collectionPrep();

        // If we didn't receive any valid files, append "No Data Returned"
        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

        var data = allthelogs;

        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return (key !== "date" && key !== "total");
        }));

        $(this.el).find('.axis').remove();

        var components = ns.stack(ns.color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {
                        date: d.date,
                        y: d[name]
                    };
                })
            };
        }));

        ns.x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        ns.y.domain([0, d3.max(allthelogs, function(d) {
            return (d.error + d.warning + d.audit + d.info + d.debug);
        })]);

        ns.chart.selectAll('.component')
            .remove();

        var component = ns.chart.selectAll(".component")
            .data(components)
            .enter().append("g")
            .attr("class", "component");

        component.append("path")
            .attr("class", "area")
            .attr("d", function(d) {
                return ns.area(d.values);
            })
            .style("fill", function(d) {
                return ns.color(d.name);
            })
            .style("opacity", 0.8);

/*        component.append("text")
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
            .attr("y", function(d, i) {
                // make space between the labels

                if (ns.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return -3;
                    } else {
                        return 0;
                    }
                }

                if (ns.featureSet === 'cpuUsage') {
                    return -i * 3;
                }

                if (ns.featureSet === 'netUsage') {
                    return -i * 8;
                }

                console.log('define feature set in utilizationCpuView.js');
                return;

            })
            .attr("text-anchor", function(d) {
                if (ns.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return 'end';
                    }
                }
            })
            .style("font-size", ".8em")
            .text(function(d) {

                if (ns.featureSet === 'cpuUsage') {
                    return d.name;
                }

                if (ns.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return 'Total: ' + ((Math.round(ns.memTotal.value / ns.divisor * 100)) / 100) + 'GB';
                    }
                    if (d.name === 'free') {
                        return '';
                    } else {
                        return d.name;
                    }
                }

                if (ns.featureSet === 'netUsage') {
                    return d.name + " (kB)";
                }

                console.log('define feature set in utilizationCpuView.js');
                return 'feature set undefined';

            });*/

        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis);
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {
        this.$el.append(this.template());
        return this;
    }



});
