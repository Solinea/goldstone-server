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

/*
NOTE: This Backbone View is a "superClass" that is extended to at least 2 other chart-types at the time of this documentation.

The method of individuating charts that have particular individual requirements is to instantiate them with the 'featureSet' property within the options hash.

Instantiated on nodeReportView as:

this.cpuUsageChart = new UtilizationCpuCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.cpuUsageView = new UtilizationCpuView({
    collection: this.cpuUsageChart,
    el: '#node-report-r3 #node-report-panel #cpu-usage',
    width: $('#node-report-r3 #node-report-panel #cpu-usage').width(),
    featureSet: 'cpuUsage'
});
*/

var UtilizationCpuView = GoldstoneBaseView.extend({

    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 25,
            left: 33
        }
    },

    instanceSpecificInit: function() {
        // processes the passed in hash of options when object is instantiated
        this.processOptions();
        // sets page-element listeners, and/or event-listeners
        this.processListeners();
        // creates the popular mw / mh calculations for the D3 rendering
        this.processMargins();
        // Appends this basic chart template, usually overwritten
        this.render();
        // basic assignment of variables to be used in chart rendering
        this.standardInit();
        // appends spinner to el
        this.showSpinner();
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
            this.defaults.yAxisLabel = goldstone.translate("Response Time (s)");
        }

        this.defaults.url = this.collection.url;
        this.defaults.featureSet = this.options.featureSet || null;
        var ns = this.defaults;
        if (ns.featureSet === 'memUsage') {
            ns.divisor = (1 << 30);
        }
        ns.formatPercent = d3.format(".0%");
        ns.height = this.options.height || this.options.width;
        ns.yAxisLabel = '';
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.defaults.urlCollectionCount === 0) {
                self.update();
                // the collection count will have to be set back to the original count when re-triggering a fetch.
                self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
                self.collection.defaults.fetchInProgress = false;
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            this.collection.defaults.globalLookback = $('#global-lookback-range').val();
            this.collection.fetchMultipleUrls();
            $(this.el).find('#spinner').show();
        });
    },

    processMargins: function() {
        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.width - ns.margin.top - ns.margin.bottom;
    },

    standardInit: function() {

         /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

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

        ns.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        ns.x = d3.time.scale()
            .rangeRound([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.colorArray = goldstone.colorPalette;

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(4);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        if (ns.featureSet === "cpuUsage") {
            ns.yAxis
                .tickFormat(ns.formatPercent);
        }

        if (ns.featureSet === 'logEvents') {

            ns.color = d3.scale.ordinal().domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"])
                .range(ns.colorArray.distinct.openStackSeverity8);
        } else {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct['2R']);
        }

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
        var allthelogs = this.collection.toJSON();

        var data = allthelogs;

        /*
        make it like this:

        @timestamp: "2015-05-14T05:55:50.342Z"
        host: "10.10.20.10:56787"
        metric_type: "gauge"
        name: "os.cpu.wait"
        node: "ctrl-01"
        unit: "percent"
        value: 0.26161110700781587
*/
        // allthelogs will have as many objects as api calls were made
        // iterate through each object to tag the data with the
        // api call that was made to produce it
        _.each(data, function(collection) {

            // within each collection, tag the data points
            _.each(collection.per_interval, function(dataPoint) {

                _.each(dataPoint, function(item, i) {
                    item['@timestamp'] = i;
                    item.name = collection.metricSource;
                    item.value = item.stats.max;
                });

            });
        });


        var condensedData = _.flatten(_.map(data, function(item) {
            return item.per_interval;
        }));


        var dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
            return item[_.keys(item)[0]]['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                wait: null,
                sys: null,
                user: null
            };
        });


        _.each(condensedData, function(item) {

            var key = _.keys(item)[0];
            var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
            newData[key][metric] = item[key].value;

        });


        var finalData = [];

        _.each(newData, function(item, i) {

            item.wait = item.wait || 0;
            item.sys = item.sys || 0;
            item.user = item.user || 0;

            finalData.push({
                wait: item.wait,
                sys: item.sys,
                user: item.user,
                idle: 100 - (item.user + item.wait + item.sys),
                date: i
            });
        });

        return finalData;

    },

    dataErrorMessage: function(message, errorMessage) {

        UtilizationCpuView.__super__.dataErrorMessage.apply(this, arguments);

        var self = this;

        // the collection count will have to be set back to the original count when re-triggering a fetch.
        self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
        self.collection.defaults.fetchInProgress = false;
    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        this.hideSpinner();

        // define allthelogs and ns.data even if
        // rendering is halted due to empty data set
        var allthelogs = this.collectionPrep();
        ns.data = allthelogs;

        if (ns.featureSet === 'logEvents') {
            ns.data = allthelogs.finalData;
            ns.loglevel = d3.scale.ordinal()
                .domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"])
                .range(ns.colorArray.distinct.openStackSeverity8);
        }

        // If we didn't receive any valid files, append "No Data Returned" and halt
        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

        ns.color.domain(d3.keys(ns.data[0]).filter(function(key) {

            if (ns.featureSet === 'logEvents') {
                return (ns.filter[key] && key !== "date" && key !== "total" && key !== "time");
            } else {
                return key !== "date";
            }
        }));

        var components;
        if (ns.featureSet === 'logEvents') {

            var curr = false;
            var anyLiveFilter = _.reduce(ns.filter, function(curr, status) {
                return status || curr;
            });

            if (!anyLiveFilter) {
                ns.chart.selectAll('.component')
                    .remove();
                return;
            }

            components = ns.stack(ns.color.domain().map(function(name) {
                return {
                    name: name,
                    values: ns.data.map(function(d) {
                        return {
                            date: d.date,
                            y: d[name]
                        };
                    })
                };
            }));

        } else {

            components = ns.stack(ns.color.domain().map(function(name) {
                return {
                    name: name,
                    values: ns.data.map(function(d) {
                        return {
                            date: d.date,
                            y: self.defaults.featureSet === 'cpuUsage' ? d[name] / 100 : d[name]
                        };
                    })
                };
            }));
        }

        $(this.el).find('.axis').remove();

        ns.x.domain(d3.extent(ns.data, function(d) {
            return d.date;
        }));

        if (ns.featureSet === 'memUsage') {
            ns.y.domain([0, ns.memTotal / ns.divisor]);
        }

        if (ns.featureSet === 'netUsage') {
            ns.y.domain([0, d3.max(allthelogs, function(d) {
                return d.rx + d.tx;
            })]);
        }

        if (ns.featureSet === 'logEvents') {
            ns.y.domain([
                0,
                d3.max(ns.data.map(function(d) {
                    return self.sums(d);
                }))
            ]);
        }

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
            .style("stroke", function(d) {
                if (ns.featureSet === "logEvents") {
                    return ns.loglevel(d.name);
                }
            })
            .style("stroke-width", function(d) {
                if (ns.featureSet === "logEvents") {
                    return 1.5;
                }
            })
            .style("stroke-opacity", function(d) {
                if (ns.featureSet === "logEvents") {
                    return 1;
                }
            })
            .style("fill", function(d) {

                if (ns.featureSet === "cpuUsage") {
                    if (d.name.toLowerCase() === "idle") {
                        return "none";
                    }
                    return ns.color(d.name);
                }

                if (ns.featureSet === "memUsage") {
                    if (d.name.toLowerCase() === "free") {
                        return "none";
                    }
                    return ns.color(d.name);
                }

                if (ns.featureSet === "netUsage") {
                    return ns.color(d.name);
                }

                if (ns.featureSet === "logEvents") {
                    return ns.loglevel(d.name);
                }

                console.log('define featureSet in utilizationCpuView.js');

            });

        component.append("text")
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

                if (ns.featureSet === 'logEvents') {
                    return 0;
                }

                console.log('define feature set in utilizationCpuView.js');
                return null;

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
                        return 'Total: ' + ((Math.round(ns.memTotal / ns.divisor * 100)) / 100) + 'GB';
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

                if (ns.featureSet === 'logEvents') {
                    return null;
                }

                console.log('define feature set in utilizationCpuView.js');
                return 'feature set undefined';

            });

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
