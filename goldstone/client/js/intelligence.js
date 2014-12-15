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

var secondaryCockpitCharts = {};
var colorArray = new GoldstoneColors().get('colorSets');

function _toPyTs(t) {
    "use strict";
    if (typeof t === 'number') {
        return String(Math.round(t / 1000));
    } else if (Object.prototype.toString.call(t) === '[object Date]') {
        return String(Math.round(t.getTime() / 1000));
    }
}

function isRefreshing() {
    "use strict";
    return $("#autoRefresh").prop("checked");
}

function getRefreshInterval() {
    "use strict";
    return $("select#autoRefreshInterval").val();
}

function refocusCockpitSecondaryCharts(filter) {
    "use strict";
    var keys = Object.keys(secondaryCockpitCharts);

    keys.forEach(function (key) {
        secondaryCockpitCharts[key].focus(filter);
    });
}

function _getSearchFormDates() {
    "use strict";
    //grab the values from the form elements
    var end = (function () {
            if (! $("#endTimeNow").prop("checked")) {
                var e = $("input#settingsEndTime").val();
                switch (e) {
                    case '':
                        return new Date();
                    default:
                        var d = new Date(+e);
                        if ( d.toString() === 'Invalid Date') {
                            alert("End date must be valid. Using now.");
                            d = new Date();
                        }
                        return d;
                }
            } else {
                return new Date();
            }
        })(),
        start = (function () {
            var s = $("input#settingsStartTime").val();
            switch (s) {
                case '':
                    return (new Date(end)).addWeeks(-1);
                default:
                    var d = new Date(+s);
                    if (d.toString() === 'Invalid Date') {
                        alert("Start date must be valid. Using 1 week " +
                            "prior to end date.");
                        d = (new Date()).addWeeks(-1);
                    }
                    return d;
            }
        })();

    return [start, end];
}

/**
 * Returns an appropriately sized interval to retrieve a max number
 * of points/bars on the chart
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 * @param {Number} maxBuckets maximum number of buckets for the time range
 * @return {Number} An integer representation of the number of seconds of
 * an optimal interval
 */
function _autoSizeTimeInterval(start, end, maxPoints) {
    "use strict";
    var diffSeconds = (end.getTime() - start.getTime()) / 1000;
    return diffSeconds / maxPoints;
}

/**
 * Returns a Date object if given a Date or a numeric string
 * @param {[Date, String]} the date representation
 * @return {Date} the date representation of the string
 */
function _paramToDate(param) {
    "use strict";
    if (param instanceof Date) {
        return param;
    } else {
        return new Date(Number(param));
    }
}

/**
 * Returns appropriately formatted start, end, and interval specifications when
 * provided the parameter strings from the request
 * @param {String} start Instance of String representing start of interval
 * @param {String} end Instance of String representing end of interval
 * @return {Object} An object of {start:Date, end:Date, interval:String}
 */
function _processTimeBasedChartParams(end, start, maxPoints) {
    "use strict";

    var endDate = typeof end !== 'undefined' ?
        _paramToDate(end) :
        new Date(),
    startDate = typeof start !== 'undefined' ?
        _paramToDate(start) :
        (function () {
            var s = new Date(endDate);
            s.addWeeks(-1);
            return s;
        })(),
    result = {
        'start': startDate,
        'end': endDate
    };

    if (typeof maxPoints !== 'undefined') {
        result.interval = String(_autoSizeTimeInterval(startDate, endDate, maxPoints)) + "s";
    }

    return result;

}

/**
 * Returns a chart stub based on a dc.barChart
 * @param {String} location String representation of a jquery selector
 * @param {Object} margins Object containing top, bottom, left, right margins
 * @param {Function} renderlet Function to be passed as a renderlet
 * @return {Object} A dc.js bar chart
 */
function _barChartBase(location, margins, renderlet) {
    "use strict";
    var panelWidth = $(location).width();
    var chart = dc.barChart(location);

    margins = typeof margins !== 'undefined' ?
        margins : { top: 50, bottom: 60, right: 30, left: 40 };

    chart
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .centerBar(true)
        .elasticY(true)
        .brushOn(false)
        .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5));

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet);
    }

    return chart;
}

