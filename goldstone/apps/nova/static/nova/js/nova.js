goldstone.namespace('nova.dom')
goldstone.namespace('nova.discover')
goldstone.namespace('nova.spawns')
goldstone.namespace('nova.spawns.renderlets')

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

goldstone.nova.spawns.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.spawns,
        gt = goldstone.time,
        chart

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


goldstone.nova.spawns.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [successes(Number), failures(Number)], ...}
    var ns = goldstone.nova.spawns
    if (ns.data !== 'undefined') {
        if (ns.data.length < 0) {
            // TODO paint a nice "no data message"
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
