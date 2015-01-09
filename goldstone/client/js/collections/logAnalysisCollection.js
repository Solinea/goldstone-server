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

var LogAnalysisCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        console.log(data);

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

    model: LogAnalysisModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: 'timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.urlRoot = options.urlRoot;
        this.defaults.start = options.start;
        this.defaults.end = options.end;
        this.defaults.width = options.width;
        this.constructUrl();
    },

    constructUrl: function() {
        var self = this;
        var ns = this.defaults;

        var seconds = (ns.end - ns.start) / 1000;
        console.log('diff sec', seconds);
        var interval = Math.floor((seconds / (ns.width / 10)));
        console.log('interval', interval);

        this.url = ns.urlRoot + 'start_time=' + Math.floor(ns.start / 1000) + '&end_time=' + Math.floor(ns.end / 1000) + '&interval=' + interval + 's';

        console.log('loganalysiscollection url', this.url);

        this.fetch({
            remove: true
        });
    }
});
