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

var ServiceStatusCollection = GoldstoneBaseCollection.extend({

    instanceSpecificInit: function() {
        this.processOptions();
        this.urlGenerator();
    },

    urlGenerator: function(data) {
        var self = this;

        // the call to /core/saved_seaarch/?name=service+status
        // returns the uuid required for the service aggregations

        $.get(this.urlBase + '?name=service+status', function() {})
            .done(function(data) {
                var searchUuid = self.constructAggregationUrl(data.results[0].uuid);
                self.url = searchUuid;

                // fetch return triggers 'sync' which triggers
                // update in the client with the returned data
                self.fetch();
            })
            .error(function(err) {
                console.error(err);
            });

    },

    constructAggregationUrl: function(uuid) {
        return this.urlBase + uuid + '/results/';
    },

    // Overwriting. Additinal pages not needed.
    checkForAdditionalPages: function(data) {
        return true;
    },


});
