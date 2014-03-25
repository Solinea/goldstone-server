goldstone.namespace('nova.dom')
goldstone.namespace('nova.discover')
goldstone.namespace('nova.spawns')
goldstone.nova.spawns.url = function (start, end, interval, render) {
    "use strict";
    var gnd = goldstone.nova.discover
    var url = "hypervisor/spawns" +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=render"
    }
    return url
}
