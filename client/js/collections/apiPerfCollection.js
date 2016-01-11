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
Instantiated similar to:

this.novaApiPerfChart = new ApiPerfCollection({
    componentParam: 'nova',
});
*/

var ApiPerfCollection = GoldstoneBaseCollection.extend({

    preProcessData: function(data) {
        if (data && data.aggregations.per_interval.buckets) {
            return data.aggregations.per_interval.buckets;
        } else {
            return [];
        }
    },

    checkForAdditionalPages: function() {

    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },
    addInterval: function() {
        n = Math.round(1 * this.globalLookback);
        return '&interval=' + n + 's';
    },
    addCustom: function() {
        return '&component=' + this.componentParam;
    }

});