/**
 * Returns a chart stub based on a dc.lineChart
 * @param {String} location String representation of a jquery selector
 * @param {Object} margins Object containing top, bottom, left, right margins
 * @param {Function} renderlet Function to be passed as a renderlet
 * @return {Object} A dc.js line chart
 */
function _lineChartBase(location, margins, renderlet) {
    "use strict";
    var panelWidth = $(location).width();
    var chart = dc.lineChart(location);

    margins = typeof margins !== 'undefined' ?
        margins : { top: 30, bottom: 60, right: 30, left: 50 };

    chart
        .renderArea(true)
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .interpolate('basis')
        .tension(0.85);

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet);
    }

    return chart;
}

/**
 * Triggers a refresh of the data in the log search table
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 */
function refreshSearchTable(start, end, levels) {
    "use strict";
    var oTable,
        startTs = _toPyTs(start),
        endTs = _toPyTs(end),
        uri = '/intelligence/log/search/data'.concat(
        "?start_time=", startTs,
        "&end_time=", endTs);

    levels = levels || {};
    for (var k in levels) {
        uri = uri.concat("&", k, "=", levels[k]);
    }

    if ($.fn.dataTable.isDataTable("#log-search-table")) {
        oTable = $("#log-search-table").DataTable();
        oTable.ajax.url(uri);
        oTable.ajax.reload();
    }
}


