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

var NodeAvailModel = GoldstoneBaseModel.extend({});

var NodeAvailCollection = Backbone.Collection.extend({

    defaults: {},

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
        this.defaults = _.clone(this.defaults); 

        this.urlUpdate(this.computeLookback());

        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3
        this.defaults.fetchInProgress = false;
        this.defaults.urlCollectionCountOrig = 2;
        this.defaults.urlCollectionCount = 2;

        this.fetchWithReset();

    },

    computeLookback: function() {
        var lookbackMinutes;
        if ($('.global-lookback-selector .form-control').length) {
            // global lookback is available:
            lookbackMinutes = parseInt($('.global-lookback-selector .form-control').val(), 10);
        } else {
            // otherwise, default to 1 hour:
            lookbackMinutes = 60;
        }
        return lookbackMinutes;
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

    urlUpdate: function(val) {

        var now = (+new Date());
        var lookback = now - (1000 * 60 * val);

        // remove interval to get a count summary for the full time range
        this.url = '/logging/summarize?interval=1d&@timestamp__range={"gte":' +
            lookback + '}';

    }
});
