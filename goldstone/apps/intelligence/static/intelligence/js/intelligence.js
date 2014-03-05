Date.prototype.addSeconds = function (m) {
    this.setTime(this.getTime() + (m * 1000));
    return this;
}

Date.prototype.addMinutes = function (m) {
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
}

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

Date.prototype.addDays = function (d) {
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
    return this;
}

Date.prototype.addWeeks = function (d) {
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000));
    return this;
}

$('#settingsStartTime').datetimepicker({
    format: 'M d Y H:i:s',
    lang: 'en'
})

$('#settingsEndTime').datetimepicker({
    format: 'M d Y H:i:s',
    lang: 'en'
})

var secondaryCockpitCharts = {}

function refreshHostPresence(lookbackQty, lookbackUnit, start, end) {
    hostPresenceTable('#host-presence-table', lookbackQty, lookbackUnit, start, end)
}

function refreshCockpitCharts(start, end) {
    "use strict";
    refreshCockpitEventCharts(start, end)
    refreshCockpitSecondaryCharts(start, end)
    dc.filterAll()
    //dc.refocusAll()
}

function refreshCockpitEventCharts(start, end) {
    "use strict";
    badEventMultiLine('#bad-event-multiline', start, end)
}

function refreshCockpitSecondaryCharts(start, end) {
    "use strict";
    physCpuChart("#phys-cpu-chart", start, end)
    virtCpuChart("#virt-cpu-chart", start, end)
    physMemChart("#phys-mem-chart", start, end)
    virtMemChart("#virt-mem-chart", start, end)
    physDiskChart("#phys-disk-chart", start, end)
    var presenceUnit = $("select#hostPresenceUnit").val(),
        presenceQty = $("input#hostPresenceQty").val()
        presenceQty = typeof presenceQty === 'undefined' ? 1 : presenceQty
    refreshHostPresence(presenceQty, presenceUnit, start, end)
}

function refocusCockpitSecondaryCharts(filter) {
    "use strict";
    var keys = Object.keys(secondaryCockpitCharts)

    keys.forEach(function (key) {
        secondaryCockpitCharts[key].focus(filter)
    })
}

function _getSearchFormDates() {
    "use strict";
    //grab the values from the form elements
    var end = (function () {
            var e = $("input#settingsEndTime").val()
            switch (e) {
                case '':
                    return new Date()
                default:
                    var d = new Date(e)
                    if (d === 'Invalid Date') {
                        alert("End date must be valid. Using now.")
                        d = new Date()
                    }
                    return d
            }
        })(),
        start = (function () {
            var s = $("input#settingsStartTime").val()
            switch (s) {
                case '':
                    return (new Date(end)).addWeeks(-1)
                default:
                    var d = new Date(s)
                    if (d === 'Invalid Date') {
                        alert("Start date must be valid. Using 1 week1 " +
                            "prior to end date.")
                        d = (new Date(end)).addWeeks(-1)
                    }
                    return d
            }
        })()

    return [start, end]
}

/**
 * Returns an appropriately sized interval to retrieve a max number
 * of points/bars on the chart
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 * @param {Number} maxBuckets maximum number of buckets for the time range
 * @return {String} A string consisting of a number and a time abbreviation
 * (ex: 1h or 12.5s)
 */
function _autoSizeTimeInterval(start, end, maxPoints) {
    "use strict";
    var diffSeconds = (end.getTime() - start.getTime()) / 1000,
        intervalSecs = diffSeconds / maxPoints,
        result = String(intervalSecs) + "s"
    return result
}

/**
 * Returns a Date object if given a Date or a numeric string
 * @param {[Date, String]} the date representation
 * @return {Date} the date representation of the string
 */
