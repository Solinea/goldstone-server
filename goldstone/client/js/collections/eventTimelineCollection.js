/**
 * Copyright 2014 Solinea, Inc.
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
    idAttribute: 'id'
});

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        var nextUrl;
        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }
        return data.results;
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

    defaults: {},
    initialize: function(options) {

        this.defaults = _.clone(this.defaults); 

        this.url = options.url || "/core/events?created__gt=" + this.computeLookback() + "&page_size=1000";
        // url similar to: /core/events?created__gt=1423678864754&page_size=1000

        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3

        this.fetchWithReset();
    },

    fetchWithReset: function() {
        this.fetch({
            remove: true
        });
    },

    fetchNoReset: function() {
        this.fetch({
            remove: false
        });
    },

    urlUpdate: function(val) {

        var lookback = +new Date() - (val * 60 * 1000);
        this.url = "/core/events?created__gt=" + lookback + "&page_size=1000";
    }
});
