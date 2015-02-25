/**
 * Copyright 2014 - 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
View is currently directly implemented as Nova VM Spawns Viz
and extended into Nova CPU/Memory/Disk Resource Charts

instantiated similar to:

this.vmSpawnChart = new StackedBarChartCollection({
    urlPrefix: '/nova/hypervisor/spawns'
});

this.vmSpawnChartView = new StackedBarChartView({
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

var StackedBarChartView = GoldstoneBaseView.extend({

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
        StackedBarChartView.__super__.processOptions.apply(this, arguments);

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
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct[3]);
        } else {
            // this includes "VM Spawns" and "Disk Resources" chars
            ns.color = d3.scale.ordinal()
                .range(ns.colorArray.distinct[2]);
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

        var result = [];

        if (ns.featureSet === 'cpu') {

            // CPU Resources chart data prep
            // {timestamp: [used, phys, virt]}
            _.each(data[0], function(item, i) {
                result.push({
                    "eventTime": "" + i,
                    "Used": item[0],
                    "Physical": item[1],
                    "Virtual": item[2]
                });
            });

        } else if (ns.featureSet === 'disk') {

            // Disk Resources chart data prep
            // {timestamp: [used, total]}
            _.each(data[0], function(item, i) {
                result.push({
                    "eventTime": "" + i,
                    "Used": item[0],
                    "Total": item[1]
                });
            });

        } else if (ns.featureSet === 'mem') {

            // Memory Resources chart data prep
            // {timestamp: [used, phys, virt]}
            _.each(data[0], function(item, i) {
                result.push({
                    "eventTime": "" + i,
                    "Used": item[0],
                    "Physical": item[1],
                    "Virtual": item[2]
                });
            });

        } else {

            // Spawns Resources chart data prep
            // {timestamp: [success, fail]}
            _.each(data[0], function(item, i) {
                result.push({
                    "eventTime": "" + i,
                    "Success": item[0],
                    "Failure": item[1]
                });
            });

        }

        return result;
    },

    computeBarHeightPopover: function(d) {

        if (d.name === undefined) {
            d.name = 'Missing name param';
        }

        // if no y0 or y1 val, don't try to do math on undefined
        if (d.y0 === undefined || d.y1 === undefined) {
            return "<p>" + d.name + "<br>" + "No value reported";
        }

        // otherwise return a string in the format of
        // "<p>Success<br>10"

        // 'Failure/Success' is only used by Spawn viz
        if (d.name === 'Failure' || d.name === 'Success') {

            // VM Spawn chart should only return the exact
            // value represented by the individual rect
            return "<p>" + d.name + "<br>" + (d.y1 - d.y0);
        } else {

            // the other charts should return the value
            // represented by the top edge of the rect
            return "<p>" + d.name + "<br>" + d.y1;
        }
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

        // if empty set, append info popup and stop
        if (this.checkReturnedDataSet(data) === false) {
            return;
        }

        // clear elements from previous render
        $(this.el).find('svg').find('rect').remove();
        $(this.el).find('svg').find('line').remove();
        $(this.el).find('svg').find('.axis').remove();
        $(this.el).find('svg').find('.legend').remove();
        $(this.el).find('svg').find('path').remove();
        $(this.el).find('svg').find('circle').remove();
        $(this.el + '.d3-tip').detach();

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
            if(d.Virtual){
                d.total = d.Virtual;
            }
            if(d.Total){
                d.total = d.Total;
            }
        });

        // the forEach operation creates chaos in the order of the set
        // must _.sortBy to return it to an array sorted by eventTime
        data = _.sortBy(data, function(item) {
            return item.eventTime;
        });

        console.log('data', data);

        ns.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        ns.event = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.eventTime) + ",0)";
            });

        ns.solidLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        ns.dashedLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return self.computeBarHeightPopover(d);
            });

        // Invoke the tip in the context of your visualization
        ns.chart.call(tip);

        // used below to determing whether to render as
        // a "rect" or a "line"
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

                // spacing corrected
                // for proportional gaps between rects
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
                    return 0.9;
                }
            })
            .attr("fill-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 0.7;
                }
            })
            .attr("stroke-width", 2)
            .style("fill", function(d) {
                return ns.color(d.name);
            }).on('mouseenter', function(d, i) {
                var targ = d3.select(self.el).select('rect');
                tip.offset([0, 0]).show(d, targ);
            }).on('mouseleave', function() {
                tip.hide();
            });

        // append lines based on dashed or dotted
        if (data[0].Virtual || data[0].Total) {
            lineFunction = d3.svg.line()
                .interpolate("linear")
                .x(function(d) {
                    return ns.x(d.eventTime);
                })
                .y(function(d) {
                    if (d.Total) {
                        return ns.y(d.Total);
                    } else {
                        return ns.y(d.Virtual);
                    }
                });

            pathStuff = ns.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return data[0].Virtual ? ns.color('Virtual') : ns.color('Total');
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");

            pathStuff = ns.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return data[0].Virtual ? ns.color('Virtual') : ns.color('Total');
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");

            ns.solidLineCanvas.selectAll("circle")
                .data(data)
                .enter().append("svg:circle")
                .attr("cx", function(d) {
                    return ns.x(d.eventTime);
                })
                .attr("cy", function(d) {
                    if (d.Total) {
                        return ns.y(d.Total);
                    } else {
                        return ns.y(d.Virtual);
                    }
                })
                .attr("fill", "white")
                .attr("stroke", function() {
                    return data[0].Virtual ? ns.color('Virtual') : ns.color('Total');
                })
                .attr("r", 3);
        }

        if (data[0].Physical) {
            lineFunction = d3.svg.line()
                .interpolate("linear")
                .x(function(d) {
                    return ns.x(d.eventTime);
                })
                .y(function(d) {
                    return ns.y(d.Physical);
                });

            pathStuff = ns.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color('Physical');
                })
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-dasharray", "5, 2");

            ns.dashedLineCanvas.selectAll("circle")
                .data(data)
                .enter().append("svg:circle")
                .attr("cx", function(d) {
                    return ns.x(d.eventTime);
                })
                .attr("cy", function(d) {
                    return ns.y(d.Physical);
                })
                .attr("fill", "white")
                .attr("stroke", function() {
                    return ns.color('Physical');
                })
                .attr("r", 3);
        }


        // ns.event.selectAll("line")
        //     .data(function(d) {
        //         return d.stackedBarPrep;
        //     })
        //     .enter().append("line")
        //     .attr("x1", function(d) {
        //         var segmentWidth = (ns.mw / data.length);

        //         // makes the line solid
        //         // don't adjust for very small data sets
        //         if (data.length <= 3) {
        //             return 0;
        //         } else {
        //             return segmentWidth * -0.17;
        //         }
        //     })
        //     .attr("x2", function(d) {
        //         var segmentWidth = (ns.mw / data.length);
        //         // makes the line solid
        //         // don't adjust for very small data sets
        //         if (data.length <= 3) {
        //             return segmentWidth;
        //         } else {
        //             return segmentWidth + segmentWidth * 0.17;
        //         }
        //     })
        //     .attr("y1", function(d) {
        //         return ns.y(d.y1);
        //     })
        //     .attr("y2", function(d) {
        //         // horizontal line, so y1 === y2
        //         return ns.y(d.y1);
        //     })
        //     .attr("stroke", function(d) {
        //         // color of line
        //         return ns.color(d.name);
        //     })
        //     .attr("stroke-width", function(d) {
        //         // hide if data already used for "rect" above
        //         if (showOrHide[d.name]) {
        //             return 0;
        //         } else {
        //             return 2;
        //         }
        //     }).attr("stroke-dasharray", function(d) {
        //         if (d.name === "Physical") {
        //             return "5, 3";
        //         } else {
        //             return null;
        //         }
        //     });

        var legendSpecs = {
            mem: [
                ['Virtual', 2],
                ['Physical', 1],
                ['Used', 0]
            ],
            cpu: [
                ['Virtual', 2],
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
            .attr('opacity', 0.7)
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