function _paramToDate(param) {
    "use strict";
    if (param instanceof Date) {
        return param
    } else {
        return new Date(Number(param))
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
            var s = new Date(endDate)
            s.addWeeks(-1)
            return s
        })(),
    result = {
        'start': startDate,
        'end': endDate
    }

    if (typeof maxPoints !== 'undefined') {
        result.interval = _autoSizeTimeInterval(startDate, endDate, maxPoints)
    }

    return result

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
    var panelWidth = $(location).width(),
        chart = dc.barChart(location)

    margins = typeof margins !== 'undefined' ?
            margins : { top: 50, bottom: 60, right: 30, left: 40 },

    chart
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .centerBar(true)
        .elasticY(true)
        .brushOn(false)
        .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5))

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet)
    }

    return chart
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
    var panelWidth = $(location).width(),
        chart = dc.lineChart(location)

    margins = typeof margins !== 'undefined' ?
            margins : { top: 50, bottom: 60, right: 30, left: 40 }

    chart
        .renderArea(true)
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .renderHorizontalGridLines(true)
        .brushOn(false)

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet)
    }

    return chart
}

/**
 * Triggers a refresh of the data in the log search table
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 */
function refreshSearchTable(start, end, levels) {
    "use strict";
    var oTable,
        toPyTs = function (t) {
        switch (typeof t) {
            case 'number':
                return String(Math.round(t / 1000))
            case 'Date':
                return String(Math.round(t.getTime() / 1000))

        }},
        startTs = toPyTs(start),
        endTs = toPyTs(end),
        uri = '/intelligence/log/search/data'.concat(
        "?start_time=", startTs,
        "&end_time=", endTs)

    levels = levels || {}
    for (var k in levels) {
        uri = uri.concat("&", k, "=", levels[k])
    }

    if ($.fn.dataTable.isDataTable("#log-search-table")) {
        oTable = $("#log-search-table").dataTable();
        oTable.fnReloadAjax(uri);
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
                        p[level] += v[level]
                    }
                    return p
                },
            function (p, v) {
                    if (! supressed) {
                        p[level] -= v[level]
                    }
                    return p
                },
            function () {
                var p = {}
                p[level] = 0
                return p
            }
        )
    }

    var rangeWidth = $(location).width(),
        maxPoints = rangeWidth / 10,
        clickRenderlet = function (_chart) {
            _chart.selectAll("circle.dot")
                .on("click", function (d) {
                    // load the log search page with chart and table set
                    // to this range.  Params is being accessed through closure
                    var interval = Number(params.interval.slice(0, -1))
                    var start = (new Date(d.data.key)).addSeconds(-1 * interval),
                        end = (new Date(d.data.key)).addSeconds(interval),
                        uri = '/intelligence/search?start_time='
                            .concat(String(Math.round(start.getTime() / 1000)),
                                "&end_time=", String(Math.round(end.getTime() / 1000)))

                    window.location.assign(uri)

                })
        },
        levelHidingRenderlet = function (_chart) {
            // if the search table is present in the page, look up the hidden
            // status of all levels and redraw the page
            if ($('#log-search-table').length > 0) {

            _chart.selectAll("g.dc-legend-item *")
                .on("click", function (d) {
                    var levelFilter = {}
                    // looks like we take the opposite value of hidden for
                    // the element that was clicked, and the current value
                    // for others
                    levelFilter[d.name.toLowerCase()] = d.hidden

                    var rects = _chart.selectAll("g.dc-legend-item rect")
                    if (rects.length > 0) {
                        // we have an array of elements in [0]
                        rects = rects[0]
                        rects.forEach(function (r) {
                            if (r.__data__.name !== d.name) {
                                levelFilter[r.__data__.name.toLowerCase()] = !r.__data__.hidden
                            }
                        })
                    }
                    refreshSearchTable(start, end, levelFilter)
                })
            }
        },
        chart = _lineChartBase(location,
            { top: 50, bottom: 30, right: 30, left: 60 },
            clickRenderlet
        ),
        rangeChart = _lineChartBase("#bad-event-range",
            { top: 0, bottom: 50, right: 30, left: 60 }),
        loadingIndicator = "#log-multiline-loading-indicator",
        params = _processTimeBasedChartParams(end, start, maxPoints),
        uri = "/intelligence/log/cockpit/data?start_time="
            .concat(String(Math.round(params.start.getTime() / 1000)),
                "&end_time=", String(Math.round(params.end.getTime() / 1000)),
                "&interval=", params.interval)

    $(loadingIndicator).show()

    d3.json(uri, function (error, events) {
        if (events.data.length > 0) {
            events.data.forEach(function (d) {
                d.time = new Date(d.time)
                d.total = 0
                events.levels.forEach(function (level) {
                    d[level] = +d[level] || 0
                    d.total += d[level]
                })
            })


            var xf = crossfilter(events.data),
                timeDim = xf.dimension(function (d) {
                    return d.time
                }),
                minDate = timeDim.bottom(1)[0].time,
                maxDate = timeDim.top(1)[0].time,
                errorGroup = eventGroup(timeDim, 'error', false),
                warnGroup = eventGroup(timeDim, 'warning', false),
                infoGroup = eventGroup(timeDim, 'info', false),
                auditGroup = eventGroup(timeDim, 'audit', false),
                debugGroup = eventGroup(timeDim, 'debug', false),
                totalGroup = eventGroup(timeDim, 'total', false)

            rangeChart
                .width(rangeWidth)
                .height(100)
                .dimension(timeDim)
                .group(totalGroup)
                .valueAccessor(function (d) {
                    return d.value.total
                })
                .mouseZoomable(true)
                .brushOn(true)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + "\n" + d.value.total + " total events"
                })
                .yAxis().ticks(2)



            rangeChart.render()

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
                    return d.value.debug
                })
                .stack(auditGroup, "Audit", function (d) {
                    return d.value.audit
                })
                .stack(infoGroup, "Info", function (d) {
                    return d.value.info
                })
                .stack(warnGroup, "Warning", function (d) {
                    return d.value.warning
                })
                .stack(errorGroup, "Error", function (d) {
                    return d.value.error
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    var eventKey = Object.keys(d.value)[0]
                    return d.key
                        + "\n" + d.value[eventKey] + " " + eventKey + " events"
                })
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))
                //.on("filtered", function (_chart, filter) {
                //    refocusCockpitSecondaryCharts(chart.filter())
                //})
                .renderlet(function (_chart) {
                    // smooth the rendering through event throttling
                    dc.events.trigger(function () {
                        // focus some other chart to the range selected by user on this chart
                        if (_chart.filter() !== null) {
                            console.log("filter[0] = " + _chart.filter()[0] + ", filter[1] = " + _chart.filter()[1])
                            refocusCockpitSecondaryCharts(_chart.filter())
                        } else {
                            console.log("received null filter")
                        }
                    })
                })
                .renderlet(levelHidingRenderlet)


            chart.render()
        } else {
            raiseInfo("no data found")
        }
        $(loadingIndicator).hide()

    })

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
        ),
        jsonProcessingFunction = function (d) {
            d.time = new Date(d.time)
            d[chartConstants.totalField] = +d[chartConstants.totalField]
            d[chartConstants.usedField] = +d[chartConstants.usedField]
        },
        reduceEnterFunction = function (p, v) {
            p[chartConstants.totalField] += v[chartConstants.totalField]
            p[chartConstants.usedField] += v[chartConstants.usedField]
            return p
        },
        reduceExitFunction = function (p, v) {
            p[chartConstants.totalField] -= v[chartConstants.totalField]
            p[chartConstants.usedField] -= v[chartConstants.usedField]
            return p
        },
        reduceInitFunction = function () {
            var obj = {}
            obj[chartConstants.totalField] = 0
            obj[chartConstants.usedField] = 0
            return obj
        }

    return {
        uri: uri,
        jsonFunction: jsonProcessingFunction,
        enterFunction: reduceEnterFunction,
        exitFunction: reduceExitFunction,
        initFunction: reduceInitFunction
    }
}

