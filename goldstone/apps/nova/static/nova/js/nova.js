/**
 * Copyright 2014 Solinea, Inc.
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
 *
 * Author: John Stanford
 */

goldstone.namespace('nova.dom')
goldstone.namespace('nova.discover')
goldstone.namespace('nova.report')
goldstone.namespace('nova.spawns')
goldstone.namespace('nova.spawns.renderlets')
goldstone.namespace('nova.util')
goldstone.namespace('nova.instantaneous')
goldstone.namespace('nova.timeRange')
goldstone.namespace('nova.cpu')
goldstone.namespace('nova.cpu.renderlets')
goldstone.namespace('nova.mem')
goldstone.namespace('nova.mem.renderlets')
goldstone.namespace('nova.disk')
goldstone.namespace('nova.disk.renderlets')
goldstone.namespace('nova.zones')
goldstone.namespace('nova.zones.renderlets')
goldstone.namespace('nova.latestStats')
goldstone.namespace('nova.latestStats.renderlets')
goldstone.namespace('nova.apiPerf')

goldstone.nova.timeRange._url = function (ns, start, end, interval, render, path) {
    "use strict";
    var gt = goldstone.time
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval

    var url = path +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}

goldstone.nova.instantaneous._url = function (ns, render, path) {
    "use strict";

    var url = path
    if (typeof render !== 'undefined') {
        url += "?render=" + render
    }
    return url
}

goldstone.nova.latestStats.url = function (render) {
    "use strict";
    var ns = goldstone.nova.latestStats,
        path = "/nova/hypervisor/latest-stats"
    return goldstone.nova.instantaneous._url(ns, render, path)
}

goldstone.nova.spawns.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.spawns,
        path = "/nova/hypervisor/spawns"
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path)
}

goldstone.nova.cpu.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.cpu,
        path = "/nova/hypervisor/cpu"
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path)
}

goldstone.nova.mem.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.mem,
        path = "/nova/hypervisor/mem"
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path)
}

goldstone.nova.disk.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.disk,
        path = "/nova/hypervisor/disk"
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path)
}

goldstone.nova.zones.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.zones,
        path = "/nova/zones"
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path)
}

goldstone.nova.apiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.apiPerf,
        path = "/nova/api_perf"
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path)
}

goldstone.nova.timeRange._loadUrl = function (ns, start, end, interval, location, render) {
    "use strict";
    location = location ? location : ns.parent

    ns.parent = location
    ns.start = start
    ns.end = end
    ns.interval = interval

    render = typeof render !== 'undefined' ? render : false
    if (render) {
        $(ns.parent).load(ns.url(start, end, interval, render))
    } else {
        // just get the data and set it in the spawn object
        $.getJSON(ns.url(start, end, interval, render), function (data) {
            ns.data = data
            // TODO trigger a redraw of the chart with the new data
        })
    }
}

goldstone.nova.instantaneous._loadUrl = function (ns, location, render) {
    "use strict";
    location = location ? location : ns.parent

    ns.parent = location

    render = typeof render !== 'undefined' ? render : false
    if (render) {
        $(ns.parent).load(ns.url(render))
    } else {
        // just get the data and set it in the spawn object
        $.getJSON(ns.url(render), function (data) {
            ns.data = data
            // TODO trigger a redraw of the chart with the new data
        })
    }
}

goldstone.nova.util.rsrcChartFunctions = function (hasVirtual) {
    "use strict";
    var reduceEnterFunction = hasVirtual ? function (p, v) {
            p[0] += v[1]
            p[1] += v[2]
            p[2] += v[3]
            return p
        } : function (p, v) {
            p[0] += v[1]
            p[1] += v[2]
            return p
        },
        reduceExitFunction = hasVirtual ? function (p, v) {
            p[0] -= v[1]
            p[1] -= v[2]
            p[2] -= v[3]
            return p
        } : function (p, v) {
            p[0] -= v[1]
            p[1] -= v[2]
        },
        reduceInitFunction = hasVirtual ? function () {
            return [0, 0, 0]
        } : function () {
            return [0, 0]
        }

    return {
        enterFunction: reduceEnterFunction,
        exitFunction: reduceExitFunction,
        initFunction: reduceInitFunction
    }
}

