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

goldstone.namespace('glance.report')
goldstone.namespace('glance.apiPerf')
goldstone.namespace('glance.topology')

goldstone.glance.apiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.glance.apiPerf,
        gt = goldstone.time,
        path = "/glance/api_perf",
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

goldstone.glance.topology.url = function (render) {
    "use strict";
    var url = "/glance/topology"

    if (typeof render !== 'undefined') {
        url += "?render=" + render
    }
    return url
}

