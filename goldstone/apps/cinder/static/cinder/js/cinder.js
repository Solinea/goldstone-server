/**
 * Created by stanford on 4/14/14.
 */
goldstone.namespace('cinder.report')
goldstone.namespace('cinder.volListApiPerf')
goldstone.namespace('cinder.timeRange')

goldstone.cinder.timeRange._url = function (ns, start, end, interval, render, path) {
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

goldstone.cinder.volListApiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.cinder.volListApiPerf,
        path = "/cinder/vol_list_api_perf"
    return goldstone.cinder.timeRange._url(ns, start, end, interval, render, path)
}