goldstone.nova.util.renderRsrcChart = function (ns) {
    "use strict";
    var hasVirtual = true,
        panelWidth = $(ns.location).width()

    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = dc.compositeChart(ns.location)
            ns.totalPhysChart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            ns.usedChart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                // [time, total_phys, used, total_virt
                if (v.length === 4) {
                    // cpu/mem, physical and virtual
                    return [new Date(Number(k)), v[0], v[3], v[2]]
                } else {
                    // disk, no virtual
                    hasVirtual = false
                    return [new Date(Number(k)), v[0], v[1]]
                }
            }).sort(function (a, b) {
                return (a[0] > b[0]) ? 1: (a[0] < b[0]) ? -1 : 0
            })

            var groupFunctions = goldstone.nova.util.rsrcChartFunctions(hasVirtual)
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                group = timeDim.group().reduce(
                    groupFunctions.enterFunction,
                    groupFunctions.exitFunction,
                    groupFunctions.initFunction
                )

            ns.totalPhysChart
                .renderArea(false)
                .dimension(timeDim)
                .group(group, "Physical")
                .ordinalColors(goldstone.settings.charts.ordinalColors.slice(0))
                .valueAccessor(function (d) {
                    return d.value[0]
                })

            ns.usedChart
                .renderArea(true)
                .dimension(timeDim)
                .group(group, "Used")
                .ordinalColors(goldstone.settings.charts.ordinalColors.slice(3))
                .valueAccessor(function (d) {
                    return d.value[1]
                })

            ns.chart
                .height(ns.height)
                .width(panelWidth)
                .margins({ top: 30, bottom: 60, right: 30, left: 50 })
                .transitionDuration(1000)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .brushOn(false)
                .ordinalColors(goldstone.settings.charts.ordinalColors)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))
                .yAxisLabel(ns.resourceLabel)
                .xAxis().ticks(5)

            if (hasVirtual) {
                ns.totalVirtChart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
                ns.totalVirtChart
                    .renderArea(false)
                    .dimension(timeDim)
                    .group(group, "Virtual")
                    .ordinalColors(goldstone.settings.charts.ordinalColors.slice(2))
                    .valueAccessor(function (d) {
                        return d.value[2]
                    })

                // TODO GOLD-279 TODO: why are the legends different forms (block vs line) for the various resource charts?
                // looks like adding the dashStyle to a composite chart forces the legends to be lines.  Without
                // this statement, they are rects.
                ns.totalPhysChart.dashStyle([5, 3])

                ns.chart
                    .compose([ns.usedChart, ns.totalPhysChart, ns.totalVirtChart])
            } else {
                ns.chart.compose([ns.usedChart, ns.totalPhysChart])
            }

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.spawns.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.spawns

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.cpu.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.cpu

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.mem.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.mem

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.disk.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.disk

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.zones.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.zones

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.latestStats.loadUrl = function (location, render) {
    "use strict";
    var ns = goldstone.nova.latestStats

    goldstone.nova.instantaneous._loadUrl(ns, location, render)
}


// pure d3 pattern for a line chart with data refresh capabilities.  Should
// abstract this to a more general goldstone library if it proves useful.

// the init function sets up the svg element on the page, pulls in the first
// dataset, and sets up the recurring call to the update function.
goldstone.nova.apiPerf.init = function () {
    "use strict";
    var ns = goldstone.nova.apiPerf
    ns.initSvg()
    ns.update()

    // Grab a random sample of letters from the alphabet, in alphabetical order.
    //setInterval(function () {
    //    var now = new Date()
    //    if (now > ns.end) {
    //        ns.end = ns.end.addSeconds(ns.interval)
    //        ns.start = ns.start.addSeconds(ns.interval)
    //    }
    //    ns.loadUrl(ns.start, ns.end, ns.interval)
    //}, 60000)
}

goldstone.nova.apiPerf.loadUrl = function (start, end, interval, render, location) {
    "use strict";
    var ns = goldstone.nova.apiPerf

    render = typeof render !== 'undefined' ? render : false
    if (render) {
        $(location).load(ns.url(start, end, interval, render))
    } else {
        // just get the data and set it in the spawn object
        d3.json(ns.url(ns.start, ns.end, ns.interval), function (error, data) {
            ns.data = data
            ns.update()
        })
    }
}

// here we'll configure as much of the structure of the SVG as possible.  This
// includes legends, axis, labels, renderlets, etc.
goldstone.nova.apiPerf.initSvg = function () {
    "use strict";
    var ns = goldstone.nova.apiPerf
    ns.margin = { top: 30, bottom: 60, right: 30, left: 60 }
    ns.w = $(ns.location).width()
    //ns.h = $(ns.location).height()
    ns.mw = ns.w - ns.margin.left - ns.margin.right
    ns.mh = ns.h - ns.margin.top - ns.margin.bottom
    ns.svg = d3.select(ns.location)
        .append("svg")
            .attr("width", ns.w)
            .attr("height", ns.h)
    ns.chart = ns.svg.append("g")
        .attr('class', 'chart')
        .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")")
}