function _customizeChart(_chart, xf, cfSetup, chartConstants,
                         xUnitsInterval) {

    var timeDim = xf.dimension(function (d) {
            return d.time;
        }),
        minDate = timeDim.bottom(1)[0].time,
        maxDate = timeDim.top(1)[0].time,
        eventsByTime = timeDim.group().reduce(
            cfSetup.enterFunction,
            cfSetup.exitFunction,
            cfSetup.initFunction
        )

    _chart
            .dimension(timeDim)
            .group(eventsByTime, "Avg. Used " + chartConstants.resourceLabel)
            .valueAccessor(function (d) {
                return d.value[chartConstants.usedField]
            })
            .stack(eventsByTime, "Avg. Free "  + chartConstants.resourceLabel, function (d) {
                return (d.value[chartConstants.totalField] - d.value[chartConstants.usedField])
            })
            .x(d3.time.scale().domain([minDate, maxDate]))
            .title(function (d) {
                return d.key +
                    "\n\n" + (d.value[chartConstants.totalField] - d.value[chartConstants.usedField]) + " Free" +
                    "\n\n" + d.value[chartConstants.usedField] + " Used"
            })

    return _chart
}

function _renderResourceChart(location, start, end,
                              chartConstants) {
    "use strict";
    $(chartConstants.loadingIndicator).show()
    var maxPoints = ($(location).width()) / 10,
        params = _processTimeBasedChartParams(end, start, maxPoints),
        chart = _lineChartBase(location),
        cfSetup = _chartCrossFilterSetup(params, chartConstants)

    d3.json(cfSetup.uri, function (error, events) {
        events.forEach(cfSetup.jsonFunction)
        var xf = crossfilter(events)
        chart = _customizeChart(chart, xf, cfSetup, chartConstants,
            params.interval)
        secondaryCockpitCharts[location.slice(1)] = chart
        chart.render()
        $(chartConstants.loadingIndicator).hide()
    })
}

