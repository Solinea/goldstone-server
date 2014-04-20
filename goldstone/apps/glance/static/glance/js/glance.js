/**
 * Created by stanford on 4/14/14.
 */
goldstone.namespace('glance.report')
goldstone.namespace('glance.imageApiPerf')

goldstone.glance.imageApiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.glance.imageApiPerf,
        gt = goldstone.time,
        path = "/glance/image_api_perf",
        url

    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval

    url = path +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}
