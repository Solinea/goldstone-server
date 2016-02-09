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

    urlBase: '/core/api-calls/',

    // overwrite this, as the aggregation for this chart is idential on
    // the additional pages. The additional pages are only relevant to the
    // server-side paginated fetching for the log browser below the viz
    checkForAdditionalPages: function() {
        return true;
    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    addPageSize: function(n) {
        return '&page_size=1';
    },

    preProcessData: function(data) {

        var self = this;

        // initialize container for formatted results
        var finalResult = [];

        // for each array index in the 'data' key
        _.each(data.aggregations.per_interval.buckets, function(item) {
            var tempObj = {};
            tempObj.time = item.key;
            tempObj.count = item.doc_count;
            finalResult.push(tempObj);
        });

        // returning inside the 'parse' function adds to collection
        // and triggers 'sync'
        return finalResult;
    }
});