/**
 * Draws a multiline chart in the provided location with x range of start/end.
 * Includes a range chart below it.
 * @param {String} location String representation of a jquery selector
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 */
function badEventMultiLine(location, start, end) {

    var eventGroup = function (dim, level, supressed) {
        return dim.group().reduce(
            function (p, v) {
                if (! supressed) {
                    p[level] += v[level];
                }
                return p;
            },
            function (p, v) {
                if (! supressed) {
                    p[level] -= v[level];
                }
                return p;
            },
            function () {
                var p = {};
                p[level] = 0;
                return p;
            }
        );
    };

    var rangeWidth = $(location).width(),
        maxPoints = rangeWidth / 10,
        clickRenderlet = function (_chart) {
            _chart.selectAll("circle.dot")
                .on("click", function (d) {
                    // load the log search page with chart and table set
                    // to this range.  Params is being accessed through closure
                    var interval = Number(params.interval.slice(0, -1));
                    var start = (new Date(d.data.key)).addSeconds(-1 * interval),
                        end = (new Date(d.data.key)).addSeconds(interval),
                        uri = '/intelligence/search?start_time='
                            .concat(String(Math.round(start.getTime() / 1000)),
                                "&end_time=", String(Math.round(end.getTime() / 1000)));

                    window.location.assign(uri);

                });
        },
        levelHidingRenderlet = function (_chart) {
            // if the search table is present in the page, look up the hidden
            // status of all levels and redraw the page
            if ($('#log-search-table').length > 0) {
                _chart.selectAll("g.dc-legend-item *")
                    .on("click", function (d) {
                        var levelFilter = {};
                        // looks like we take the opposite value of hidden for
                        // the element that was clicked, and the current value
                        // for others
                        levelFilter[d.name.toLowerCase()] = d.hidden;

                        var rects = _chart.selectAll("g.dc-legend-item rect");
                        if (rects.length > 0) {
                            // we have an array of elements in [0]
                            rects = rects[0];
                            rects.forEach(function (r) {
                                if (r.__data__.name !== d.name) {
                                    levelFilter[r.__data__.name.toLowerCase()] = !r.__data__.hidden;
                                }
                            });
                        }
                        refreshSearchTable(start, end, levelFilter);
                    });
            }
        },
        chart = _lineChartBase(location,
            { top: 30, bottom: 30, right: 30, left: 50 },
            clickRenderlet
        ),
        rangeChart = _lineChartBase("#bad-event-range",
            { top: 0, bottom: 30, right: 30, left: 50 }),
        loadingIndicator = "#log-multiline-loading-indicator",
        params = _processTimeBasedChartParams(end, start, maxPoints),
        uri = "/intelligence/log/cockpit/data?start_time="
            .concat(String(Math.round(params.start.getTime() / 1000)),
                "&end_time=", String(Math.round(params.end.getTime() / 1000)),
                "&interval=", params.interval);

    $(loadingIndicator).show();

    d3.json(uri, function (error, events) {
        if (events.data.length > 0) {
            events.data.forEach(function (d) {
                d.time = moment(d.time);
                d.total = 0;
                events.levels.forEach(function (level) {
                    d[level] = +d[level] || 0;
                    d.total += d[level];
                });
            });


            var xf = crossfilter(events.data);
            var timeDim = xf.dimension(function (d) {
                return d.time;
            });
            var minDate = timeDim.bottom(1)[0].time;
            var maxDate = timeDim.top(1)[0].time;
            var errorGroup = eventGroup(timeDim, 'error', false);
            var warnGroup = eventGroup(timeDim, 'warning', false);
            var infoGroup = eventGroup(timeDim, 'info', false);
            var auditGroup = eventGroup(timeDim, 'audit', false);
            var debugGroup = eventGroup(timeDim, 'debug', false);
            var totalGroup = eventGroup(timeDim, 'total', false);

            rangeChart
                .width(rangeWidth)
                .height(100)
                .dimension(timeDim)
                .group(totalGroup)
                .valueAccessor(function (d) {
                    return d.value.total;
                })
                .mouseZoomable(true)
                .brushOn(true)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .ordinalColors(["#d9d9d9"])
                .title(function (d) {
                    return d.key + "\n" + d.value.total + " total events";
                })
                .yAxisLabel("Range")
                .yAxis().ticks(2);



            rangeChart.render();

            chart
                .rangeChart(rangeChart)
                .height(300)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .brushOn(false)
                .mouseZoomable(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(debugGroup, "Debug").valueAccessor(function (d) {
                    return d.value.debug;
                })
                .stack(auditGroup, "Audit", function (d) {
                    return d.value.audit;
                })
                .stack(infoGroup, "Info", function (d) {
                    return d.value.info;
                })
                .stack(warnGroup, "Warning", function (d) {
                    return d.value.warning;
                })
                .stack(errorGroup, "Error", function (d) {
                    return d.value.error;
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                // spectral blue/red
                // ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"]
                //.ordinalColors(["#313695", "#74add1", "#e0f3f8", "#fee090", "#f46d43"])
                // spectral blue/yellow/red
                .ordinalColors(colorArray.distinct[5])
                // the distinct colors used here are listed immediately below:
                // .ordinalColors(["#332288", "#88CCEE", "#117733", "#DDCC77", "#CC6677"])
                // this was the original color set below:
                // .ordinalColors(["#6a51a3", "#2171b5", "#238b45", "#d94801", "#cb181d"])
                // blue purple
                //.ordinalColors(["#edf8fb", "#bfd3e6", "#9ebcda", "#8c96c6", "#8856a7", "#810f7c"])
                // red purple
                //.ordinalColors(["#f1eef6","#d4b9da","#c994c7","#df65b0","#dd1c77","#980043"])
                // flat
                //.ordinalColors(["#334d5c", "#45b29d","#efc94c","#e27a3f","#df5a49"])
                //flat2
                //.ordinalColors(["#553657", "#334d5c", "#45b29d","#efc94c","#df5a49"])
                .title(function (d) {
                    var eventKey = Object.keys(d.value)[0];
                    return d.key.format() + "\n" +
                    d.value[eventKey] + " " + eventKey + " events";
                })
                .yAxisLabel("Log Events")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))
                .renderlet(function (_chart) {
                    // smooth the rendering through event throttling
                    dc.events.trigger(function () {
                        // focus some other chart to the range selected by user on this chart
                        if (_chart.filter() !== null) {
                            refocusCockpitSecondaryCharts(_chart.filter());
                        }
                    });
                })
                .renderlet(levelHidingRenderlet);

            chart.render();
        } else {
            goldstone.raiseInfo("no data found");
        }
        $(loadingIndicator).hide();

    });

}

function _chartCrossFilterSetup(params, chartConstants) {

    // times are divided by 1000 to be a more friendly to the backend
    var uri = chartConstants.uriBase.concat(
        "?start_time=",
        String(Math.round(params.start.getTime() / 1000)),
        "&end_time=",
        String(Math.round(params.end.getTime() / 1000)),
        "&interval=",
        params.interval
    );

    var jsonProcessingFunction = function (d) {
        d.time = new Date(d.time);
        d[chartConstants.totalPhysField] = +d[chartConstants.totalPhysField];
        d[chartConstants.totalVirtField] = +d[chartConstants.totalVirtField];
        d[chartConstants.usedField] = +d[chartConstants.usedField];
    };

    var reduceEnterFunction = function (p, v) {
        p[chartConstants.totalPhysField] += v[chartConstants.totalPhysField];
        p[chartConstants.totalVirtField] += v[chartConstants.totalVirtField];
        p[chartConstants.usedField] += v[chartConstants.usedField];
        return p;
    };

    reduceExitFunction = function (p, v) {
        p[chartConstants.totalPhysField] -= v[chartConstants.totalPhysField];
        p[chartConstants.totalVirtField] -= v[chartConstants.totalVirtField];
        p[chartConstants.usedField] -= v[chartConstants.usedField];
        return p;
    };

    reduceInitFunction = function () {
        var obj = {};
        obj[chartConstants.totalPhysField] = 0;
        obj[chartConstants.totalVirtField] = 0;
        obj[chartConstants.usedField] = 0;
        return obj;
    };

    return {
        uri: uri,
        jsonFunction: jsonProcessingFunction,
        enterFunction: reduceEnterFunction,
        exitFunction: reduceExitFunction,
        initFunction: reduceInitFunction
    };
}

function _customizeChart(_chart, xf, cfSetup, chartConstants, xUnitsInterval) {

    var timeDim = xf.dimension(function (d) {
        return d.time;
    });
    var minDate = timeDim.bottom(1)[0].time;
    var maxDate = timeDim.top(1)[0].time;
    var eventsByTime = timeDim.group().reduce(
        cfSetup.enterFunction,
        cfSetup.exitFunction,
        cfSetup.initFunction
    );

    _chart
        .dimension(timeDim)
        .group(eventsByTime, "Used")
        .valueAccessor(function (d) {
            return d.value[chartConstants.usedField];
        })
        .stack(eventsByTime, "Physical", function (d) {
            return (d.value[chartConstants.totalPhysField] - d.value[chartConstants.usedField]);
        })
        .x(d3.time.scale().domain([minDate, maxDate]))
        .ordinalColors(["#6a51a3", "#2171b5", "#d94801"])
        .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))
        .title(function (d) {
            return d.key +
            "\n\n" + d.value[chartConstants.totalPhysField] + " Total Physical" +
            "\n\n" + d.value[chartConstants.usedField] + " Used";
        })
        .yAxisLabel(chartConstants.resourceLabel)
        .xAxis().ticks(5);

    // the disk chart does not have a virtual field
    if (typeof chartConstants.totalVirtField !== 'undefined') {
        _chart
            .stack(eventsByTime, "Virtual", function (d) {
                return (d.value[chartConstants.totalVirtField] - d.value[chartConstants.totalPhysField]);
            })
            .title(function (d) {
                return d.key +
                "\n\n" + d.value[chartConstants.totalPhysField] + " Total Physical" +
                "\n\n" + d.value[chartConstants.totalVirtField] + " Total Virtual" +
                "\n\n" + d.value[chartConstants.usedField] + " Used";
            });
    }

    return _chart;
}

