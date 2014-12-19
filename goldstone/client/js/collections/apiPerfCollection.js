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

var ApiPerfCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        return JSON.parse(data);
    },

    model: ApiPerfModel,

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
        var ns = this.defaults;

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        ns.reportParams.interval = '' + Math.round(1 * ns.globalLookback) + "s";
        this.url = goldstone[this.defaults.urlPrefix].apiPerf.url(ns.reportParams.start, ns.reportParams.end, ns.reportParams.interval, false);
    }
});