// refresh the axes when new data comes in
goldstone.nova.apiPerf.updateAxes = function (data) {
    "use strict";
    var ns = goldstone.nova.apiPerf

}

// the update function processes new, existing, and removed data.  Its arg
// can be the loadUrl function that returns the JSON payload from the server.
// Time intervals will be interesting here.  Probably need to rethink the
// use of 'now' as the starting point for calculating an interval, and go to
// a more fixed reference model and rounded intervals.  Repeated calls would
// fill up the last interval bucket until we get to the next rounded value.

goldstone.nova.apiPerf.update = function () {
    "use strict";
    var ns = goldstone.nova.apiPerf

    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            (function (json) {
                // set up data, add a time field based on key and convert all times
                // to milliseconds
                json.forEach(function (d) {
                    d.time = new Date(Number(d.key))
                    d.min = d.min * 1000
                    d.max = d.max * 1000
                    d.avg = d.avg * 1000
                    d.sum_of_squares = d.sum_of_squares * 1000
                    d.sum = d.sum * 1000
                })


                // define our x and y scaling functions
                var x = d3.time.scale()
                    .domain(d3.extent(json, function(d) { return d.time }))
                    .rangeRound([0, ns.mw])
                var y = d3.scale.linear()
                    .domain([0, d3.max(json, function (d) { return d.max })])
                    .range([ns.mh, 0])

                // define our line functions
                var area = d3.svg.area()
                    .interpolate("basis")
                    .x(function (d) { return x(d.time) })
                    .y0(function (d) { return y(d.min) })
                    .y1(function (d) { return y(d.max) })

                var maxLine = d3.svg.line()
                    .interpolate("basis")
                    .x(function (d) { return x(d.time) })
                    .y(function (d) { return y(d.max) })

                var minLine = d3.svg.line()
                    .interpolate("basis")
                    .x(function (d) { return x(d.time) })
                    .y(function (d) { return y(d.min) })

                var avgLine = d3.svg.line()
                    .interpolate("basis")
                    .x(function (d) { return x(d.time) })
                    .y(function (d) { return y(d.avg) })

                var point = ns.chart.selectAll('circle')
                    .data(json)

                // define our axis functions
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")

                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .html(function (d) {
                    return "<p>" + d.time + "<br>Max: " + d.max +
                        "<br>Avg: " + d.avg + "<br>Min: " + d.min + "<p>"
                })

                // initialized the axes
                ns.chart.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0, ' + ns.mh + ')')
                    .call(xAxis);
                ns.chart.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis)
                ns.svg.append("text")
                    .attr("class", "axis.label")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0 - (ns.h / 2))
                    .attr("y", -5)
                    .attr("dy", "1.5em")
                    .text("Response Time (ms)")
                    .style("text-anchor", "middle")

                // Invoke the tip in the context of your visualization
                ns.chart.call(tip)

                // initialize the chart lines
                ns.chart.append("path")
                    .datum(json)
                    .attr("class", "area")
                    .attr("id", "minMaxArea")
                    .attr("d", area)
                    .attr("fill", colorbrewer.Spectral[10][4])
                    .style("opacity", 0.3)

                ns.chart.append('path')
                    .attr('class', 'line')
                    .attr('id', 'minLine')
                    .attr('data-legend', "Min")
                    .style("stroke", colorbrewer.Spectral[10][8])
                    .datum(json)
                    .attr('d', minLine)

                ns.chart.append('path')
                    .attr('class', 'line')
                    .attr('id', 'maxLine')
                    .attr('data-legend', "Max")
                    .style("stroke", colorbrewer.Spectral[10][1])
                    .datum(json)
                    .attr('d', maxLine)

                ns.chart.append('path')
                    .attr('class', 'line')
                    .attr('id', 'avgLine')
                    .attr('data-legend', "Avg")
                    .style("stroke-dasharray", ("3, 3"))
                    .style("stroke", colorbrewer.Greys[3][1])
                    .datum(json)
                    .attr('d', avgLine)

                var legend = ns.chart.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,0)")
                    .call(d3.legend)

                // UPDATE
                // Update old elements as needed.


                // ENTER
                // Create new elements as needed.
                point.enter()
                    .append('circle')
                    .attr('r', function () { return 5 })
                    .attr('cy', function (d) { return y(d.max) })
                    .attr('cx', function (d, i) { return x(d.time) })
                    .style('opacity', 0)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                point.enter()
                    .append('circle')
                    .attr('r', function () { return 5 })
                    .attr('cy', function (d) { return y(d.avg) })
                    .attr('cx', function (d, i) { return x(d.time) })
                    .style('opacity', 0)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                point.enter()
                    .append('circle')
                    .attr('r', function () { return 5 })
                    .attr('cy', function (d) { return y(d.min) })
                    .attr('cx', function (d, i) { return x(d.time) })
                    .style('opacity', 0)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)



                // ENTER + UPDATE
                // Appending to the enter selection expands the update selection to include
                // entering elements; so, operations on the update selection after appending to
                // the enter selection will apply to both entering and updating nodes.


                // EXIT
                // Remove old elements as needed.

            })(ns.data)
            $(ns.spinner).hide()
        }
    }
}



