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
        } else {
            this.defaults.urlCollectionCount--;
        }
        return data;
    },

    model: NodeAvailModel,

    initialize: function(options) {
        this.defaults = _.clone(this.defaults); 

        this.defaults.fetchInProgress = false;
        this.defaults.urlCollectionCountOrig = 2;
        this.defaults.urlCollectionCount = 2;

        this.fetchMultipleUrls();

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

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        var lookbackSeconds = (this.computeLookback() * 60);

        this.defaults.urlsToFetch[0] = '' +
            '/logging/summarize?timestamp__range={"gte":' +
            (+new Date() - (lookbackSeconds * 1000)) +
            '}&interval=' + (lookbackSeconds / 60 / 4) + 'm';

        // this is the call with the 1d lookback to bucket ALL
        // the values into a single return value per alert level.
        this.defaults.urlsToFetch[1] = '' +
            '/logging/summarize?timestamp__range={"gte":' +
            (+new Date() - (lookbackSeconds * 1000)) +
            '}&interval=1d';

        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3
        this.fetch({
            remove: true,
            url: this.defaults.urlsToFetch[0],
            success: function() {
                self.fetch({
                    url: self.defaults.urlsToFetch[1],
                    remove: true
                });
            }
        });
    }
});