function physCpuChart(location, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/cpu_stats",
            totalField : "phys_cpu_avg_total",
            usedField : "phys_cpu_avg_used",
            resourceLabel: "CPU Cores",
            loadingIndicator: "#phys-cpu-loading-indicator"
        }

    _renderResourceChart(location, start, end, chartConstants)
}

function virtCpuChart(location, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/cpu_stats",
            totalField : "virt_cpu_avg_total",
            usedField : "virt_cpu_avg_used",
            resourceLabel: "CPU Cores",
            loadingIndicator: "#virt-cpu-loading-indicator"
        }

    _renderResourceChart(location, start, end, chartConstants)
}

function physMemChart(location, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/mem_stats",
            totalField: "phys_mem_avg_total",
            usedField: "phys_mem_avg_used",
            resourceLabel: "Memory",
            loadingIndicator: "#phys-mem-loading-indicator"
        }

    _renderResourceChart(location, start, end, chartConstants)

}

function virtMemChart(location, start, end) {
    var chartConstants = {
            uriBase: "/intelligence/compute/mem_stats",
            totalField: "virt_mem_avg_total",
            usedField: "virt_mem_avg_used",
            resourceLabel: "Memory",
            loadingIndicator: "#virt-mem-loading-indicator"
        }

    _renderResourceChart(location, start, end, chartConstants)
}


function physDiskChart(location, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/disk_stats",
            totalField: "phys_disk_avg_total",
            usedField: "phys_disk_avg_used",
            resourceLabel: "Disk",
            loadingIndicator: "#phys-disk-loading-indicator"
        }

    _renderResourceChart(location, start, end, chartConstants)

}