// mostly based on crossfilter and dc.js below here (except zones chart)
// works ok, but no concept of streaming data in crossfilter, so basically
// need to recalc the dataset each time an update comes in.  fine for now,
// but not really our philosophy for the long run.

goldstone.nova.spawns.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [successes(Number), failures(Number)], ...}
    var ns = goldstone.nova.spawns
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                successGroup = timeDim.group().reduceSum(function (d) { return d[1] }),
                failureGroup = timeDim.group().reduceSum(function (d) { return d[2] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(successGroup, "Success").valueAccessor(function (d) {
                    return d.value
                })
                .stack(failureGroup, "Fail", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value + " events"
                })
                .yAxisLabel("Spawn Events")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.spawns.renderlets.clickDrill = function (_chart) {
    "use strict";
    var ns = goldstone.nova.spawns
    var gt = goldstone.time
    _chart.selectAll("circle.dot")
        .on("click", function (d) {
            var oldInterval = Number(ns.interval.slice(0, -1))
            var start = (new Date(d.data.key)).addSeconds(-1 * oldInterval),
                end = (new Date(d.data.key)).addSeconds(oldInterval),
                newInterval = gt.autoSizeInterval(start, end)

            ns.loadUrl(start, end, newInterval, ns.parent, true)

        })
}

goldstone.nova.cpu.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.cpu
    goldstone.nova.util.renderRsrcChart(ns)

}

goldstone.nova.mem.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.mem
    goldstone.nova.util.renderRsrcChart(ns)
}

goldstone.nova.disk.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.disk
    goldstone.nova.util.renderRsrcChart(ns)
}


/*
Text view of key statistics for nova hypervisors
 */
goldstone.nova.latestStats.drawText = function () {
    "use strict";
    var ns = goldstone.nova.latestStats,
        m = [20, 80, 20, 80],
        panelWidth = $(ns.location).width() - m[1] - m[3],
        panelHeight = ns.height - m[0] - m[2],
        vis = d3.select(ns.location).append("svg")
            .attr("width", panelWidth + m[1] + m[3])
            .attr("height", panelHeight + m[0] + m[2])
            .attr("type", "image/svg+xml")
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
            .append("text")
            .attr("x", 10)
            .attr("y", 10)


    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            (function (json) {
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 10)
                    .attr("class", "instantaneous-data")
                    .text(json[0].count)
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 50)
                    .attr("class", "instantaneous-label")
                    .text("Hypervisors")
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 80)
                    .attr("class", "instantaneous-data")
                    .text(json[0].running_vms)
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 50)
                    .attr("class", "instantaneous-label")
                    .text("Running VMs")
            })(ns.data)
            $(ns.spinner).hide()
        }
    }
}
/*
A collabsible tree view of the nova zone heirarchy
 */
