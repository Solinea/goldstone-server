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

var StackedBarChartCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        return this.dummyData;
        // return data;
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
    },

    dummyData: {"1422518400000": [1, "2015-01-29T08:00:00.000Z", 0], "1422519840000": [0, "2015-01-29T08:24:00.000Z", 0], "1422535680000": [0, "2015-01-29T12:48:00.000Z", 0], "1422558720000": [0, "2015-01-29T19:12:00.000Z", 0], "1422525600000": [0, "2015-01-29T10:00:00.000Z", 0], "1422557280000": [0, "2015-01-29T18:48:00.000Z", 0], "1422550080000": [0, "2015-01-29T16:48:00.000Z", 0], "1422538560000": [0, "2015-01-29T13:36:00.000Z", 0], "1422528480000": [0, "2015-01-29T10:48:00.000Z", 0], "1422541440000": [2, "2015-01-29T14:24:00.000Z", 0], "1422563040000": [0, "2015-01-29T20:24:00.000Z", 0], "1422531360000": [0, "2015-01-29T11:36:00.000Z", 0], "1422548640000": [0, "2015-01-29T16:24:00.000Z", 0], "1422521280000": [0, "2015-01-29T08:48:00.000Z", 0], "1422534240000": [0, "2015-01-29T12:24:00.000Z", 4], "1422555840000": [0, "2015-01-29T18:24:00.000Z", 0], "1422547200000": [0, "2015-01-29T16:00:00.000Z", 0], "1422561600000": [0, "2015-01-29T20:00:00.000Z", 0], "1422554400000": [0, "2015-01-29T18:00:00.000Z", 0], "1422568800000": [3, "2015-01-29T22:00:00.000Z", 0], "1422564480000": [0, "2015-01-29T20:48:00.000Z", 0], "1422537120000": [0, "2015-01-29T13:12:00.000Z", 0], "1422527040000": [2, "2015-01-29T10:24:00.000Z", 1], "1422540000000": [0, "2015-01-29T14:00:00.000Z", 0], "1422567360000": [1, "2015-01-29T21:36:00.000Z", 2], "1422560160000": [0, "2015-01-29T19:36:00.000Z", 0], "1422552960000": [0, "2015-01-29T17:36:00.000Z", 0], "1422522720000": [0, "2015-01-29T09:12:00.000Z", 0], "1422524160000": [0, "2015-01-29T09:36:00.000Z", 0], "1422529920000": [0, "2015-01-29T11:12:00.000Z", 0], "1422542880000": [1, "2015-01-29T14:48:00.000Z", 2], "1422532800000": [0, "2015-01-29T12:00:00.000Z", 0], "1422565920000": [0, "2015-01-29T21:12:00.000Z", 0], "1422551520000": [0, "2015-01-29T17:12:00.000Z", 0], "1422544320000": [0, "2015-01-29T15:12:00.000Z", 0], "1422545760000": [0, "2015-01-29T15:36:00.000Z", 0]}
});
