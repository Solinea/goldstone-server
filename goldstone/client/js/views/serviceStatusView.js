/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Alex Jacobs
 */

var ServiceStatusView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.el = options.el;
        this.defaults.width = options.width;

        var ns = this.defaults;
        var self = this;

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = ns.location;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'display': ns.spinnerDisplay
            });
        });

        this.collection.on('sync', function() {
            if (self.collection.defaults.setAchieved) {
                self.update();
                self.collection.defaults.fetchInProgress = false;
                self.collection.defaults.setAchieved = false;
            }

            if (self.collection.defaults.nullSet === true) {
                self.update();
                self.collection.defaults.fetchInProgress = false;
            }
        });
        this.collection.on('error', this.dataErrorMessage, this);

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

        // iterate through data and as novel service
        // names are located, attach the status at that
        // moment to that service name and don't reapply
        // it, as the next result is not the most recent.

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

    clearDataErrorMessage: function() {
        // if error message already exists on page,
        // remove it in case it has changed
        if ($(this.el).find('.popup-message').length) {
            $(this.el).find('.popup-message').fadeOut("slow");
        }
    },

    dataErrorMessage: function(message, errorMessage) {

        var self = this;

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        if (errorMessage !== undefined) {
            message = errorMessage.responseText;
            message = message.slice(1, -1);
            message = '' + errorMessage.status + ' error: ' + message;
        }

        // calling raiseAlert with the 3rd param will supress auto-hiding
        goldstone.raiseAlert($(this.el).find('.popup-message'), message, true);

        setTimeout(function() {
            self.collection.retrieveData();
        }, 30000);

        self.collection.defaults.nullSet = false;
        self.collection.defaults.fetchInProgress = false;
        self.collection.defaults.setAchieved = false;

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

        this.render();

        var allthelogs = this.collectionPrep();


        // refreshes every 30 seconds
        setTimeout(function() {
            self.collection.retrieveData();
        }, 30000);

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0 || self.collection.defaults.nullSet === true) {

            self.collection.defaults.nullSet = false;

            this.dataErrorMessage('No Data Returned');
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

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

        if ($(this.el).find('.mainContainer').length === 0) {
            this.$el.append(this.template());
            return this;
        } else {
            // remove hover listeners from service status nodes
            $(this.el).find('.mainContainer .toRemove').off();
            $(this.el).find('.mainContainer').empty();
        }

    },

    template: _.template('<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="mainContainer"></div>')

});
