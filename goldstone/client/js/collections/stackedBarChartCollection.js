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

var StackedBarChartCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        console.log('StackedBarChartCollection', data);
        return data;
    },

    model: StackedBarChartModel,

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
        this.url = ns.urlPrefix + '?start=' + Math.floor(ns.reportParams.start / 1000) + '&end=' + Math.floor(ns.reportParams.end / 1000) + '&interval=' + ns.reportParams.interval + '&render=false';
    }

});
