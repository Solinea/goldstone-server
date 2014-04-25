/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: John Stanford
 */

goldstone.namespace('cinder.report')
goldstone.namespace('cinder.apiPerf')
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

goldstone.cinder.apiPerf.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.cinder.apiPerf,
        path = "/cinder/api_perf"
    return goldstone.cinder.timeRange._url(ns, start, end, interval, render, path)
}
