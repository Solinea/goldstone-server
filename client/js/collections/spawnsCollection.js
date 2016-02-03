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
Instantiated on novaReportView as:

this.vmSpawnChart = new SpawnsCollection({
    urlBase: '/nova/hypervisor/spawns/'
});

this.vmSpawnChartView = new SpawnsView({
    chartTitle: goldstone.translate("VM Spawns"),
    collection: this.vmSpawnChart,
    height: 350,
    infoText: 'novaSpawns',
    el: '#nova-report-r1-c2',
    width: $('#nova-report-r1-c2').width(),
    yAxisLabel: goldstone.translate('Spawn Events')
});


returns:
per_interval: [{
    timestamp:[count: 1, success: [{true: 1}]],
    timestamp:[count: 3, success: [{true: 2}, {false: 1}]],
    timestamp:[count: 0, success: []],
    ...
}]
*/

var SpawnsCollection = GoldstoneBaseCollection.extend({

    mockZeros: function(gte, epochNow) {

        // correct for forgotten values
        epochNow = epochNow || +new Date(); // now
        gte = gte || (epochNow - (1000 * 60 * 60 * 15)); // 15 minutes ago

        // container for timestamp slices
        var timeSet = [];

        // prepare a slice size to return in ms
        var span = Math.floor((epochNow - gte) / 24);

        // populate timeSet with timestamps spaced
        // by the 'span' size, covering the range of
        // timestampes defined by the function arguments
        while (epochNow > gte) {
            timeSet.push(epochNow);
            epochNow -= span;
        }

        // container that will hold final results
        var result = [];

        // iterate through the timeslices to create
        // a set of mocked zero results
        timeSet.forEach(function(timeStamp) {
            var tempResult = {};
            tempResult[timeStamp] = {
                count: 0,
                success: []
            };
            result.push(tempResult);
        });

        // return final results
        return result;
    },

    preProcessData: function(data) {
        if (data && data.per_interval) {
            return data.per_interval;
        } else {
            return this.mockZeros(this.gte, this.epochNow);
        }
    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },
    addInterval: function() {
        n = Math.max(1, (this.globalLookback / 24));
        return '&interval=' + n + 'm';
    },

    // creates a url similar to:
    // /nova/hypervisor/spawns/?@timestamp__range={"gte":1429027100000}&interval=1h

});
