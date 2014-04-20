/**
 * Created by stanford on 4/14/14.
 */
goldstone.namespace('neutron.report')
goldstone.namespace('neutron.agentListApiPerf')
goldstone.namespace('neutron.timeRange')

goldstone.neutron.timeRange._url = function (ns, start, end, interval, render, path) {
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

goldstone.neutron.agentListApiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.neutron.agentListApiPerf,
        path = "/neutron/agent_list_api_perf"
    return goldstone.neutron.timeRange._url(ns, start, end, interval, render, path)
}
