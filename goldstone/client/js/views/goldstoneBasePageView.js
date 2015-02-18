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
The GoldstoneBasePageView is a 'superclass' page view that can be instantiated
via the $(document).ready() on a django HTML tempate.

It sets up listeners that are triggered by changes to the global lookback and
refresh selectors at the top of the page. And a timing loop that
responds to changes to the 'refresh' selector, or can be cancelled by
selecting "refresh off"

Note: the values and default settings of the global lookback and refresh
selectors can be customized on the page's correspoinding django HTML template,
by modifying the parameters of the globalLookbackRefreshButtonsView
*/

var GoldstoneBasePageView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.globalLookback = null;
        this.defaults.globalRefresh = null;

        this.render();
        this.getGlobalLookbackRefresh();
        this.renderCharts();
        this.setGlobalLookbackRefreshTriggers();
        this.scheduleInterval();
    },

    clearScheduledInterval: function() {
        var ns = this.defaults;
        clearInterval(ns.scheduleInterval);
    },

    scheduleInterval: function() {
        var self = this;
        var ns = this.defaults;

        var intervalDelay = ns.globalRefresh * 1000;

        // the value of the global refresh selector "refresh off" = -1
        if (intervalDelay < 0) {
            return true;
        }

        ns.scheduleInterval = setInterval(function() {
            self.triggerChange('lookbackIntervalReached');
        }, intervalDelay);
    },

    getGlobalLookbackRefresh: function() {
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.defaults.globalRefresh = $('#global-refresh-range').val();
    },

    // TODO: add different trigger for global refresh selector
    // as it will be needed for the eventTimelineView in
    // setGlobalLookbackListeners

    triggerChange: function(change) {},

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listeners between global selectors and charts
        // change listeners for global selectors
        $('#global-lookback-range').on('change', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        $('#global-refresh-range').on('change', function() {
            self.getGlobalLookbackRefresh();
            self.clearScheduledInterval();
            self.scheduleInterval();
            self.triggerChange('refreshSelectorChanged');
        });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    renderCharts: function() {

        // var ns = this.defaults;

        // //----------------------------
        // // instantiate charts via
        // // backbone collection / views


        // //---------------------------
        // // instantiate nova api chart

        // this.novaApiPerfChart = new ApiPerfCollection({
        //     urlPrefix: 'nova',
        // });

        // this.novaApiPerfChartView = new ApiPerfView({
        //     chartTitle: "Nova API Performance",
        //     collection: this.novaApiPerfChart,
        //     height: 300,
        //     infoCustom: [{
        //         key: "API Call",
        //         value: "Hypervisor Show"
        //     }],
        //     el: '#api-perf-report-r1-c1',
        //     width: $('#api-perf-report-r1-c1').width()
        // });


        // //------------------------------
        // // instantiate neutron api chart

        // this.neutronApiPerfChart = new ApiPerfCollection({
        //     urlPrefix: 'neutron',
        // });

        // this.neutronApiPerfChartView = new ApiPerfView({
        //     chartTitle: "Neutron API Performance",
        //     collection: this.neutronApiPerfChart,
        //     height: 300,
        //     infoCustom: [{
        //         key: "API Call",
        //         value: "Agent List"
        //     }],
        //     el: '#api-perf-report-r1-c2',
        //     width: $('#api-perf-report-r1-c2').width()
        // });

        // //-------------------------------
        // // instantiate keystone api chart

        // this.keystoneApiPerfChart = new ApiPerfCollection({
        //     urlPrefix: 'keystone',
        // });

        // this.keystoneApiPerfChartView = new ApiPerfView({
        //     chartTitle: "Keystone API Performance",
        //     collection: this.keystoneApiPerfChart,
        //     height: 300,
        //     infoCustom: [{
        //         key: "API Call",
        //         value: "Authenticate"
        //     }],
        //     el: '#api-perf-report-r2-c1',
        //     width: $('#api-perf-report-r2-c1').width()
        // });

        // //-----------------------------
        // // instantiate glance api chart

        // this.glanceApiPerfChart = new ApiPerfCollection({
        //     urlPrefix: 'glance',
        // });

        // this.glanceApiPerfChartView = new ApiPerfView({
        //     chartTitle: "Glance API Performance",
        //     collection: this.glanceApiPerfChart,
        //     height: 300,
        //     infoCustom: [{
        //         key: "API Call",
        //         value: "Image Show"
        //     }],
        //     el: '#api-perf-report-r2-c2',
        //     width: $('#api-perf-report-r2-c2').width()
        // });

        // //-----------------------------
        // // instantiate cinder api chart

        // this.cinderApiPerfChart = new ApiPerfCollection({
        //     urlPrefix: 'cinder',
        // });

        // this.cinderApiPerfChartView = new ApiPerfView({
        //     chartTitle: "Cinder API Performance",
        //     collection: this.cinderApiPerfChart,
        //     height: 300,
        //     infoCustom: [{
        //         key: "API Call",
        //         value: "Service List"
        //     }],
        //     el: '#api-perf-report-r3-c1',
        //     width: $('#api-perf-report-r3-c1').width()
        // });


    },

    template: _.template('')

});
