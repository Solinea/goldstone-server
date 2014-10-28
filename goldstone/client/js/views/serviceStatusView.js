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

        this.collection.on('sync', this.update, this);
    },

    classSelector: function(item) {
        if (item[0] === true) {
            return 'alert alert-success';
        }
        return 'alert alert-danger fa fa-exclamation-circle';
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

        // refreshes every 10 seconds
        setTimeout(function() {
            self.collection.fetch();
        }, 5000);

        var allthelogs = this.collection.toJSON();

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0) {

            // if 'no data returned' already exists on page, don't reapply it
            if ($(this.el).find('#noDataReturned').length) {
                return;
            }

            $('<span id="noDataReturned">No Data Returned</span>').appendTo(this.el)
                .css({
                    'position': 'relative',
                    'margin-left': $(this.el).width() / 2 - 14,
                    'top': -$(this.el).height() / 2
                });
            return;
        }

        // remove No Data Returned once data starts flowing again
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }

        var nodeNames = [];

        _.each(allthelogs, function(item) {
            nodeNames.push(item);
        });

        nodeNames.sort(function(a, b) {
            if (Object.keys(a) < Object.keys(b)) {
                return -1;
            }
            if (Object.keys(a) > Object.keys(b)) {
                return 1;
            } else {
                return 0;
            }
        });

        _.each(nodeNames, function(item, i) {
            $(self.el).find('.mainContainer').append('<div style="width: 100px; height: 22px; font-size:11px; margin-bottom: 0; text-align:center; padding: 3px 0;" class="col-xs-1 toRemove ' + this.classSelector(_.values(nodeNames[i])) + '"> ' + _.keys(nodeNames[i]) + '</div>');
        }, this);
    },

    render: function() {

        if ($(this.el).find('.mainContainer').length === 0) {
            this.$el.append(this.template());
            return this;
        } else {
            $(this.el).find('.mainContainer').empty();
        }

    },

    template: _.template("<div class='mainContainer'></div>")

});
