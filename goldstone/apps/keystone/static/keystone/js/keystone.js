/**
 * Created by stanford on 4/14/14.
 */
goldstone.namespace('keystone.report')
goldstone.namespace('keystone.apiPerf')
goldstone.namespace('keystone.timeRange')

goldstone.keystone.timeRange._url = function (ns, start, end, interval, render, path) {
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

goldstone.keystone.apiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.keystone.apiPerf,
        path = "/keystone/api_perf"
    return goldstone.keystone.timeRange._url(ns, start, end, interval, render, path)
}
