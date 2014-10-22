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
        this.defaults.location = options.location;
        this.defaults.width = options.width;

        var ns = this.defaults;
        var self = this;

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(ns.location).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'display': ns.spinnerDisplay
            });
        });

        this.collection.on('sync', this.update, this);
    },

    update: function() {

        $(this.defaults.location).find('div.mainContainer').remove();

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(ns.location).find('#spinner').hide();

        var allTheLogs = this.collection.toJSON();

        if (allTheLogs.length === 0) {
            console.log('no data returned');
            return;
        }

        var classSelector = function(item) {
            if (item[0] === true) {
                return 'alert alert-success';
            }
            return 'alert alert-danger fa fa-exclamation-circle';
        };

        var nodeNames = [];

        _.each(allTheLogs, function(item) {
            nodeNames.push(item);
        });

        // this isn't a perfect sort of names + numbers,
        // but is a good start until we have actual
        // data to work with

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

        $(this.defaults.location).append("<div class='mainContainer'>");


        _.each(nodeNames, function(item, i) {
            $(this.defaults.location).find('.mainContainer').append('<div style="width: 100px; height: 22px; font-size:11px; margin-bottom: 0; text-align:center; padding: 3px 0;" class="col-xs-1 toRemove ' + classSelector(_.values(nodeNames[i])) + '"> ' + _.keys(nodeNames[i]) + '</div>');
        }, this);

        $(this.defaults.location).append('</div>');

        // refreshes every 10 seconds
        setTimeout(function() {
            self.collection.fetch();
        }, 10000);

    }


});
