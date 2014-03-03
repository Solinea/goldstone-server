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

function _getSearchFormDates() {
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

var _timeIntervalMapping = {
/* validate the time interval.  Should be {posint}{s,m,h,d,w} */

        '1s': d3.time.seconds,
        '1m': d3.time.minutes,
        '1h': d3.time.hours,
        '1d': d3.time.days,
        '1w': d3.time.weeks
};

function _timeIntervalValid(intervalStr) {
    return (intervalStr in _timeIntervalMapping);
}

function _timeIntervalFromStr(intervalStr) {

    if (_timeIntervalValid(intervalStr)) {
        return _timeIntervalMapping[intervalStr];
    } else {
        return d3.time.hours;
    }
}

function _paramToDate(param) {
    if (param instanceof Date) {
        return param
    } else {
        return new Date(Number(param))
    }
}

function _processTimeBasedChartParams(interval, start, end) {
    interval = typeof interval !== 'undefined' ?
        function () {
            if (_timeIntervalValid(interval)) {
                return interval;
            } else {
                return '1h'
            }
        }() : '1h';

    end = typeof end !== 'undefined' ?
        _paramToDate(end) :
        new Date();

    start = typeof start !== 'undefined' ?
        _paramToDate(start) :
        (function () {
            var s = new Date(end)
            s.addWeeks(-1)
            return s
        })()

    return {'interval': interval,
            'start': start,
            'end': end
    };
}

function _barChartBase(location, margins, renderlet) {
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

function _lineChartBase(location, margins, renderlet) {
    var panelWidth = $(location).width(),
        chart = dc.lineChart(location)

    margins = typeof margins !== 'undefined' ?
            margins : { top: 50, bottom: 60, right: 30, left: 40 }

    chart
        .renderArea(true)
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5))

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet)
    }

    return chart
}


// TODO be sure to remove this.  it's only for testing...
var badEventHistChart;

function refreshSearchTable(start, end) {
    console.log("zoomed range chart")
    console.log("filter[0] time = " + start.getTime())
    var oTable,
        uri = '/intelligence/log/search/data'.concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)))

    if ($.fn.dataTable.isDataTable("#log-search-table")) {
        oTable = $("#log-search-table").dataTable();
        oTable.fnReloadAjax(uri);
    }
}

function badEventMultiLine(location, interval, start, end) {
    var rangeWidth = $(location).width()
    var chart = _lineChartBase(location),
        rangeChart = dc.barChart("#bad-event-range"),
        loadingIndicator = "#log-multiline-loading-indicator",
        params = _processTimeBasedChartParams(interval, start, end),
        uri = "/intelligence/log/cockpit/data?start_time="
            .concat(String(Math.round(params.start.getTime() / 1000)),
                "&end_time=", String(Math.round(params.end.getTime() / 1000)),
                "&interval=", params.interval)

    d3.json(uri, function (error, events) {
        events.data.forEach(function (d) {
            d.time = new Date(d.time)
            d.fatal = +d.fatal
            d.warning = +d.warning
            d.error = +d.error
            d.total = d.fatal + d.warning + d.error
        })


        var xf = crossfilter(events.data),
            timeDim = xf.dimension(function (d) {
                return d.time
            }),
            minDate = timeDim.bottom(1)[0].time,
            maxDate = timeDim.top(1)[0].time,
            eventsByTime = timeDim.group().reduce(
                function (p, v) {
                    p.errorEvents += v.error
                    p.warnEvents += v.warning
                    p.fatalEvents += v.fatal
                    p.totalEvents += v.total
                    return p;
                },
                function (p, v) {
                    p.errorEvents -= v.error
                    p.warnEvents -= v.warning
                    p.fatalEvents -= v.fatal
                    p.totalEvents -= v.total
                    return p
                },
                function () {
                    return {
                        errorEvents: 0,
                        warnEvents: 0,
                        fatalEvents: 0,
                        totalEvents: 0
                    }
                }
            )

        rangeChart
            .width(rangeWidth)
            .height(100)
            .margins({ top: 0, bottom: 60, right: 30, left: 40 })
            .dimension(timeDim)
            .group(eventsByTime)
            .valueAccessor(function (d) {
                return d.value.totalEvents
            })
            .mouseZoomable(true)
            .brushOn(true)
            .centerBar(true)
            .gap(1)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .xUnits(_timeIntervalFromStr(params.interval))
            .yAxis().ticks(1)


        rangeChart.render()

        chart
            .rangeChart(rangeChart)
            .elasticY(true)
            .renderHorizontalGridLines(true)
            .brushOn(false)
            .mouseZoomable(true)
            .dimension(timeDim)
            .group(eventsByTime, "Warning Events")
            .valueAccessor(function (d) {
                return d.value.warnEvents;
            })
            .stack(eventsByTime, "Error Events", function (d) {
                return d.value.errorEvents;
            })
            //.stack(eventsByTime, "Fatal Events", function (d) {
            //    return d.value.fatalEvents;
            //})
            .x(d3.time.scale().domain([minDate, maxDate]))
            .xUnits(_timeIntervalFromStr(params.interval))
            .title(function (d) {
                return d.key
                    //+ "\n\n" + d.value.fatalEvents + " FATALS"
                    + "\n\n" + d.value.errorEvents + " ERRORS"
                    + "\n\n" + d.value.warnEvents + " WARNINGS";
            })
            .on("filtered", function (_chart, filter) {
                refreshSearchTable(filter[0], filter[1])
            });

        chart.renderlet(function (chart) {
            // smooth the rendering through event throttling
            dc.events.trigger(function () {
                // focus some other chart to the range selected by user on this chart
                badEventHistChart.focus(chart.filter())
            })
        })

        chart.render()
        $(loadingIndicator).hide()
    })

}

