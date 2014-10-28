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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Alex Jacobs
 */

// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        var nextUrl;
        if (data.next !== null) {
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

    initialize: function(options) {

        // default to 1 hour lookback
        var nowMinusHour = (+new Date() - (1000 * 60 * 60));
        this.url = options.url || "/core/events?created__gt=" + nowMinusHour + "&page_size=1000";

        // adding {remove:false} to the initial fetch
        // will introduce an artifact that will
        // render via d3
        this.fetch();
    },

    urlUpdate: function(val) {

        var lookback = +new Date() - (val * 60 * 1000);
        this.url = "/core/events?created__gt=" + lookback + "&page_size=1000";
    }
});
