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

var LogAnalysisCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/data'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        }

        return data;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'time' for
    // the models as they are put into the collection
    comparator: 'time',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
    },

    fetchWithRemoval: function() {
        this.fetch({
            remove: true
        });
    },
});