function drawSearchTable(location, start, end) {
    $("#log-table-loading-indicator").show();


    end = typeof end !== 'undefined' ?
        new Date(Number(end) * 1000) :
        new Date();

    if (typeof start !== 'undefined') {
        start = new Date(Number(start) * 1000)
    } else {
        start = new Date(Number(start) * 1000)
        start.addWeeks(-1)
    }

    var oTable,
        uri = '/intelligence/log/search/data'.concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)))

    if ($.fn.dataTable.isDataTable(location)) {
        oTable = $(location).dataTable()
        oTable.fnReloadAjax(uri)
    } else {
        var oTableParams = {
            "fnInitComplete": function () {this.fnSetFilteringDelay(500)},
            "bProcessing": true,
            "bServerSide": true,
            "sAjaxSource": uri,
            "bPaginate": true,
            "bFilter": true,
            "bSort": true,
            "bInfo": false,
            "bAutoWidth": true,
            "bLengthChange": true,
            "aoColumnDefs": [
                { "bVisible": false, "aTargets": [ 5, 6, 7, 8, 9, 10 ] },
                { "sName": "timestamp", "aTargets": [ 0 ] },
                { "sType": "date", "aTargets": [0] },
                { "sName": "loglevel", "aTargets": [ 1 ] },
                { "sName": "component", "aTargets": [ 2 ] },
                { "sName": "host", "aTargets": [ 3 ] },
                { "sName": "message", "aTargets": [ 4 ] },
                { "sName": "location", "aTargets": [ 5 ] },
                { "sName": "pid", "aTargets": [ 6 ] },
                { "sName": "source", "aTargets": [ 7 ] },
                { "sName": "request_id", "aTargets": [ 8 ] },
                { "sName": "type", "aTargets": [ 9 ] },
                { "sName": "received", "aTargets": [ 10 ] },
                { "sType": "date", "aTargets": [10] }
            ],
        }

        oTable = $(location).dataTable(oTableParams)


        $(window).bind('resize', function () {
            oTable.fnAdjustColumnSizing();
        });
    }
    $("#log-table-loading-indicator").hide();
}

function hostPresenceTable(location, lookbackQty, lookbackUnit,
                                  start, end) {
    "use strict";
    var params = _processTimeBasedChartParams(end, start);

    lookbackQty = typeof lookbackQty !== 'undefined' ?
        lookbackQty :
        1;

    var inspectStart = (function () {
        var d = new Date(params.end);
        if (lookbackUnit === 'm') {
            d.addMinutes(-1 * lookbackQty);
            return d;
        } else if (lookbackUnit === 'd') {
            d.addDays(-1 * lookbackQty);
            return d;
        } else if (lookbackUnit === 'w') {
            d.addWeeks(-1 * lookbackQty);
            return d;
        } else {
            d.addHours(-1 * lookbackQty);
            return d;
        }
    })();

    var uri = '/intelligence/host_presence_stats'.concat(
        '?domainStart=', String(Math.round(params.start.getTime() / 1000)),
        '&inspectStart=', String(Math.round(inspectStart.getTime() / 1000)),
        '&domainEnd=', String(Math.round(params.end.getTime() / 1000)));

    if ($.fn.dataTable.isDataTable(location)) {
        oTable = $(location).dataTable();
        oTable.fnReloadAjax(uri);
    } else {
        var oTableParams = {
            "bProcessing": true,
            "bServerSide": true,
            "sAjaxSource": uri,
            "bPaginate": false,
            "sScrollY": "250px",
            "bFilter": false,
            "bSort": false,
            "bInfo": false,
            "bAutoWidth": true,
            "bLengthChange": true,
            "aoColumnDefs": [
                { "sName": "host", "aTargets": [ 0 ] },
                { "sName": "status", "aTargets": [ 1 ] }
                /* TODO GOLD-241 add support for time last seen to JS
                ,
                { "bVisible": false, "aTargets": [ 2 ] },
                { "sName": "lastSeen", "aTargets": [ 2 ] },
                { "sType": "date", "aTargets": [2] }
                */
            ]
        }

        var oTable = $(location).dataTable(oTableParams)

        $(window).bind('resize', function () {
            oTable.fnAdjustColumnSizing()
        });
    }
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

 console.log("adjusted width = " + panelWidth);
 console.log("adjusted height = " + panelHeight);
 svg.attr("width", panelWidth)
 .attr("height", panelHeight);
 svg.select(".x.axis")
 .call(xAxis);
 svg.select(".line")
 .attr("d", valueLine(data));

 }

 window.onresize = updateWindow;

 */