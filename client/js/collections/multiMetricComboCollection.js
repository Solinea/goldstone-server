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

this.cpuResourcesChart = new MultiMetricComboCollection({
    metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used'],
    nodeName: hostName (optional)
});
*/

var MultiMetricComboCollection = GoldstoneBaseCollection.extend({

    instanceSpecificInit: function() {
        this.processOptions();
        this.fetchInProgress = false;
        this.urlCollectionCountOrig = this.metricNames.length;
        this.urlCollectionCount = this.metricNames.length;
        this.urlGenerator();
    },

    parse: function(data) {
        var self = this;

        // before adding data to the collection, tag it with the metricName
        // that produced the data
        data.metricSource = this.metricNames[(this.metricNames.length) - this.urlCollectionCount];

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        } else {
            this.urlCollectionCount--;
        }
        return data;
    },

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    // comparator: '@timestamp',

    urlGenerator: function() {
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.fetchInProgress) {
            return null;
        }

        this.fetchInProgress = true;
        this.urlsToFetch = [];

        this.computeLookbackAndInterval();

        // grabs minutes from global selector option value
        // this.globalLookback = $('#global-lookback-range').val();

        // this.epochNow = +new Date();
        // this.gte = (+new Date() - (this.globalLookback * 1000 * 60));

        // set a lower limit to the interval of '2m'
        // in order to avoid the sawtooth effect
        this.interval = '' + Math.max(2, (this.globalLookback / 24)) + 'm';


        _.each(this.metricNames, function(prefix) {

            var urlString = '/core/metrics/?name=' + prefix;

            if (self.nodeName) {
                urlString += '&node=' + self.nodeName;
            }

            urlString += '&@timestamp__range={"gte":' +
                self.gte + ',"lte":' + self.epochNow +
                '}&interval=' + self.interval;

            self.urlsToFetch.push(urlString);
        });
        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: self.urlsToFetch[0],
            success: function() {
                // upon success: further fetches are carried out with
                // remove: false to build the collection
                _.each(self.urlsToFetch.slice(1), function(item) {
                    self.fetch({
                        url: item,
                        remove: false
                    });
                });
            }
        });
    }
});