function _renderResourceChart(location, start, end, chartConstants) {
    "use strict";
    $(chartConstants.loadingIndicator).show();
    var maxPoints = ($(location).width()) / 10;
    var params = _processTimeBasedChartParams(end, start, maxPoints);
    var chart = _lineChartBase(location);
    var cfSetup = _chartCrossFilterSetup(params, chartConstants);

    d3.json(cfSetup.uri, function (error, events) {
        events.forEach(cfSetup.jsonFunction);
        var xf = crossfilter(events);
        chart = _customizeChart(chart, xf, cfSetup, chartConstants, params.interval);
        secondaryCockpitCharts[location.slice(1)] = chart;
        chart.render();
        $(chartConstants.loadingIndicator).hide();
    });
}

function physCpuChart(location, start, end) {

    var chartConstants = {
        uriBase: "/intelligence/compute/cpu_stats",
        totalPhysField : "phys_cpu_avg_total",
        totalVirtField : "virt_cpu_avg_total",
        usedField : "virt_cpu_max_used",
        resourceLabel: "Cores",
        loadingIndicator: "#phys-cpu-loading-indicator"
    };

    _renderResourceChart(location, start, end, chartConstants);
}

function physMemChart(location, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/mem_stats",
            totalPhysField: "phys_mem_avg_total",
            totalVirtField: "virt_mem_avg_total",
            usedField: "virt_mem_max_used",
            resourceLabel: "GB",
            loadingIndicator: "#phys-mem-loading-indicator"
        };

    _renderResourceChart(location, start, end, chartConstants);

}

