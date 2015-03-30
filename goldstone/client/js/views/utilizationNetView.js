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
Extends UtilizationCpuView

Instantiated on nodeReportView as:

this.networkUsageChart = new UtilizationNetCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.networkUsageView = new UtilizationNetView({
    collection: this.networkUsageChart,
    el: '#node-report-r3 #node-report-panel #network-usage',
    width: $('#node-report-r3 #node-report-panel #network-usage').width(),
    featureSet: 'netUsage'
});
*/

var UtilizationNetView = UtilizationCpuView.extend({

    defaults: {
        margin: {
            top: 20,
            right: 33,
            bottom: 25,
            left: 50
        }
    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();

        var data = allthelogs;

        _.each(data, function(item) {
            item['@timestamp'] = moment(item['@timestamp']).valueOf();
        });


        var dataUniqTimes = _.uniq(_.map(data, function(item) {
            return item['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                rx: null,
                tx: null
            };
        });


        _.each(data, function(item) {

            var metric;

            var serviceName = item.name.slice(0, item.name.lastIndexOf('.'));

            if (serviceName.indexOf('rx') >= 0) {
                metric = 'rx';
            } else {
                if (serviceName.indexOf('tx') >= 0) {
                    metric = 'tx';
                } else {}
            }

            newData[item['@timestamp']][metric] += item.value;

        });


        finalData = [];

        _.each(newData, function(item, i) {

            finalData.push({
                rx: item.rx,
                tx: item.tx,
                date: i
            });
        });


        return finalData;

    }

});
