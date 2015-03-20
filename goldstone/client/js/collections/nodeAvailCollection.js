/**
 * Copyright 2014 - 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
Instantiated on discoverView as:
var nodeAvailChart = new NodeAvailCollection({
    url: "/logging/nodes?page_size=100"
});
*/

var NodeAvailModel = GoldstoneBaseModel.extend({
});

var NodeAvailCollection = Backbone.Collection.extend({

    parse: function(data) {
        if (data.next && data.next !== null) {
            var dp = data.next;
            var nextUrl = dp.slice(dp.indexOf('/logging'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }
        return data;
    },

    model: NodeAvailModel,

    initialize: function(options) {
        this.url = options.url || "/logging/summarize?interval=15m";
        this.fetchWithReset();
    },

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
});
