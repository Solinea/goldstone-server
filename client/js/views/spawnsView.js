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
View is currently directly implemented as Nova VM Spawns Viz
and extended into Nova CPU/Memory/Disk Resource Charts

instantiated similar to:

this.vmSpawnChart = new SpawnsCollection({
    urlPrefix: '/nova/hypervisor/spawns'
});

this.vmSpawnChartView = new SpawnsView({
    chartTitle: "VM Spawns",
    collection: this.vmSpawnChart,
    height: 300,
    infoCustom: 'novaSpawns',
    el: '#nova-report-r1-c2',
    width: $('#nova-report-r1-c2').width(),
    yAxisLabel: 'Spawn Events'
});
*/

// view is linked to collection when instantiated in api_perf_report.html

var SpawnsView = GoldstoneBaseView.extend({

    defaults: {
        margin: {
            top: 45,
            right: 40,
            bottom: 60,
            left: 70
        }
    },

    processOptions: function() {

        // this will invoke the processOptions method of the parent view,
        // and also add an additional param of featureSet which is used
        // to create a polymorphic interface for a variety of charts
        SpawnsView.__super__.processOptions.apply(this, arguments);

        this.defaults.featureSet = this.options.featureSet || null;
    },

    specialInit: function() {
        var ns = this.defaults;

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        // differentiate color sets for mem and cpu charts
        if (ns.featureSet === 'mem' || ns.featureSet === 'cpu') {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct['3R']);
        }
        if (ns.featureSet === 'metric') {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct[1]);
        } else {
            // this includes "VM Spawns" and "Disk Resources" chars
            ns.color = d3.scale.ordinal()
                .range(ns.colorArray.distinct['2R']);
        }

    },

    dataPrep: function(data) {

        /*
        this is where the fetched JSON payload is transformed into a
        dataset than can be consumed by the D3 charts
        each chart may have its own perculiarities

        IMPORTANT:
        the order of items that are 'push'ed into the
        result array matters. After 'eventTime', the items
        will be stacked on the graph from the bottom of
        the graph upward. Or another way of saying it is
        the first item listed will be first one to be rendered
        from the x-axis of the graph going upward.
        */

        var ns = this.defaults;
        var uniqTimestamps;
        var result = [];

        if (ns.featureSet === 'metric') {
            data = data[0].per_interval;
            /*
            {
                @timestamp: "2015-04-20T19:09:08.153Z"
                host: "10.10.20.21:55199"
                metric_type: "gauge"
                name: "os.cpu.idle"
                node: "rsrc-02"
                unit: "percent"
                value: 97.18570476410143
            }
            */

            _.each(data, function(item) {
                var logTime = +(_.keys(item)[0]);
                var value = +(_.values(item)[0]);
                result.push({
                    "eventTime": logTime,
                    "Success": value,
                });
            });

        } else if (ns.featureSet === 'cpu') {

            // CPU Resources chart data prep
            /*
            {
                "name": "nova.hypervisor.vcpus",
                "region": "RegionOne",
                "value": 16,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "count"
            },
            {
                "name": "nova.hypervisor.vcpus_used",
                "region": "RegionOne",
                "value": 7,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "count"
            },
            */

            uniqTimestamps = _.uniq(_.map(data, function(item) {
                return item['@timestamp'];
            }));
            _.each(uniqTimestamps, function(item, i) {
                result.push({
                    eventTime: moment(item).valueOf(),
                    Used: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.vcpus_used'
                    })[0].value,
                    Physical: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.vcpus'
                    })[0].value
                });

            });

        } else if (ns.featureSet === 'disk') {

            /*
            {
                "name": "nova.hypervisor.local_gb_used",
                "region": "RegionOne",
                "value": 83,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "GB"
            },
            {
                "name": "nova.hypervisor.local_gb",
                "region": "RegionOne",
                "value": 98,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "GB"
            },
        */
            uniqTimestamps = _.uniq(_.map(data, function(item) {
                return item['@timestamp'];
            }));
            _.each(uniqTimestamps, function(item, i) {
                result.push({
                    eventTime: moment(item).valueOf(),
                    Used: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.local_gb_used'
                    })[0].value,
                    Total: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.local_gb'
                    })[0].value
                });

            });

        } else if (ns.featureSet === 'mem') {

            /*
            {
                "name": "nova.hypervisor.memory_mb_used",
                "region": "RegionOne",
                "value": 10752,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "MB"
            },
            {
                "name": "nova.hypervisor.memory_mb",
                "region": "RegionOne",
                "value": 31872,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "MB"
            },
            */

            uniqTimestamps = _.uniq(_.map(data, function(item) {
                return item['@timestamp'];
            }));
            _.each(uniqTimestamps, function(item, i) {
                result.push({
                    eventTime: moment(item).valueOf(),
                    Used: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.memory_mb_used'
                    })[0].value,
                    Physical: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.memory_mb'
                    })[0].value
                });

            });


        } else {

            // Spawns Resources chart data prep
            /*
            {"1429032900000":
                {"count":1,
                "success":
                    [
                        {"true":1}
                    ]
                }
            }
            */

            _.each(data, function(item) {
                var logTime = _.keys(item)[0];
                var success = _.pluck(item[logTime].success, 'true');
                success = success[0] || 0;
                var failure = _.pluck(item[logTime].success, 'false');
                failure = failure[0] || 0;
                result.push({
                    "eventTime": logTime,
                    "Success": success,
                    "Failure": failure
                });
            });
        }
        return result;
    },

    computeHiddenBarText: function(d) {
        var  ns = this.defaults;
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

        if (ns.featureSet === 'metric') {
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

        var ns = this.defaults;
        var self = this;

        // data originally returned from collection as:
        // [{"1424586240000": [6, 16, 256]}...]
        var data = this.collection.toJSON();

        // data morphed through dataPrep into:
        // {
        //     "eventTime": "1424586240000",
        //     "Used": 6,
        //     "Physical": 16,
        //     "Virtual": 256
        // });
        data = this.dataPrep(data);

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
        ns.color.domain(d3.keys(data[0]).filter(function(key) {
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
            d.stackedBarPrep = ns.color.domain().map(function(name) {
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

        ns.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        // IMPORTANT: see data.forEach above to make sure total is properly
        // calculated if additional data paramas are introduced to this viz
        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        // add x axis
        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        // add y axis
        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // add primary svg g layer
        ns.event = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.eventTime) + ",0)";
            });

        // add svg g layer for solid lines
        ns.solidLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        // add svg g layer for dashed lines
        ns.dashedLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        // add svg g layer for hidden rects
        ns.hiddenBarsCanvas = ns.chart.selectAll(".hidden")
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
        ns.chart.call(tip);

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
        ns.event.selectAll("rect")
            .data(function(d) {
                return d.stackedBarPrep;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                var segmentWidth = (ns.mw / data.length);

                // spacing corrected for proportional
                // gaps between rects
                return segmentWidth - segmentWidth * 0.07;
            })
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return ns.color(d.name);
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
                return ns.color(d.name);
            });

        // append hidden bars
        ns.hiddenBarsCanvas.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("width", function(d) {
                var hiddenBarWidth = (ns.mw / data.length);
                return hiddenBarWidth - hiddenBarWidth * 0.07;
            })
            .attr("opacity", "0")
            .attr("x", function(d) {
                return ns.x(d.eventTime);
            })
            .attr("y", 0)
            .attr("height", function(d) {
                return ns.mh;
            }).on('mouseenter', function(d) {

                // coax the pointer to line up with the bar center
                var nudge = (ns.mw / data.length) * 0.5;
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
                    return ns.x(d.eventTime);
                })
                .y(function(d) {
                    return ns.y(d[param]);
                });
        };

        // abstracts the path generator to accept a data param
        // and creates a solid line with the appropriate color
        var solidPathGenerator = function(param) {
            return ns.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        };

        // abstracts the path generator to accept a data param
        // and creates a dashed line with the appropriate color
        var dashedPathGenerator = function(param) {
            return ns.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-dasharray", "5, 2");
        };

        // lineFunction must be a named local
        // variable as it will be called by
        // the pathGenerator function that immediately follows
        var lineFunction;
        if (ns.featureSet === 'cpu') {

            // generate solid line for Virtual data points
            // uncomment if supplying virtual stat again
            // lineFunction = lineFunctionGenerator('Virtual');
            // solidPathGenerator('Virtual');

            // generate dashed line for Physical data points
            lineFunction = lineFunctionGenerator('Physical');
            dashedPathGenerator('Physical');

        } else if (ns.featureSet === 'disk') {

            // generate solid line for Total data points
            lineFunction = lineFunctionGenerator('Total');
            solidPathGenerator('Total');
        } else if (ns.featureSet === 'mem') {

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
                ['Value', 0],
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

        if (ns.featureSet !== null) {
            this.appendLegend(legendSpecs[ns.featureSet]);
        } else {
            this.appendLegend(legendSpecs.spawn);
        }
    },

    appendLegend: function(legendSpecs) {

        // abstracts the appending of chart legends based on the
        // passed in array params [['Title', colorSetIndex],['Title', colorSetIndex'],...]

        var ns = this.defaults;

        _.each(legendSpecs, function(item) {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', item[0])
                .attr('data-legend', item[0])
                .attr('data-legend-color', ns.color.range()[item[1]]);
        });

        var legend = ns.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20,-35)')
            .attr('opacity', 1.0)
            .call(d3.legend);
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {

        new ChartHeaderView({
            el: this.el,
            columns: 12,
            chartTitle: this.defaults.chartTitle,
            infoText: this.defaults.infoCustom
        });

        $(this.el).find('.mainContainer').append(this.template());
        return this;
    }

});
