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
Instantiated on discoverView as:
    this.nodeAvailChart = new NodeAvailCollection({});
*/

var NodeAvailCollection = GoldstoneBaseCollection.extend({

    parse: function(data) {
        if (data && data.next && data.next !== null) {
            var dN = data.next;
            var nextUrl = dN.slice(dN.indexOf('/logging'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        } else {
            // there will be multiple fetches arriving and until
            // they are done, no new fetches can be initiated
            // decrement the count and return the data so far
            this.defaults.urlCollectionCount--;
        }
        return data;
    },

    instanceSpecificInit: function(options) {

        // fetchInProgress = true will block further fetches
        this.defaults.fetchInProgress = false;

        // one small interval for more accurate timestamp
        // and one large interval for more accurate event counts
        this.defaults.urlCollectionCount = 2;
        this.defaults.urlCollectionCountOrig = 2;

        // kick off the process of fetching the two data payloads
        this.fetchMultipleUrls();

    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        this.getGlobalLookbackRefresh();
        var lookbackMinutes = (this.globalLookback);
        var lookbackSeconds = (lookbackMinutes * 60);
        var lookbackMilliseconds = (lookbackSeconds * 1000);

        // this is the url with the small interval to gather a more
        // accurate assessment of the time the node was last seen.
        // creating approximately 24 buckets for a good mix of accuracy/speed.
        this.defaults.urlsToFetch[0] = '' +
            '/logging/summarize/?@timestamp__range={"gte":' +
            (+new Date() - (lookbackMilliseconds)) +
            '}&interval=' + Math.max(1, (lookbackMinutes / 24)) + 'm';

        // this is the url with the long lookback to bucket ALL
        // the values into a single return value per alert level.
        // currently magnifying 1 day (or portion thereof) into 1 week.
        this.defaults.urlsToFetch[1] = '' +
            '/logging/summarize/?@timestamp__range={"gte":' +
            (+new Date() - (lookbackMilliseconds)) +
            '}&interval=' + (Math.ceil(lookbackMinutes / 1440)) + 'w';

        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3
        this.fetch({
            // clear out the previous results
            remove: true,
            url: this.defaults.urlsToFetch[0],
            // upon successful first fetch, kick off the second
            success: function() {
                self.fetch({
                    url: self.defaults.urlsToFetch[1],
                    // clear out the previous result, it's already been
                    // stored in the view for zipping the 2 together
                    remove: true
                });
            }
        });
    }
});
