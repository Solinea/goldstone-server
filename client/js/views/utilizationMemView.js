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
extends UtilizationCpuView

Instantiated on nodeReportView as:

this.memoryUsageChart = new UtilizationMemCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.memoryUsageView = new UtilizationMemView({
    collection: this.memoryUsageChart,
    el: '#node-report-r3 #node-report-panel #memory-usage',
    width: $('#node-report-r3 #node-report-panel #memory-usage').width(),
    featureSet: 'memUsage'
});
*/

var UtilizationMemView = UtilizationCpuView.extend({

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        var allthelogs = this.collection.toJSON();

        var data = allthelogs;

        if(data === undefined || data.length === 0) {
            return [];
        }

        _.each(data, function(collection) {

            // within each collection, tag the data points
            _.each(collection.per_interval, function(dataPoint) {

                _.each(dataPoint, function(item, i) {
                    item['@timestamp'] = i;
                    item.name = collection.metricSource;
                    item.value = item.stats.max;
                });

            });
        });


        var condensedData = _.flatten(_.map(data, function(item) {
            return item.per_interval;
        }));


        var dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
            return item[_.keys(item)[0]]['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                wait: null,
                sys: null,
                user: null
            };
        });


        _.each(condensedData, function(item) {

            var key = _.keys(item)[0];
            var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
            newData[key][metric] = item[key].value;

        });

        finalData = [];

        // make sure to set ns.memTotal
        var key = _.keys(allthelogs[0].per_interval[1])[0];

        ns.memTotal = allthelogs[0].per_interval[1][key].stats.max; // double check

        _.each(newData, function(item, i) {

            item.total = item.total || 0;
            item.free = item.free || 0;

            finalData.push({
                used: (item.total - item.free) / ns.divisor,
                free: item.free / ns.divisor,
                // total renders a thin line at the top of the area stack
                // the actual value comes from ns.memTotal.value
                total: 0.1,
                date: i
            });
        });

        return finalData;

    }

});
