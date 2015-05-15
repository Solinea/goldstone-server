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
Nova VM Spawns viz
JSON payload format:
{
    timestamp:[successes, fails],
    timestamp:[successes, fails],
    timestamp:[successes, fails],
    ...
}
*/

// define collection and link to model

var SpawnsCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.per_interval) {
            return data.per_interval;
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

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        ns.reportParams.interval = '' + Math.round(1 * ns.globalLookback) + "s";
        this.url = ns.urlPrefix + '?@timestamp__range={"gte":' +
            ns.reportParams.start + '}&interval=' + ns.reportParams.interval;
    }

    // creates a url similar to:
    // /nova/hypervisor/spawns/?@timestamp__range={"gte":1429027100000}&interval=1h

});
