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
 * Author: John Stanford
 */

goldstone.namespace('nova.dom');
goldstone.namespace('nova.discover');
goldstone.namespace('nova.report');
goldstone.namespace('nova.spawns');
goldstone.namespace('nova.spawns.renderlets');
goldstone.namespace('nova.util');
goldstone.namespace('nova.instantaneous');
goldstone.namespace('nova.timeRange');
goldstone.namespace('nova.cpu');
goldstone.namespace('nova.cpu.renderlets');
goldstone.namespace('nova.mem');
goldstone.namespace('nova.mem.renderlets');
goldstone.namespace('nova.disk');
goldstone.namespace('nova.disk.renderlets');
goldstone.namespace('nova.zones');
goldstone.namespace('nova.zones.renderlets');
goldstone.namespace('nova.latestStats');
goldstone.namespace('nova.latestStats.renderlets');
goldstone.namespace('nova.apiPerf');
goldstone.namespace('nova.apiPerf.timeRange');
goldstone.namespace('nova.topology');

goldstone.nova.timeRange._url = function (ns, start, end, interval, render, path) {
    "use strict";
    var gt = goldstone.time;
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start);
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end);
    interval = interval ? interval : ns.interval;

    var url = path +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval;
    if (typeof render !== 'undefined') {
        url += "&render=" + render;
    }
    return url;
};

goldstone.nova.instantaneous._url = function (ns, render, path) {
    "use strict";

    var url = path;
    if (typeof render !== 'undefined') {
        url += "?render=" + render;
    }
    return url;
};

goldstone.nova.latestStats.url = function (render) {
    "use strict";
    var ns = goldstone.nova.latestStats,
        path = "/nova/hypervisor/latest-stats";
    return goldstone.nova.instantaneous._url(ns, render, path);
};

goldstone.nova.topology.url = function (render) {
    "use strict";
    var url = "/nova/topology";

    if (typeof render !== 'undefined') {
        url += "?render=" + render;
    }
    return url;
};


goldstone.nova.spawns.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.spawns,
        path = "/nova/hypervisor/spawns";
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path);
};

goldstone.nova.cpu.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.cpu,
        path = "/nova/hypervisor/cpu";
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path);
};

goldstone.nova.mem.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.mem,
        path = "/nova/hypervisor/mem";
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path);
};

goldstone.nova.disk.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.disk,
        path = "/nova/hypervisor/disk";
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path);
};

goldstone.nova.zones.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.zones,
        path = "/nova/zones";
    return goldstone.nova.timeRange._url(ns, start, end, interval, render, path);
};

goldstone.nova.apiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.apiPerf,
        path = "/nova/api_perf";
    return goldstone.nova.apiPerf.timeRange._url(ns, start, end, interval, render, path);
};

goldstone.nova.apiPerf.timeRange._url = function (ns, start, end, interval, render, path) {
    "use strict";
    var gt = goldstone.time;
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start);
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end);
    interval = interval ? interval : ns.interval;

    var url = path +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval;
    if (typeof render !== 'undefined') {
        url += "&render=" + render;
    }
    return url;
};

goldstone.nova.timeRange._loadUrl = function (ns, start, end, interval, location, render) {
    "use strict";
    location = location ? location : ns.parent;

    ns.parent = location;
    ns.start = start;
    ns.end = end;
    ns.interval = interval;

    render = typeof render !== 'undefined' ? render : false;
    if (render) {
        $(ns.parent).load(ns.url(start, end, interval, render));
    } else {
        // just get the data and set it in the spawn object
        $.getJSON(ns.url(start, end, interval, render), function (data) {
            ns.data = data;
            // TODO trigger a redraw of the chart with the new data
        });
    }
};

goldstone.nova.instantaneous._loadUrl = function (ns, location, render) {
    "use strict";
    location = location ? location : ns.parent;

    ns.parent = location;

    render = typeof render !== 'undefined' ? render : false;
    if (render) {
        $(ns.parent).load(ns.url(render));
    } else {
        // just get the data and set it in the spawn object
        $.getJSON(ns.url(render), function (data) {
            ns.data = data;
            // TODO trigger a redraw of the chart with the new data
        });
    }
};

goldstone.nova.util.rsrcChartFunctions = function (hasVirtual) {
    "use strict";
    var reduceEnterFunction = hasVirtual ? function (p, v) {
            p[0] += v[1];
            p[1] += v[2];
            p[2] += v[3];
            return p;
        } : function (p, v) {
            p[0] += v[1];
            p[1] += v[2];
            return p;
        },
        reduceExitFunction = hasVirtual ? function (p, v) {
            p[0] -= v[1];
            p[1] -= v[2];
            p[2] -= v[3];
            return p;
        } : function (p, v) {
            p[0] -= v[1];
            p[1] -= v[2];
        },
        reduceInitFunction = hasVirtual ? function () {
            return [0, 0, 0];
        } : function () {
            return [0, 0];
        };

    return {
        enterFunction: reduceEnterFunction,
        exitFunction: reduceExitFunction,
        initFunction: reduceInitFunction
    };
};

