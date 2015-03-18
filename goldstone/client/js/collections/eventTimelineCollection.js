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

// define collection and link to model

var EventTimelineModel = GoldstoneBaseModel.extend({
    idAttribute: '@timestamp'
});

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        var nextUrl;

        // in the case that there are additional paged server responses
        if (data.next && data.next !== null) {
            var dN = data.next;
            nextUrl = dN.slice(dN.indexOf('/logging'));

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

    initialize: function(options) {

        this.defaults = _.clone(this.defaults); 

        this.url = options.url || '/logging/events?@timestamp__range={"gte":' + this.computeLookback() + '}&page_size=1000';

        // creates a url similar to:
        // /logging/events?@timestamp__range={"gte":1426698303974}&page_size=1000"

        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3

        this.fetchWithReset();
    },

    model: EventTimelineModel,

    computeLookback: function() {
        var lookbackMinutes;
        if ($('.global-lookback-selector .form-control').length) {
            // global lookback is available:
            lookbackMinutes = parseInt($('.global-lookback-selector .form-control').val(), 10);
        } else {
            // otherwise, default to 1 hour:
            lookbackMinutes = 60;
        }
        return (+new Date() - (1000 * 60 * lookbackMinutes));
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
        var lookback = +new Date() - (val * 60 * 1000);
        this.url = '/logging/events?@timestamp__range={"gte":' +
            lookback + '}&page_size=1000';

    }
});
