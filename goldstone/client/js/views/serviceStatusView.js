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
Instantiated on nodeReportView.js similar to:

this.serviceStatusChart = new ServiceStatusCollection({
    nodeName: hostName
});

this.serviceStatusChartView = new ServiceStatusView({
    collection: this.serviceStatusChart,
    el: '#node-report-main #node-report-r2',
    width: $('#node-report-main #node-report-r2').width(),
    globalLookback: ns.globalLookback
});
*/

var ServiceStatusView = GoldstoneBaseView.extend({

    processOptions: function() {
        ServiceStatusView.__super__.processOptions.call(this);

        this.defaults.spinnerPlace = '.spinnerPlace';
    },

    processListeners: function() {
        this.listenTo(this.collection, 'sync', this.update);
        this.listenTo(this.collection, 'error', this.dataErrorMessage);
        this.on('lookbackSelectorChanged', function() {
            this.defaults.spinnerDisplay = 'inline';
            $(this.el).find('#spinner').show();
            this.collection.retrieveData();
        });
    },

    standardInit: function() {},

    specialInit: function() {},

    dataErrorMessage: function(message, errorMessage) {
        ServiceStatusView.__super__.dataErrorMessage.apply(this, arguments);
    },

    classSelector: function(item) {
        if (item === "running") {
            return 'alert alert-success';
        }
        return 'alert alert-danger fa fa-exclamation-circle';
    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();

        var data = allthelogs;
        // inside 'data', the results are stored with the
        // timestamp property in descending order.
        // the set can be achieved from _.uniq + data.name;

        var uniqServiceNames = _.uniq(_.map(data, function(item) {
            return item.name;
        }));


        var novelServiceBreadcrumb = {};

        _.each(uniqServiceNames, function(item) {
            novelServiceBreadcrumb[item] = true;
        });


        // set a counter for the length of uniq(data.name);
        var uniqSetSize = _.keys(uniqServiceNames).length;

        /*
        iterate through data and as novel service
        names are located, attach the status at that
        moment to that service name and don't reapply
        it, as the next result is not the most recent.
        */

        var finalData = [];

        for (var item in data) {
            if (novelServiceBreadcrumb[data[item].name]) {
                finalData.push(data[item]);
                novelServiceBreadcrumb[data[item].name] = false;

                // when finding a novel name, decrement the set length counter.
                uniqSetSize--;

                // when the counter reaches 0, the set is
                // complete and the most recent
                // results have been assigned to each of
                // the items in the set.
                if (uniqSetSize === 0) {
                    break;
                }
            }
        }

        // final formatting of the results as
        // [{'serviceName': status}...]
        _.each(finalData, function(item, i) {
            var resultName;
            var resultObject = {};
            if (item.name && item.name.indexOf('.') !== -1) {
                resultName = item.name.slice(item.name.lastIndexOf('.') + 1);
            } else {
                resultName = item.name;
            }
            resultObject[resultName] = item.value;
            finalData[i] = resultObject;
        });

        return finalData;

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        this.hideSpinner();

        var allthelogs = this.collectionPrep();

        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        $(this.el).find('.mainContainer .toRemove').off();
        $(this.el).find('.mainContainer').empty();

        var nodeNames = [];

        _.each(allthelogs, function(item) {
            nodeNames.push(item);
        });

        this.sorter(nodeNames);

        _.each(nodeNames, function(item, i) {

            var itemKeyFull = '';
            var itemValue = _.values(nodeNames[i])[0];
            var itemKey = _.keys(nodeNames[i])[0];
            if (itemKey.length > 27) {
                itemKeyFull = _.keys(nodeNames[i])[0];
                itemKey = itemKey.slice(0, 27) + '...';
            }

            $(self.el).find('.mainContainer').append('<div style="width: 170px;' +
                'height: 22px; font-size:11px; margin-bottom: 0; ' +
                ' text-align:center; padding: 3px 0;" data-toggle="tooltip" ' +
                'data-placement="top" title="' + itemKeyFull +
                '" class="col-xs-1 toRemove ' + this.classSelector(itemValue) +
                '"> ' + itemKey + '</div>');
        }, this);

        $(this.el).find('.mainContainer .toRemove').on('mouseover', function() {
            $(this).tooltip('show');
        });
    },

    sorter: function(data) {

        return data.sort(function(a, b) {
            if (Object.keys(a) < Object.keys(b)) {
                return -1;
            }
            if (Object.keys(a) > Object.keys(b)) {
                return 1;
            } else {
                return 0;
            }
        });

    },

    render: function() {
        $(this.el).append(this.template());
        return this;
    },

    template: _.template('<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="spinnerPlace"></div>' +
        '<div class="mainContainer"></div>')

});