goldstone.nova.util.renderRsrcChart = function (ns) {
    "use strict";
    var hasVirtual = true,
        panelWidth = $(ns.location).width();

    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.");
            $(ns.spinner).hide();
        } else {
            // this gets us a basic chart
            ns.chart = dc.compositeChart(ns.location);
            ns.totalPhysChart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill);
            ns.usedChart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill);
            var events = _.map(ns.data, function (v, k) {
                // [time, total_phys, used, total_virt
                if (v.length === 4) {
                    // cpu/mem, physical and virtual
                    return [new Date(Number(k)), v[0], v[3], v[2]];
                } else {
                    // disk, no virtual
                    hasVirtual = false;
                    return [new Date(Number(k)), v[0], v[1]];
                }
            }).sort(function (a, b) {
                return (a[0] > b[0]) ? 1: (a[0] < b[0]) ? -1 : 0;
            });

            var groupFunctions = goldstone.nova.util.rsrcChartFunctions(hasVirtual);
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0];
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                group = timeDim.group().reduce(
                    groupFunctions.enterFunction,
                    groupFunctions.exitFunction,
                    groupFunctions.initFunction
                );

            ns.totalPhysChart
                .renderArea(false)
                .dimension(timeDim)
                .group(group, "Physical")
                .ordinalColors(goldstone.settings.charts.ordinalColors.slice(0))
                .valueAccessor(function (d) {
                    return d.value[0];
                });

            ns.usedChart
                .renderArea(true)
                .dimension(timeDim)
                .group(group, "Used")
                .ordinalColors(goldstone.settings.charts.ordinalColors.slice(3))
                .valueAccessor(function (d) {
                    return d.value[1];
                });

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
                .xAxis().ticks(5);

            if (hasVirtual) {
                ns.totalVirtChart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill);
                ns.totalVirtChart
                    .renderArea(false)
                    .dimension(timeDim)
                    .group(group, "Virtual")
                    .ordinalColors(goldstone.settings.charts.ordinalColors.slice(2))
                    .valueAccessor(function (d) {
                        return d.value[2];
                    });

                ns.totalPhysChart.dashStyle([5, 3]);

                ns.chart
                    .compose([ns.usedChart, ns.totalPhysChart, ns.totalVirtChart]);
            } else {
                ns.chart.compose([ns.usedChart, ns.totalPhysChart]);
            }

            ns.chart.render();
            $(ns.spinner).hide();
        }
    }
};

goldstone.nova.spawns.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.spawns;

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render);
};

goldstone.nova.cpu.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.cpu;

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render);
};

goldstone.nova.mem.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.mem;

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render);
};

goldstone.nova.disk.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.disk;

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render);
};

goldstone.nova.zones.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.zones;

    goldstone.nova.timeRange._loadUrl(ns, start, end, interval, location, render);
};

goldstone.nova.latestStats.loadUrl = function (location, render) {
    "use strict";
    var ns = goldstone.nova.latestStats;

    goldstone.nova.instantaneous._loadUrl(ns, location, render);
};

// mostly based on crossfilter and dc.js below here (except zones chart)
// works ok, but no concept of streaming data in crossfilter, so basically
// need to recalc the dataset each time an update comes in.  fine for now,
// but not really our philosophy for the long run.

goldstone.nova.spawns.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [successes(Number), failures(Number)], ...}
    var ns = goldstone.nova.spawns;
    if (ns && ns.data !== undefined) {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.");
            $(ns.spinner).hide();
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill);
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[2]];
            });
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0];
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                successGroup = timeDim.group().reduceSum(function (d) {
                    return d[2];
                }),
                failureGroup = timeDim.group().reduceSum(function (d) {
                    return d[1];
                });

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(successGroup, "Success").valueAccessor(function (d) {
                    return d.value;
                })
                .stack(failureGroup, "Fail", function (d) {
                    return d.value;
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value + " events";
                })
                .yAxisLabel("Spawn Events")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true));

            ns.chart.render();
            $(ns.spinner).hide();
        }
    }
};

goldstone.nova.spawns.renderlets.clickDrill = function (_chart) {
    "use strict";
    var ns = goldstone.nova.spawns;
    var gt = goldstone.time;
    _chart.selectAll("circle.dot")
        .on("click", function (d) {
            var oldInterval = Number(ns.interval.slice(0, -1));
            var start = (new Date(d.data.key)).addSeconds(-1 * oldInterval),
                end = (new Date(d.data.key)).addSeconds(oldInterval),
                newInterval = gt.autoSizeInterval(start, end);

            ns.loadUrl(start, end, newInterval, ns.parent, true);

        });
};

goldstone.nova.cpu.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.cpu;
    goldstone.nova.util.renderRsrcChart(ns);

};

goldstone.nova.mem.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.mem;
    goldstone.nova.util.renderRsrcChart(ns);
};

goldstone.nova.disk.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.disk;
    goldstone.nova.util.renderRsrcChart(ns);
};

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
            .attr("y", 10);

    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.");
            $(ns.spinner).hide();
        } else {
            (function (json) {
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 10)
                    .attr("class", "instantaneous-data")
                    .text(json[0].count);
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 50)
                    .attr("class", "instantaneous-label")
                    .text("Hypervisors");
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 80)
                    .attr("class", "instantaneous-data")
                    .text(json[0].running_vms);
                vis.append("tspan")
                    .attr("x", 10)
                    .attr("dy", 50)
                    .attr("class", "instantaneous-label")
                    .text("Running VMs");
            })(ns.data);
            $(ns.spinner).hide();
        }
    }
};