goldstone.nova.zones.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.zones,
        i = 0,
        m = [20, 80, 20, 80],
        panelWidth = $(ns.location).width() - m[1] - m[3],
        panelHeight = ns.height - m[0] - m[2],
        tree = d3.layout.tree().size([ns.height, panelWidth]),
        diagonal = d3.svg.diagonal()
            .projection(function (d) { return [d.y, d.x]; }),
        vis = d3.select(ns.location).append("svg")
            .attr("width", panelWidth + m[1] + m[3])
            .attr("height", panelHeight + m[0] + m[2])
            .attr("type", "image/svg+xml")
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")"),
        root



    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            (function (json) {
                root = json
                root.x0 = panelHeight / 2
                root.y0 = 0

                function toggleAll(d) {
                    if (d.children) {
                        d.children.forEach(toggleAll)
                        toggle(d)
                    }
                }

                // Initialize the display to show only the first tier of children
                root.children.forEach(toggleAll)
                update(root)
            })(ns.data);
        }
    }

    function update(source) {
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            // TODO make the tree branch length configurable
            d.y = d.depth * 140;
        });

        // Update the nodes…
        var node = vis.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", function (d) {
                toggle(d);
                update(d);
            });

        // add the "new host" image
        nodeEnter
            .append("g")
            .attr("class", function (x) { return "icon attribute plus-icon"})
            .attr("transform", "scale(0.0000001) translate(-15, 10)")
            .call(function (d) {
                $.get("/static/images/metrize/plus.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        // add the "missing host" image
        nodeEnter
            .append("g")
            .attr("class", function (x) { return "icon attribute question-icon"})
            .attr("transform", "scale(0.0000001) translate(15, 10)")
            .call(function (d) {
                $.get("/static/images/metrize/question.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        nodeEnter
            .append("g")
            .attr("class", function (x) { return "icon attribute info-icon"})
            .attr("transform", "scale(0.0000001) translate(0, 10)")
            .call(function (d) {
                $.get("/static/images/metrize/info.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        nodeEnter
            .append("g")
            .attr("class", function (x) { return "icon attribute cross-icon"})
            .attr("transform", "scale(0.0000001) translate(0, 10)")
            .call(function (d) {
                $.get("/static/images/metrize/cross.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        nodeEnter.append("svg:text")
            .attr("x", 0)
            .attr("dy", "-1em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.name;
            })
            .style("fill-opacity", 1e-6);

        nodeEnter
            .append("g")
            .attr("class", function (d) {
                return "icon main " + (d.rsrcType || "cloud") + "-icon"
            })
            .attr("transform", "scale(0.0000001)")

        vis.selectAll(".icon.main.cloud-icon")
            .call(function (d) {
                $.get("/static/images/icon_cloud.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        vis.selectAll(".icon.main.zone-icon")
            .call(function (d) {
                $.get("/static/images/icon_zone.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        vis.selectAll(".icon.main.host-icon")
            .call(function (d) {
                $.get("/static/images/icon_host.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        vis.selectAll(".icon.main.service-icon")
            .call(function (d) {
                $.get("/static/images/icon_service.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select(".icon.main")
            .attr("transform", 'translate(-5, -10) scale(0.05)')
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff"
            });

        function hasNewHiddenChildren(d) {
            return d._children && _.findWhere(d._children, {'lifeStage': 'new'})
        }

        function isNewChild(d) {
            return d.lifeStage === 'new'
        }

        function hasMissingHiddenChildren(d) {
            return d._children && _.findWhere(d._children, {'missing': true})
        }

        function isMissingChild(d) {
            return d.missing
        }

        function hasRemovedChildren(d) {
            return d._children && _.findWhere(d._children, {'lifeStage': 'removed'})
        }

        function isRemovedChild(d) {
            return d.lifeStage === 'removed'
        }

        // update the "new host" icon
        nodeUpdate.select(".icon.attribute.plus-icon")
            .style("fill", function (d) {
                    return hasNewHiddenChildren(d) || isNewChild(d) ? "green" : "#fff";
                })
            .style("stroke", function (d) {
                    return hasNewHiddenChildren(d) || isNewChild(d) ? "green" : "#fff";
                })
            .attr("transform", function (d) {
                    return hasNewHiddenChildren(d) || isNewChild(d) ?
                        'translate(-15, 10) scale(0.025)':
                        'translate(-15, 10) scale(0.0000001)'
                })

        // update the "missing host" icon
        nodeUpdate.select(".icon.attribute.question-icon")
            .style("fill", function (d) {
                    return hasMissingHiddenChildren(d) || isMissingChild(d) ? "red" : "#fff";
                })
            .style("stroke", function (d) {
                    return hasMissingHiddenChildren(d) || isMissingChild(d) ? "red" : "#fff";
                })
            .attr("transform", function (d) {
                    return hasMissingHiddenChildren(d) || isMissingChild(d) ?
                        'translate(15, 10) scale(0.025)':
                        'translate(15, 10) scale(0.0000001)'
                })


        nodeUpdate.select(".icon.attribute.info-icon")
            .attr("transform", function (d) {
                if (! (hasRemovedChildren(d) || isRemovedChild(d))) {
                    return d.hasInfo  ?
                        'translate(0, 10) scale(0.025)':
                        'translate(0, 10) scale(0.0000001)'
                } else {
                    return 'translate(0, 10) scale(0.0000001)'
                }
            })

        nodeUpdate.select("text")
            .style("fill-opacity", 1)
            .style("text-decoration", function (d) {
                return (hasRemovedChildren(d) || isRemovedChild(d)) ?
                    "line-through" : ""
            })

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = vis.selectAll("path.link")
            .data(tree.links(nodes), function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children.
    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }
}

