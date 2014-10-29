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

var ReportsReportView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
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

        this.render();
    },

    render: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';

        $(ns.location).find('#spinner').hide();

        if (localStorage.getItem('reportNodeData') === null) {

            $(ns.location).append("<div class='mainContainer'>No Reports Data</div>")
                .css({
                    'position': 'relative',
                    'margin-left': (ns.width / 2 - 50),
                });

            return;
        }

        if (localStorage.getItem('reportNodeData')) {

            var configDataToRender = JSON.parse(localStorage.getItem('reportNodeData'));

            _.each(_.keys(configDataToRender), function(item) {
                $(ns.location).append(item + ": " + configDataToRender[item] + "<br>");

            localStorage.clear();
            });

        }



    }


});