function physDiskChart(location, start, end) {

    var chartConstants = {
        uriBase: "/intelligence/compute/disk_stats",
        totalPhysField: "phys_disk_avg_total",
        usedField: "phys_disk_max_used",
        resourceLabel: "GB",
        loadingIndicator: "#phys-disk-loading-indicator"
    };

    _renderResourceChart(location, start, end, chartConstants);

}

function drawSearchTable(location, start, end) {
    $("#log-table-loading-indicator").show();

    end = typeof end !== 'undefined' ?
        new Date(Number(end)) :
        new Date();

    if (typeof start !== 'undefined') {
        start = new Date(Number(start));
    } else {
        start = new Date(Number(start));
        start.addWeeks(-1);
    }

    var oTable,
        uri = '/intelligence/log/search/data'.concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)));

    if ($.fn.dataTable.isDataTable(location)) {
        oTable = $(location).DataTable();
        oTable.ajax.url(uri);
        oTable.ajax.reload();
    } else {
        var oTableParams = {
            "info": false,
            "autoWidth": true,
            "processing": true,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "ordering": true,
            "serverSide": true,
            "ajax": uri,
            "columnDefs": [
                { "visible": false, "targets": [ 5, 6, 7, 8, 9, 10 ] },
                { "name": "timestamp", "type": "date", "targets": 0,
                  "render": function (data, type, full, meta) {
                        return moment(data).format();
                    }
                },
                { "name": "loglevel", "targets": 1 },
                { "name": "component", "targets": 2 },
                { "name": "host", "targets": 3 },
                { "name": "message", "targets": 4 },
                { "name": "location", "targets": 5 },
                { "name": "pid", "targets": 6 },
                { "name": "source", "targets": 7 },
                { "name": "request_id", "targets": 8 },
                { "name": "type", "targets": 9 },
                { "name": "received", "type": "date", "targets": 10 }
            ]
        };

        oTable = $(location).DataTable(oTableParams);

        $(window).bind('resize', function () {
            oTable.fnAdjustColumnSizing();
        });
    }
    $("#log-table-loading-indicator").hide();
}

/*
 function updateWindow(){

 var panelWidth = $("#row3-full").width();
 var panelHeight = 300;
 var margin = {top: 30, right: 30, bottom: 30, left: 80},
 width = panelWidth - margin.left - margin.right,
 height = panelHeight - margin.top - margin.bottom;


 x = d3.time.scale().range([0, width]);
 x.domain(d3.extent(data, function(d) { return d.date; }));
 xAxis = d3.svg.axis().scale(x)
 .orient("bottom").ticks(5);

 svg.attr("width", panelWidth)
 .attr("height", panelHeight);
 svg.select(".x.axis")
 .call(xAxis);
 svg.select(".line")
 .attr("d", valueLine(data));

 }

 window.onresize = updateWindow;

 */