function badEventHistogramPanel(location, interval, start, end) {

    var loadingIndicator = "#log-loading-indicator",
        params = _processTimeBasedChartParams(interval, start, end),
        margins = {top: 70, right: 30, bottom: 60, left: 40},
        uri = "/intelligence/log/cockpit/data?start_time="
            .concat(String(Math.round(params.start.getTime() / 1000)),
                "&end_time=", String(Math.round(params.end.getTime() / 1000)),
                "&interval=", params.interval),
        clickRenderlet = function (_chart) {
            _chart.selectAll("rect.bar")
                .on("click", function (d) {
                    // load the log search page with chart and table set
                    // to this range.
                    var start = new Date(d.data.key),
                        end = new Date(start),
                        newInterval = '1h'
                    switch (params.interval) {
                        case '1m':
                            end.addMinutes(1)
                            newInterval = '1s'
                            break
                        case '1h':
                            end.addHours(1)
                            newInterval = '1m'
                            break
                        case '1d':
                            end.addDays(1)
                            newInterval = '1h'
                            break
                        case '1w':
                            end.addWeeks(1)
                            newInterval = '1h'
                            break
                        default:
                            newInterval = 'unsupported'
                    }

                    if (newInterval !== 'unsupported') {
                        var uri = '/intelligence/search?start_time='
                            .concat(String(Math.round(start.getTime() / 1000)),
                                "&end_time=", String(Math.round(end.getTime() / 1000)),
                                "&interval=", newInterval)
                        window.location.assign(uri)
                    } else {
                        raiseWarning("Unsupported interval")
                    }
                })
        }

    // TODO be sure to turn this back into a local var after done testing.
    badEventHistChart = _barChartBase(location, margins, clickRenderlet);

    $(loadingIndicator).show()
    d3.json(uri, function (error, events) {
        events.data.forEach(function (d) {
            d.time = new Date(d.time)
            d.fatal = +d.fatal
            d.warning = +d.warning
            d.error = +d.error
        })

        var xf = crossfilter(events.data),
            timeDim = xf.dimension(function (d) {
                return d.time
            }),
            minDate = timeDim.bottom(1)[0].time,
            maxDate = timeDim.top(1)[0].time,
            eventsByTime = timeDim.group().reduce(
                function (p, v) {
                    p.errorEvents += v.error;
                    p.warnEvents += v.warning;
                    p.fatalEvents += v.fatal;
                    return p;
                },
                function (p, v) {
                    p.errorEvents -= v.error;
                    p.warnEvents -= v.warning;
                    p.fatalEvents -= v.fatal;
                    return p;
                },
                function () {
                    return {
                        errorEvents: 0,
                        warnEvents: 0,
                        fatalEvents: 0
                    }
                }
            )

        badEventHistChart
            .dimension(timeDim)
            .group(eventsByTime, "Warning Events")
            .valueAccessor(function (d) {
                return d.value.warnEvents;
            })
            .stack(eventsByTime, "Error Events", function (d) {
                return d.value.errorEvents;
            })
            .stack(eventsByTime, "Fatal Events", function (d) {
                return d.value.fatalEvents;
            })
            .x(d3.time.scale().domain([minDate, maxDate]))
            .xUnits(_timeIntervalFromStr(params.interval))
            .title(function (d) {
                return d.key
                    + "\n\n" + d.value.fatalEvents + " FATALS"
                    + "\n\n" + d.value.errorEvents + " ERRORS"
                    + "\n\n" + d.value.warnEvents + " WARNINGS";
            });

        badEventHistChart.render();
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
            .xUnits(_timeIntervalFromStr(xUnitsInterval))
            .title(function (d) {
                return d.key +
                    "\n\n" + (d.value[chartConstants.totalField] - d.value[chartConstants.usedField]) + " Free" +
                    "\n\n" + d.value[chartConstants.usedField] + " Used"
            })

    return _chart
}

function _renderResourceChart(location, interval, start, end,
                              chartConstants) {
    var params = _processTimeBasedChartParams(interval, start, end),
        chart = _barChartBase(location),
        cfSetup = _chartCrossFilterSetup(params, chartConstants)

    $(chartConstants.loadingIndicator).show()
    d3.json(cfSetup.uri, function (error, events) {
        events.forEach(cfSetup.jsonFunction)
        var xf = crossfilter(events)
        chart = _customizeChart(chart, xf, cfSetup, chartConstants,
            params.interval)
        chart.render()
    })

    $(chartConstants.loadingIndicator).hide()
}

function physCpuChart(location, interval, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/cpu_stats",
            totalField : "phys_cpu_avg_total",
            usedField : "phys_cpu_avg_used",
            resourceLabel: "CPU Cores",
            loadingIndicator: "#phys-cpu-loading-indicator"
        }

    _renderResourceChart(location, interval, start, end, chartConstants)
}

function virtCpuChart(location, interval, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/cpu_stats",
            totalField : "virt_cpu_avg_total",
            usedField : "virt_cpu_avg_used",
            resourceLabel: "CPU Cores",
            loadingIndicator: "#virt-cpu-loading-indicator"
        }

    _renderResourceChart(location, interval, start, end, chartConstants)
}

