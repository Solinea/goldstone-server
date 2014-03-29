goldstone.namespace('nova.dom')
goldstone.namespace('nova.discover')
goldstone.namespace('nova.report')
goldstone.namespace('nova.spawns')
goldstone.namespace('nova.spawns.renderlets')
goldstone.namespace('nova.cpu')
goldstone.namespace('nova.cpu.renderlets')
goldstone.namespace('nova.mem')
goldstone.namespace('nova.mem.renderlets')
goldstone.namespace('nova.disk')
goldstone.namespace('nova.disk.renderlets')

goldstone.nova.spawns.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.spawns
    var gt = goldstone.time
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval


    var url = "/nova/hypervisor/spawns" +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}

goldstone.nova.cpu.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.cpu
    var gt = goldstone.time
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval


    var url = "/nova/hypervisor/cpu" +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}

goldstone.nova.mem.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.mem
    var gt = goldstone.time
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval


    var url = "/nova/hypervisor/mem" +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}

goldstone.nova.disk.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.disk
    var gt = goldstone.time
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval


    var url = "/nova/hypervisor/disk" +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}

goldstone.nova._loadUrl = function (ns, start, end, interval, location, render) {
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

goldstone.nova.spawns.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.spawns

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.cpu.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.cpu

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.mem.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.mem

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.disk.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.disk

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}


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
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [total_phys(Number), used_phys(Number),
        //                       [total_virt(Number), used_virt(Number)], ...}
    var ns = goldstone.nova.cpu
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1], v[2], v[3]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                totalPhys = timeDim.group().reduceSum(function (d) { return d[1] }),
                usedPhys = timeDim.group().reduceSum(function (d) { return d[2] }),
                totalVirt = timeDim.group().reduceSum(function (d) { return d[3] }),
                usedVirt = timeDim.group().reduceSum(function (d) { return d[4] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(usedVirt, "Used vCPUs").valueAccessor(function (d) {
                    return d.value
                })
                .stack(usedPhys, "Used pCPUs", function (d) {
                    return d.value
                })
                .stack(totalPhys, "Total pCPUs", function (d) {
                    return d.value
                })
                .stack(totalVirt, "Total vCPUs", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value
                })
                .yAxisLabel("CPU Count")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.mem.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [total_phys(Number), used_phys(Number),
        //                       [total_virt(Number), used_virt(Number)], ...}
    var ns = goldstone.nova.mem
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1], v[2], v[3]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                totalPhys = timeDim.group().reduceSum(function (d) { return d[1] }),
                usedPhys = timeDim.group().reduceSum(function (d) { return d[2] }),
                totalVirt = timeDim.group().reduceSum(function (d) { return d[3] }),
                usedVirt = timeDim.group().reduceSum(function (d) { return d[4] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(usedVirt, "Used vRAM").valueAccessor(function (d) {
                    return d.value
                })
                .stack(usedPhys, "Used pRAM", function (d) {
                    return d.value
                })
                .stack(totalPhys, "Total pRAM", function (d) {
                    return d.value
                })
                .stack(totalVirt, "Total vRAM", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value
                })
                .yAxisLabel("RAM GBs")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.disk.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [successes(Number), failures(Number)], ...}
    var ns = goldstone.nova.disk
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
                totalPhys = timeDim.group().reduceSum(function (d) { return d[1] }),
                usedPhys = timeDim.group().reduceSum(function (d) { return d[2] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(usedPhys, "Used").valueAccessor(function (d) {
                    return d.value
                })
                .stack(totalPhys, "Total", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value
                })
                .yAxisLabel("Disk GB")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}


