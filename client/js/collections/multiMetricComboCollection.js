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

// define collection and link to model

/*
instantiated on nodeReportView and novaReportView

instantiation example:

this.cpuUsageChart = new MultiMetricComboCollection({
    metricNames: ['os.cpu.sys', 'os.cpu.user', 'os.cpu.wait'],
    globalLookback: ns.globalLookback, (optional)
    nodeName: hostName (optional)
});
*/

var MultiMetricComboCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        var ns = this.defaults;

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        } else {
            ns.urlCollectionCount--;
        }

        // before returning the collection, tag it with the metricName
        // that produced the data
        data.metricSource = ns.metricNames[(ns.metricNames.length - 1) - ns.urlCollectionCount];

        return data;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.reportParams = {};
        this.defaults.fetchInProgress = false;
        this.defaults.nodeName = this.options.nodeName;
        this.defaults.metricNames = this.options.metricNames;
        this.defaults.urlCollectionCountOrig = this.defaults.metricNames.length;
        this.defaults.urlCollectionCount = this.defaults.metricNames.length;
        this.fetchMultipleUrls();

    },

    fetchMultipleUrls: function() {
        var self = this;
        var ns = this.defaults;

        if (ns.fetchInProgress) {
            return null;
        }

        ns.fetchInProgress = true;
        ns.urlsToFetch = [];

        // grabs minutes from global selector option value
        ns.globalLookback = $('#global-lookback-range').val();

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date() - (ns.globalLookback * 1000 * 60));
        ns.reportParams.interval = '' + Math.max(1, (ns.globalLookback / 24)) + 'm';

        _.each(self.defaults.metricNames, function(prefix) {

            var urlString = '/core/metrics/summarize/?name=' + prefix;

            if (self.defaults.nodeName) {
                urlString += '&node=' + self.defaults.nodeName;
            }

            urlString += '&@timestamp__range={"gte":' +
                ns.reportParams.start + ',"lte":' + ns.reportParams.end +
                '}&interval=' + ns.reportParams.interval;

            self.defaults.urlsToFetch.push(urlString);
        });

        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: ns.urlsToFetch[0],
            success: function() {

                // upon success: further fetches are carried out with
                // remove: false to build the collection
                _.each(self.defaults.urlsToFetch.slice(1), function(item) {
                    self.fetch({
                        url: item,
                        remove: false
                    });
                });
            }
        });
    }
});
