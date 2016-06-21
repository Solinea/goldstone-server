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

var MetricOverviewCollection = GoldstoneBaseCollection.extend({

    /*
log
/core/logs/?@timestamp__range=\{"gte":1452731730365,"lte":1452732630365\}&interval=5m

event
/core/events/?@timestamp__range=\{"gte":1452731730365,"lte":1452732630365\}&interval=5m

api
/core/api-calls/?@timestamp__range=\{"gte":1452731730365,"lte":1452732630365\}&interval=5m

*/

    // Overwriting. Additinal pages not needed.
    checkForAdditionalPages: function(data) {
        return true;
    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addRange2: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    urlGenerator: function() {
        var self = this;
        this.computeLookbackAndInterval(60);

        var coreUrlVars = ['logs/', 'events/', 'api-calls/'];
        var coreCalls = coreUrlVars.map(function(item) {
            return self.urlBase + item + (item === 'events/' ? self.addRange2() : self.addRange()) +
                self.addInterval();
        });

        $.when($.get(coreCalls[0]), $.get(coreCalls[1]), $.get(coreCalls[2]))
            .done(function(r1, r2, r3) {

                // container for combined data
                var finalResult = {};
                finalResult.logData = r1[0];
                finalResult.eventData = r2[0];
                finalResult.apiData = r3[0];

                // before server has fully spun up
                // it omits the following keys
                // that the visualization looks for
                var defaultSignature = {
                    per_interval: {
                        buckets: []
                    }
                };

                _.each(finalResult, function(collection) {
                    collection.aggregations = collection.aggregations || defaultSignature;
                });

                // append start/end of timestamp__range
                finalResult.startTime = self.gte;
                finalResult.endTime = self.epochNow;

                // reset collection
                // add aggregated and tagged api call data
                self.reset();
                self.add([finalResult]);
                self.trigger('sync');
            })
            .fail(function(err) {
                self.trigger('error', err);
            });
    },

});
