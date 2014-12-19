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

var StackedBarChartCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        // return this.dummyData;
        return data;
    },

    model: StackedBarChartModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.urlPrefix = this.options.urlPrefix;
        this.defaults.reportParams = {};
        this.defaults.render = options.render;
        this.defaults.urlPrefix = options.urlPrefix;
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch({
            success: function(data, response, options) {
                console.log('success', options.xhr.getAllResponseHeaders());
            },
            error: function() {
                console.log('error');
            }
        });
    },

    urlGenerator: function() {

        var ns = this.defaults;

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        ns.reportParams.interval = '' + Math.round(1 * ns.globalLookback) + "s";

        this.url = goldstone.nova.apiPerf.timeRange._url(null, ns.reportParams.start, ns.reportParams.end, ns.reportParams.interval, ns.render, ns.urlPrefix);
        // console.log('this.url would be:', this.url);
        // this.url = "/glance/api_perf?start=111&end=112&interval=3600s&render=false";
        console.log('but this.url is currently:', this.url);
    }

});
