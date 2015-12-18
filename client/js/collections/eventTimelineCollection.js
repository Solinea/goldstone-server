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

var EventTimelineModel = GoldstoneBaseModel.extend({
    // sort by @timestamp. Used to be id, but that has been
    // removed as of v3 api.
    idAttribute: 'timestamp'
});

var EventTimelineCollection = GoldstoneBaseCollection.extend({

    parse: function(data) {
        var nextUrl;

        // in the case that there are additional paged server responses
        if (data.next && data.next !== null) {
            var dN = data.next;

            // if url params change, be sure to update this:
            nextUrl = dN.slice(dN.indexOf(this.urlBase));

            // fetch and add to collection without deleting existing data
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }

        // in any case, return the data to the collection
        return data.results;
    },

    defaults: {},

    urlBase: '/core/events/search/',

    initialize: function(options) {

        this.defaults = _.clone(this.defaults);

        this.getGlobalLookbackRefresh();
        this.urlUpdate(this.globalLookback);
        this.fetchWithReset();
    },

    model: EventTimelineModel,

    fetchWithReset: function() {
        // used when you want to delete existing data in collection
        // such as changing the global-lookback period
        this.fetch({
            remove: true
        });
    },

    fetchNoReset: function() {

        // used when you want to retain existing data in collection
        // such as a global-refresh-triggered update to the Event Timeline viz
        this.fetch({
            remove: false
        });
    },

    urlUpdate: function(val) {
        // creates a url similar to:
        // /logging/events/search/?@timestamp__range={"gte":1426698303974}&page_size=1000"

        var lookback = +new Date() - (val * 60 * 1000);
        this.url = this.urlBase + '?timestamp__range={"gte":' +
            lookback + ',"lte":' + (+new Date()) + '}&page_size=100';
    }
});
