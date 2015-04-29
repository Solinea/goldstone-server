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

// define collection and link to model

var UtilizationMemCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null && data.next.indexOf('os.mem.total') === -1) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        } else {
            this.defaults.urlCollectionCount--;
        }

        return data.results;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.fetchInProgress = false;
        this.defaults.nodeName = options.nodeName;
        this.defaults.urlPrefixes = ['total', 'free'];
        this.defaults.urlCollectionCountOrig = this.defaults.urlPrefixes.length;
        this.defaults.urlCollectionCount = this.defaults.urlPrefixes.length;
        this.defaults.globalLookback = options.globalLookback;
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        // grabs minutes from global selector option value
        var lookback = +new Date() - (1000 * 60 * this.defaults.globalLookback);

        this.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.mem." + this.defaults.urlPrefixes[0] + "&node=" +
            this.defaults.nodeName + "&@timestamp__range={'gte':" +
            lookback + "}&page_size=1");

        this.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.mem." + this.defaults.urlPrefixes[1] + "&node=" +
            this.defaults.nodeName + "&@timestamp__range={'gte':" +
            lookback + "}&page_size=1000");

        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: this.defaults.urlsToFetch[0],
            success: function() {

                // upon success: further fetches are carried out with
                // remove: false to build the collection
                _.each(self.defaults.urlsToFetch.slice(1), function(item) {
                    self.fetch({
                        url: item,
                        remove: false
                    });
                });
            }
        });
    }
});
