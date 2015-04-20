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

/*
This collection is currently direclty implemented in the
Nova Disk Resources viz
JSON payload format:
{
    timestamp: [used, total_mem],
    timestamp: [used, total_mem],
    timestamp: [used, total_mem],
    ...
}
*/


// define collection and link to model

var DiskResourceCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.results) {
            return data.results;
        } else {
            return [];
        }
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.urlPrefix = this.options.urlPrefix;
        this.defaults.reportParams = {};
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {

        // a listener in the parent page container triggers an event picked up
        // by GoldstoneBaseView which adjusts ns.globalLookback to match
        // the number of minutes specified by the selector

        var ns = this.defaults;

        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        this.url = '/core/metrics?name__prefix=nova.hypervisor.local_gb&@timestamp__range={"gte":' +
            moment(ns.reportParams.start).valueOf() + '}';
    }

    // creates a url similar to:
    // /core/metrics?name__prefix=nova.hypervisor.local_gb&@timestamp__range={"gte":1429058361304}
});
