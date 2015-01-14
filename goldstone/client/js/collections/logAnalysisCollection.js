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

    defaults: {

        zoomedStart: null,
        zoomedEnd: null,
        isZoomed: false,

    },

    parse: function(data) {

        if (this.defaults.isZoomed && data.data && data.data.length < 4) {
            return this.defaults.cachedDataPayload;
        }

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/data'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        }

        this.triggerSearchTable();

        return data.data;
    },

    model: LogAnalysisModel,

    // will impose an order based on 'time' for
    // the models as they are put into the collection
    comparator: 'time',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.urlRoot = options.urlRoot;
        this.defaults.start = options.start;
        this.defaults.end = options.end;
        this.defaults.width = options.width;
        this.constructUrl();
        this.fetchWithRemoval();
    },

    // addLevelParams: function(uri) {
    //     var ns = this.defaults;

    //     var levels = ns.filter || {};
    //     for (var k in levels) {
    //         uri = uri.concat("&", k, "=", levels[k]);
    //         console.log(uri);
    //     }
    //     return uri;
    // },

    triggerSearchTable: function() {

        drawSearchTable('#log-search-table', this.defaults.start, this.defaults.end);
    },

    constructUrl: function() {
        var self = this;
        var ns = this.defaults;

        ns.start = ns.zoomedStart || ns.start;
        ns.end = ns.zoomedEnd || ns.end;

        var seconds = (ns.end - ns.start) / 1000;
        var interval = Math.max(1, Math.floor((seconds / (ns.width / 10))));

        this.url = ns.urlRoot + 'start_time=' + Math.floor(ns.start / 1000) + '&end_time=' + Math.floor(ns.end / 1000) + '&interval=' + interval + 's';

        if (ns.isZoomed) {
            if (this.models.length >= 4) {
                ns.cachedDataPayload = this.models;
            }
        }
    },

    fetchWithRemoval: function() {
        this.fetch({
            remove: true
        });
    },
});