function physMemChart(location, interval, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/mem_stats",
            totalField: "phys_mem_avg_total",
            usedField: "phys_mem_avg_used",
            resourceLabel: "Memory",
            loadingIndicator: "#phys-mem-loading-indicator"
        }

    _renderResourceChart(location, interval, start, end, chartConstants)

}

function virtMemChart(location, interval, start, end) {
    var chartConstants = {
            uriBase: "/intelligence/compute/mem_stats",
            totalField: "virt_mem_avg_total",
            usedField: "virt_mem_avg_used",
            resourceLabel: "Memory",
            loadingIndicator: "#virt-mem-loading-indicator"
        }

    _renderResourceChart(location, interval, start, end, chartConstants)
}


function physDiskChart(location, interval, start, end) {

    var chartConstants = {
            uriBase: "/intelligence/compute/disk_stats",
            totalField: "phys_disk_avg_total",
            usedField: "phys_disk_avg_used",
            resourceLabel: "Disk",
            loadingIndicator: "#phys-disk-loading-indicator"
        }

    _renderResourceChart(location, interval, start, end, chartConstants)

}

function virtDiskChart(location, interval, start, end) {
    var chartConstants = {
            uriBase: "/intelligence/compute/disk_stats",
            totalField: "virt_disk_avg_total",
            usedField: "virt_disk_avg_used",
            resourceLabel: "Disk",
            loadingIndicator: "#virt-disk-loading-indicator"
        }

    _renderResourceChart(location, interval, start, end, chartConstants)
}

function drawSearchTable(location, interval, start, end) {
    $("#log-table-loading-indicator").show();
    interval = typeof interval !== 'undefined' ?
        interval :
        'month';

    end = typeof end !== 'undefined' ?
        new Date(Number(end) * 1000) :
        new Date();

    if (typeof start === 'undefined') {
        start = new Date(end);

        if (interval === 'month') {
            start.addWeeks(-4);
        } else if (interval === 'day') {
            start.addDays(-1)
        } else if (interval === 'hour') {
            start.addHours(-1);
        } else if (interval === 'minute') {
            start.addMinutes(-1);
        } else {
            start = new Date(Number(start) * 1000);
        }
    } else {
        start = new Date(Number(start) * 1000);
    }

    //TODO rework this url to use params
    var oTable,
        uri = '/intelligence/log/search/data'.concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)))

    if ($.fn.dataTable.isDataTable(location)) {
        oTable = $(location).dataTable();
        oTable.fnReloadAjax(uri);
    } else {
        var oTableParams = {
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
            ]
        }

        oTable = $(location).dataTable(oTableParams);

        $(window).bind('resize', function () {
            oTable.fnAdjustColumnSizing();
        });
    }
    $("#log-table-loading-indicator").hide();
}

function hostPresenceTable(location, lookbackQty, lookbackUnit,
                                  start, end) {
    var params = _processTimeBasedChartParams('', start, end);

    $("#host-presence-table-loading-indicator").show();

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
            "sScrollY": "350px",
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
    $("#host-presence-table-loading-indicator").hide();
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