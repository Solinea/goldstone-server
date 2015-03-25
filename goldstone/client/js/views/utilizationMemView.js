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

        allthelogs = this.collection.toJSON();

        var data = allthelogs;

        _.each(data, function(item) {
            item['@timestamp'] = moment(item['@timestamp']).unix() * 1000;
        });

        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].name === 'os.mem.total') {
                ns.memTotal = data[i];
                var splicedOut = data.splice(i, 1);
                break;
            }
        }


        var dataUniqTimes = _.map(data, function(item) {
            return item['@timestamp'];
        });


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                free: null
            };
        });


        _.each(data, function(item) {

            var metric = item.name.slice(item.name.lastIndexOf('.') + 1);

            newData[item['@timestamp']][metric] = item.value;

        });


        finalData = [];

        _.each(newData, function(item, i) {

            finalData.push({
                used: (ns.memTotal.value - item.free) / self.defaults.divisor,
                free: item.free / self.defaults.divisor,
                // total renders a thin line at the top of the area stack
                // the actual value comes from ns.memTotal.value
                total: 0.1,
                date: i
            });
        });


        return finalData;

    }

});
