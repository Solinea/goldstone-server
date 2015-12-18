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
View is currently implemented for Nova CPU/Memory/Disk Resource Charts

instantiated similar to:

this.cpuResourcesChart = new MultiMetricComboCollection({
    metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used']
});

this.cpuResourcesChartView = new MultiMetricBarView({
    chartTitle: "CPU Resources",
    collection: this.cpuResourcesChart,
    featureSet: 'cpu',
    height: 300,
    infoCustom: 'novaCpuResources',
    el: '#nova-report-r2-c1',
    width: $('#nova-report-r2-c1').width(),
    yAxisLabel: 'Cores'
});
*/

var MultiMetricBarView = GoldstoneBaseView.extend({

    margin: {
        top: 55,
        right: 80,
        bottom: 90,
        left: 70
    },

    instanceSpecificInit: function() {

        MultiMetricBarView.__super__.instanceSpecificInit.apply(this, arguments);

        this.standardInit();
        this.specialInit();
    },

    processOptions: function() {

        MultiMetricBarView.__super__.processOptions.apply(this, arguments);
        this.featureSet = this.options.featureSet || null;
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var self = this;

        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;

        self.svg = d3.select(this.el).select('.panel-body').append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        self.chart = self.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        // initialized the axes
        self.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (self.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(self.yAxisLabel)
            .style("text-anchor", "middle");

        self.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        self.x = d3.time.scale()
            .rangeRound([0, self.mw]);

        self.y = d3.scale.linear()
            .range([self.mh, 0]);

        self.xAxis = d3.svg.axis()
            .scale(self.x)
            .ticks(5)
            .orient("bottom");

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left");

        self.colorArray = new GoldstoneColors().get('colorSets');
    },

    processListeners: function() {
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.urlCollectionCount === 0) {
                self.update();
                // the collection count will have to be set back to the original count when re-triggering a fetch.
                self.collection.urlCollectionCount = self.collection.urlCollectionCountOrig;
                self.collection.fetchInProgress = false;
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            $(this.el).find('#spinner').show();
            this.collection.fetchMultipleUrls();
        });
    },

    dataErrorMessage: function(message, errorMessage) {

        MultiMetricBarView.__super__.dataErrorMessage.apply(this, arguments);

        var self = this;

        // the collection count will have to be set back to the original count when re-triggering a fetch.
        self.collection.urlCollectionCount = self.collection.urlCollectionCountOrig;
        self.collection.fetchInProgress = false;
    },

    specialInit: function() {
        var self = this;

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        // differentiate color sets for mem and cpu charts
        if (self.featureSet === 'mem' || self.featureSet === 'cpu') {
            self.color = d3.scale.ordinal().range(self.colorArray.distinct['3R']);
        }
        if (self.featureSet === 'metric') {
            self.color = d3.scale.ordinal().range(self.colorArray.distinct[1]);
        } else {
            // this includes "VM Spawns" and "Disk Resources" chars
            self.color = d3.scale.ordinal()
                .range(self.colorArray.distinct['2R']);
        }

    },

    collectionPrep: function(data) {
        var self = this;

        var condensedData;
        var dataUniqTimes;
        var newData;

        var uniqTimestamps;
        var finalData = [];

        if (self.featureSet === 'cpu') {

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

            condensedData = _.flatten(_.map(data, function(item) {
                return item.per_interval;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item[_.keys(item)[0]]['@timestamp'];
            }));

            newData = {};

            _.each(dataUniqTimes, function(item) {
                newData[item] = {
                    Physical: null,
                    Used: null,
                    eventTime: null,
                    total: null
                };
            });

            _.each(condensedData, function(item) {

                var key = _.keys(item)[0];
                var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
                newData[key][metric] = item[key].value;

            });


            finalData = [];

            _.each(newData, function(item, i) {

                item.vcpus_used = item.vcpus_used || 0;
                item.vcpus = item.vcpus || 0;

                finalData.push({
                    eventTime: i,
                    Used: item.vcpus_used,
                    Physical: item.vcpus
                });
            });

        } else if (self.featureSet === 'disk') {

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

            condensedData = _.flatten(_.map(data, function(item) {
                return item.per_interval;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item[_.keys(item)[0]]['@timestamp'];
            }));

            newData = {};

            _.each(dataUniqTimes, function(item) {
                newData[item] = {
                    Total: null,
                    Used: null,
                    eventTime: null,
                    total: null
                };
            });

            _.each(condensedData, function(item) {

                var key = _.keys(item)[0];
                var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
                newData[key][metric] = item[key].value;

            });


            finalData = [];

            _.each(newData, function(item, i) {

                item.local_gb = item.local_gb || 0;
                item.local_gb_used = item.local_gb_used || 0;

                finalData.push({
                    eventTime: i,
                    Used: item.local_gb_used,
                    Total: item.local_gb
                });
            });

        } else if (self.featureSet === 'mem') {

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

            condensedData = _.flatten(_.map(data, function(item) {
                return item.per_interval;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item[_.keys(item)[0]]['@timestamp'];
            }));

            newData = {};

            _.each(dataUniqTimes, function(item) {
                newData[item] = {
                    Physical: null,
                    Used: null,
                    eventTime: null,
                    total: null
                };
            });

            _.each(condensedData, function(item) {

                var key = _.keys(item)[0];
                var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
                newData[key][metric] = item[key].value;

            });


            finalData = [];

            _.each(newData, function(item, i) {

                item.memory_mb = item.memory_mb || 0;
                item.memory_mb_used = item.memory_mb_used || 0;

                finalData.push({
                    eventTime: i,
                    Used: item.memory_mb_used,
                    Physical: item.memory_mb
                });
            });

        }

        return finalData;
    },

    computeHiddenBarText: function(d) {

        var self = this;

        /*
        filter function strips keys that are irrelevant to the d3.tip:

        converts from: {Physical: 31872, Used: 4096, Virtual: 47808,
        eventTime: "1424556000000", stackedBarPrep: [],
        total: 47808}

        to: ["Virtual", "Physical", "Used"]
        */

        // reverses result to match the order in the chart legend
        var valuesToReport = _.filter((_.keys(d)), function(item) {
            return item !== "eventTime" && item !== "stackedBarPrep" && item !== "total";
        }).reverse();

        var result = "";

        // matches time formatting of api perf charts
        result += moment(+d.eventTime).format() + '<br>';

        if (self.featureSet === 'metric') {
            valuesToReport.forEach(function(item) {
                result += 'Value: ' + d[item] + '<br>';
            });

        } else {
            valuesToReport.forEach(function(item) {
                result += item + ': ' + d[item] + '<br>';
            });
        }

        return result;
    },

    update: function() {

        var self = this;

        // data originally returned from collection as:
        // [{"1424586240000": [6, 16, 256]}...]
        var data = this.collection.toJSON();

        // data morphed through collectionPrep into:
        // {
        //     "eventTime": "1424586240000",
        //     "Used": 6,
        //     "Physical": 16,
        //     "Virtual": 256
        // });
        data = this.collectionPrep(data);

        this.hideSpinner();

        // clear elements from previous render
        $(this.el).find('svg').find('rect').remove();
        $(this.el).find('svg').find('line').remove();
        $(this.el).find('svg').find('.axis').remove();
        $(this.el).find('svg').find('.legend').remove();
        $(this.el).find('svg').find('path').remove();
        $(this.el).find('svg').find('circle').remove();
        $(this.el + '.d3-tip').detach();

        // if empty set, append info popup and stop
        if (this.checkReturnedDataSet(data) === false) {
            return;
        }

        // maps keys such as "Used / Physical / Virtual" to a color
        // but skips mapping "eventTime" to a color
        self.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "eventTime";
        }));

        /*
        forEach morphs data into:
        {
            "eventTime": "1424586240000",
            "Used": 6,
            "Physical": 16,
            "Virtual": 256,
            stackedBarPrep: [
                {
                    name: "Used",
                    y0: 0,
                    y1: 6
                },
                {
                    name: "Physical",
                    y0: 6,
                    y1: 22,
                },
                {
                    name: "Virtual",
                    y0: 22,
                    y1: 278,
                },
            ],
            total: 278
        });
        */

        data.forEach(function(d) {
            var y0 = 0;

            // calculates heights of each stacked bar by adding
            // to the heights of the previous bars
            d.stackedBarPrep = self.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });

            // this is the height of the last element, and used to
            // calculate the domain of the y-axis
            d.total = d.stackedBarPrep[d.stackedBarPrep.length - 1].y1;

            // or for the charts with paths, use the top line as the
            // total, which will inform that domain of the y-axis
            // d.Virtual and d.Total are the top lines on their
            // respective charts
            if (d.Virtual) {
                d.total = d.Virtual;
            }
            if (d.Total) {
                d.total = d.Total;
            }
        });

        // the forEach operation creates chaos in the order of the set
        // must _.sortBy to return it to an array sorted by eventTime
        data = _.sortBy(data, function(item) {
            return item.eventTime;
        });

        self.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        // IMPORTANT: see data.forEach above to make sure total is properly
        // calculated if additional data paramas are introduced to this viz
        self.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        // add x axis
        self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.mh + ")")
            .call(self.xAxis);

        // add y axis
        self.chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // add primary svg g layer
        self.event = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + self.x(d.eventTime) + ",0)";
            });

        // add svg g layer for solid lines
        self.solidLineCanvas = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        // add svg g layer for dashed lines
        self.dashedLineCanvas = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        // add svg g layer for hidden rects
        self.hiddenBarsCanvas = self.chart.selectAll(".hidden")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g");

        // initialize d3.tip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return self.computeHiddenBarText(d);
            });

        // Invoke the tip in the context of your visualization
        self.chart.call(tip);

        // used below to determing whether to render as
        // a "rect" or "line" by affecting fill and stroke opacity below
        var showOrHide = {
            "Failure": true,
            "Success": true,
            "Virtual": false,
            "Physical": false,
            "Total": false,
            "Used": true
        };

        // append rectangles
        self.event.selectAll("rect")
            .data(function(d) {
                return d.stackedBarPrep;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                var segmentWidth = (self.mw / data.length);

                // spacing corrected for proportional
                // gaps between rects
                return segmentWidth - segmentWidth * 0.07;
            })
            .attr("y", function(d) {
                return self.y(d.y1);
            })
            .attr("height", function(d) {
                return self.y(d.y0) - self.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return self.color(d.name);
            })
            .attr("stroke-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 1;
                }
            })
            .attr("fill-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 0.8;
                }
            })
            .attr("stroke-width", 2)
            .style("fill", function(d) {
                return self.color(d.name);
            });

        // append hidden bars
        self.hiddenBarsCanvas.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("width", function(d) {
                var hiddenBarWidth = (self.mw / data.length);
                return hiddenBarWidth - hiddenBarWidth * 0.07;
            })
            .attr("opacity", "0")
            .attr("x", function(d) {
                return self.x(d.eventTime);
            })
            .attr("y", 0)
            .attr("height", function(d) {
                return self.mh;
            }).on('mouseenter', function(d) {

                // coax the pointer to line up with the bar center
                var nudge = (self.mw / data.length) * 0.5;
                var targ = d3.select(self.el).select('rect');
                tip.offset([20, -nudge]).show(d, targ);
            }).on('mouseleave', function() {
                tip.hide();
            });

        // abstracts the line generator to accept a data param
        // variable. will be used in the path generator
        var lineFunctionGenerator = function(param) {
            return d3.svg.line()
                .interpolate("linear")
                .x(function(d) {
                    return self.x(d.eventTime);
                })
                .y(function(d) {
                    return self.y(d[param]);
                });
        };

        // abstracts the path generator to accept a data param
        // and creates a solid line with the appropriate color
        var solidPathGenerator = function(param) {
            return self.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return self.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        };

        // abstracts the path generator to accept a data param
        // and creates a dashed line with the appropriate color
        var dashedPathGenerator = function(param) {
            return self.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return self.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-dasharray", "5, 2");
        };

        // lineFunction must be a named local
        // variable as it will be called by
        // the pathGenerator function that immediately follows
        var lineFunction;
        if (self.featureSet === 'cpu') {

            // generate solid line for Virtual data points
            // uncomment if supplying virtual stat again
            // lineFunction = lineFunctionGenerator('Virtual');
            // solidPathGenerator('Virtual');

            // generate dashed line for Physical data points
            lineFunction = lineFunctionGenerator('Physical');
            dashedPathGenerator('Physical');

        } else if (self.featureSet === 'disk') {

            // generate solid line for Total data points
            lineFunction = lineFunctionGenerator('Total');
            solidPathGenerator('Total');
        } else if (self.featureSet === 'mem') {

            // generate solid line for Virtual data points
            // uncomment if supplying virtual stat again
            // lineFunction = lineFunctionGenerator('Virtual');
            // solidPathGenerator('Virtual');

            // generate dashed line for Physical data points
            lineFunction = lineFunctionGenerator('Physical');
            dashedPathGenerator('Physical');
        }


        // appends chart legends
        var legendSpecs = {
            metric: [
                // uncomment if supplying virtual stat again
                // ['Virtual', 2],
                ['Value', 0]
            ],
            mem: [
                // uncomment if supplying virtual stat again
                // ['Virtual', 2],
                ['Physical', 1],
                ['Used', 0]
            ],
            cpu: [
                // uncomment if supplying virtual stat again
                // ['Virtual', 2],
                ['Physical', 1],
                ['Used', 0]
            ],
            disk: [
                ['Total', 1],
                ['Used', 0]
            ],
            spawn: [
                ['Fail', 1],
                ['Success', 0]
            ]
        };

        if (self.featureSet !== null) {
            this.appendLegend(legendSpecs[self.featureSet]);
        } else {
            this.appendLegend(legendSpecs.spawn);
        }
    },

    appendLegend: function(legendSpecs) {

        var self = this;

        // abstracts the appending of chart legends based on the
        // passed in array params [['Title', colorSetIndex],['Title', colorSetIndex'],...]


        _.each(legendSpecs, function(item) {
            self.chart.append('path')
                .attr('class', 'line')
                .attr('id', item[0])
                .attr('data-legend', item[0])
                .attr('data-legend-color', self.color.range()[item[1]]);
        });

        var legend = self.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20,-35)')
            .attr('opacity', 1.0)
            .call(d3.legend);
    }

});
