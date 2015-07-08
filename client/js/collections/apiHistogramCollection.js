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

 /*
instantiated on eventsBrowserPageView as:

this.eventsBrowserVizCollection = new EventsHistogramCollection({});

this.eventsBrowserView = new ChartSet({
    chartTitle: 'Events Histogram',
    collection: this.eventsBrowserVizCollection,
    el: '#events-histogram-visualization',
    infoIcon: 'fa-tasks',
    width: $('#events-histogram-visualization').width(),
    yAxisLabel: 'Number of Events'
});
 */

// define collection and link to model

var ApiHistogramCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        this.urlGenerator();
    },

    urlBase: '/core/apiperf/summarize/',

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    preProcessData: function(data) {
        var self = this;
        // initialize container for formatted results
        finalResult = [];

        // for each array index in the 'data' key
        _.each(data.per_interval, function(item) {
            var tempObj = {};

            // adds the 'time' param based on the
            // object keyed by timestamp
            tempObj.time = parseInt(_.keys(item)[0], 10);
            tempObj.count = item[tempObj.time].count;
            // iterate through each item in the array
            // _.each(item[tempObj.time], function(obj){
            //     var key = _.keys(obj);
            //     var value = _.values(obj)[0];

            //     // copy key/value pairs to tempObj
            //     tempObj[key] = value;
            // });

            // initialize counter
            // var count = 0;
            // _.each(tempObj, function(val, key) {
            //     // add up the values of each nested object
            //     if(key !== 'time') {
            //         count += val;
            //     }
            // });

            // set 'count' equal to the counter
            // tempObj.count = count;

            // add the tempObj to the final results array
            finalResult.push(tempObj);
        });

        // returning inside the 'parse' function adds to collection
        // and triggers 'sync'
        return finalResult;
    }
});
