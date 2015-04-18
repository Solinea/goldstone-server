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
NOTE: This Backbone View is a "superClass" that is extended to at least 2 other chart-types at the time of this documentation.

The method of individuating charts that have particular individual requirements is to instantiate them with the 'featureSet' property within the options hash.

Instantiated on nodeReportView as:

this.cpuUsageChart = new UtilizationCpuCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.cpuUsageView = new UtilizationCpuView({
    collection: this.cpuUsageChart,
    el: '#node-report-r3 #node-report-panel #cpu-usage',
    width: $('#node-report-r3 #node-report-panel #cpu-usage').width(),
    featureSet: 'cpuUsage'
});
*/

var MetricViewerView = GoldstoneBaseView.extend({

    defaults: {
        margin: {}
    },

    initialize: function(options) {
        this.options = options;
        console.log(this.options);
    },

    processOptions: function() {},

    processListeners: function() {},

    processMargins: function() {},

    standardInit: function() {},

    collectionPrep: function() {},

    dataErrorMessage: function(message, errorMessage) {

    },

    update: function() {
        console.log('update triggered');
    },

    template: _.template(
        '<div class="outer" style="border:solid;height:300px">' +
        // '<div class="alert alert-danger popup-message" hidden="true"></div>' +


        '<div class="col-xs-6 col-sm-3 sidebar-offcanvas" id="sidebar">' +
        '<div class="list-group">' +
        '<a href="#/metric" class="list-group-item active">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '<a href="#/metric" class="list-group-item">Link</a>' +
        '</div>' +
        '</div>' +


        '<div class="stuff" style="background-color:red;margin-top:5px;display:inline-block;vertical-align:top;border:solid;width:50px;height:<%= this.options.height - 20 %>px"></div>'

        // '<input class="menu-trigger" type="button" value="Menu">' +

    ),

    render: function() {
        this.$el.html(this.template());

        $('[data-toggle="offcanvas"]').click(function() {
            $('.row-offcanvas').toggleClass('active');
        });

        // var jPM = $.jPanelMenu({
        //     // clone: false,
        //     panel: '.wrap',
        //     // menu: '#menu',
        //     trigger: '.stuff',
        //     // animated: true
        // });

        // jPM.on();

        return this;
    }

});
