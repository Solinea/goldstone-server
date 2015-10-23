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

            // get timestamp
            var key = _.keys(item)[0];
            var tempObj = {};

            // adds the 'time' param based on the object keyed by timestamp
            // and the 200-500 statuses
            tempObj.time = parseInt(key, 10);
            // tempObj.count = item[tempObj.time].count;

            // [500, 400, 300, 200]
            tempObj.stati5432 = _.map(item[tempObj.time].response_status, function(item) {
                return _.values(item)[0];
            });

            tempObj.count = _.reduce(tempObj.stati5432, function(prev, next) {
                return prev + next;
            }, 0);

            // add the tempObj to the final results array
            finalResult.push(tempObj);
        });


        /*
        compute a nested array matrix of form:

        [
            [time, 500s, 400s, 300s, 200s],
            [time, 500s, 400s, 300s, 200s],
            [time, 500s, 400s, 300s, 200s] ...
        ]

        */

        var matrix = _.map(data.per_interval, function(num) {

            var time = +(_.keys(num)[0]);
            var result = [];
            result.push(time);

            _.each(_.map(_.values(num)[0].response_status, function(item) {
                return _.values(item)[0];
            }), function(item) {
                result.push(item);
            });

            return result;
        });

        /*
        remap to form:

        [
            [{x:time, y:0},{x:time, y:0},{x:time, y:0},{x:time, y:0},],
            [{x:time, y:0},{x:time, y:0},{x:time, y:0},{x:time, y:0},],
            [{x:time, y:0},{x:time, y:0},{x:time, y:0},{x:time, y:0},],
            [{x:time, y:0},{x:time, y:0},{x:time, y:0},{x:time, y:0},]
        ]
        */

        var remapped = ["500", "400", "300", "200"].map(function(dat, i) {
            return matrix.map(function(d, ii) {
                return {x: d[0], y: d[i+1]};
            });
        });

        var stacked = d3.layout.stack()(remapped);

        // returning inside the 'parse' function adds to collection
        // and triggers 'sync'
        return {
            finalResult: finalResult,
            stacked: stacked
        };
    }
});
