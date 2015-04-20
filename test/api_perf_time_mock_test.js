/**
 * Copyright 2015 Solinea, Inc.
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
 */

//---------------------------
// begin time mock graph update tester
// a convenient way to test backbone re-rendering of
// charts which is triggered by chart data update


// function to create urls that advance at adjustable rates
var timeMock = function() {
    // enter unix time/1000 of start moment
    var urlNumBase = 1407617849;
    // sets the end time to about 75 minutes to the start time
    var urlNumBase2 = urlNumBase + 4592;
    return function() {
        // advances 4 minutes per invocation
        var advanceRate = 240;
        urlNumBase += advanceRate;
        urlNumBase2 += advanceRate;
        // returns new url to query for data payload
        var result = "/cinder/api_perf?start=" + urlNumBase + "&end=" + urlNumBase2 + "&interval=120s&render=false";
        return result;
    };
};
var timeAdvancer = timeMock();


var graphUpdater = setInterval(function() {
    // call timeAdvancer which stores the urlNumBase in a closure scope
    var newTime = timeAdvancer();

    novaApiPerfChart.url = newTime;
    console.log('fetching again', novaApiPerfChart.url);
    novaApiPerfChart.fetch({
        success: function(data) {}
    });

    keystoneApiPerfChart.url = newTime;
    console.log('fetching again', keystoneApiPerfChart.url);
    keystoneApiPerfChart.fetch({
        success: function(data) {}
    });

}, 2000);
setTimeout(function() {
    console.log('auto update interval cleared');
    clearInterval(graphUpdater);
}, 30000);

// end time mock graph update tester
//---------------------------
