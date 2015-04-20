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

Instantiated on metricViewerPageView as:

this.metricViewerChart = new MetricViewerCollection1({});

// instance variables added in order to create a custom binding
// between each metricViewerChart and the associated sidr menus
this.metricViewerChartView = new MetricViewerView({
        collection: this.metricViewerChart1,
        width: $('#goldstone-metric-r1-c1').width(),
        height: $('#goldstone-metric-r1-c1').width(),
        instance: 1
});

*/

var MetricViewerView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options;
        this.processListeners();
        this.render();
        this.chartOptions = new Backbone.Model({});
    },

    processOptions: function() {},

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        // triggered whenever this.collection finishes fetching
        this.listenTo(this.collection, 'sync', function() {

            // clears existing 'Reports Available' in dropdown
            $('.metric-chart-instance' + this.options.instance).find('.metric-dropdown-options > option').remove();

            // if no reports available, appends 'No reports available'
            if (self.collection.toJSON() === undefined || self.collection.toJSON().length === 0) {

                return;
            } else {
                self.populateMetrics();
            }

            // after the dropdown is populated, have sidr
            // move the content to the hidden sidr div
            this.triggerSidr();
        });


    },
    triggerSidr: function() {
        var self = this;
        $('#menu-trigger' + this.options.instance).sidr({
            name: 'sidr-menu-' + this.options.instance,
            source: "#external-content" + this.options.instance,
            displace: true,
            renaming: false
        });

        // attach listeners to the now-hidden sidr menu
        $('div#sidr-menu-' + this.options.instance).find('.sidr-submit').on('click', function() {
            console.log('clicked submit', 'div#sidr-menu-' + self.options.instance);
            self.setChartOptions('div#sidr-menu-' + self.options.instance);
            $.sidr('close', 'sidr-menu-' + self.options.instance);
        });
        $('div#sidr-menu-' + this.options.instance).find('.sidr-cancel').on('click', function() {
            console.log('clicked cancel');
            $.sidr('close', 'sidr-menu-' + self.options.instance);
        });

        // chartOptions will be stored as a Backbone Model
        // and will be listenTo'd for changes which can
        // trigger the rendering of a new chart
        this.listenTo(this.chartOptions, 'change', function() {
            console.log('chart options changed');
            this.appendChart();
        });
    },

    setChartOptions: function(menu) {
        // if these options change, a 'change' event will
        // be emitted, otherwise it will submit silently
        this.chartOptions.set({
            'metric': $(menu).find('.metric-dropdown-options').val(),
            'resource': $(menu).find('.resource-dropdown-options').val(),
            'lookback': $(menu).find('.lookback-dropdown-options').val(),
            'interval': $(menu).find('.interval-dropdown-options').val(),
            'chartType': $(menu).find('.chart-type-dropdown-options').val()
        });

        console.log(this.chartOptions.attributes);
    },

    populateMetrics: function() {
        var self = this;

        _.each(self.collection.toJSON(), function(item) {
            $('#external-content' + self.options.instance).find('.metric-dropdown-options').append('<option>' + _.keys(item)[0] + "</option>");
        });
    },

    processMargins: function() {},

    standardInit: function() {},

    collectionPrep: function() {},

    dataErrorMessage: function(message, errorMessage) {

    },

    update: function() {},

    template: _.template(

        // formatting of hidden sidr menu:
        // hard coded for prototype
        // these options will have to be added programmatically
        '<div class="hidden" id="external-content<%= this.options.instance %>">' +

        '<h2>Metric</h2>' +
        '<select class="metric-dropdown-options">' +
        // populated by populateMetrics()
        '/<select>' +

        '<h2>Resource</h2>' +
        '<select class="resource-dropdown-options">' +
        '<option value="">all</option>' +
        '<option value="ctrl-01" selected>ctrl-01</option>' +
        '<option value="rsrc-01">rsrc-01</option>' +
        '<option value="rsrc-02">rsrc-02</option>' +
        '/<select>' +

        '<h2>Lookback</h2>' +
        '<select class="lookback-dropdown-options">' +
        '<option value="15" selected>lookback 15m</option>' +
        '<option value="60">lookback 1h</option>' +
        '<option value="360">lookback 6h</option>' +
        '<option value="1440">lookback 1d</option>' +
        '/<select>' +

        '<h2>Charting Interval</h2>' +
        '<select class="interval-dropdown-options">' +
        '<option value="1m" selected>1m</option>' +
        '<option value="1h">1h</option>' +
        '<option value="1d">1d</option>' +
        '/<select>' +

        // '<h2>Refresh</h2>' +
        // '<select class="refresh-dropdown-options">' +
        // '<option value="30" selected>30s</option>' +
        // '<option value="60">1m</option>' +
        // '<option value="300">5m</option>' +
        // '/<select>' +

        '<h2>Chart Type</h2>' +
        '<select class="chart-type-dropdown-options">' +
        '<option value="bar" selected>Bar Chart</option>' +
        '<option value="line">Line Chart</option>' +
        '/<select>' +

        '<button class="sidr-submit">Submit</button> ' +
        ' <button class="sidr-cancel">Cancel</button>' +

        '</div>' +

        // end hidden sidr menu options

        // add button that will be bound to $.sidr instance
        '<i id="menu-trigger<%= this.options.instance %>" class="fa fa-2x fa-bars"></i>' +

        // add div that will contain svg for d3 chart
        '<div class=metric-chart-instance<%= this.options.instance %> style="height:<%= this.options.height %>px;width:<%= this.options.width %>px;border:solid;">' +

        // '<div id="spinner"></div>' +
        '</div>'
    ),

    constructUrlFromParams: function() {
        var options = this.chartOptions.attributes;
        // http://127.0.0.1:8000/core/metrics?name__prefix=nova.hypervisor&@timestamp__range={"gte":1426887188000}
        console.log('options?', options);
        var url = '/core/metrics/summarize?name=' +
            options.metric + '&timestamp__range={"gte":' +
            (+new Date() - (options.lookback * 60 * 1000)) +
            '}&interval=' + options.interval;
        if(options.resource !== ''){
            url += '&node=' + options.resource;
        }
        console.log('constructed url: ', url);
        return url;
    },

    appendChart: function() {

        var url = this.constructUrlFromParams();

        if (this.metricChart) {
            this.metricChart.url = url;
            this.metricChart.fetchWithReset();
        } else {
            this.metricChart = new GoldstoneBaseCollection({
                url: url
            });

            this.metricChartView = new StackedBarChartView({
                chartTitle: "Metric Bar Chart",
                collection: this.metricChart,
                featureSet: 'metric',
                height: 300,
                // infoCustom: [{
                //     key: "API Call",
                //     value: "All"
                // }],
                el: '.metric-chart-instance' + this.options.instance,
                width: $('.metric-chart-instance' + this.options.instance).width(),
                yAxisLabel: ' '
            });
        }
    },

    render: function() {
        this.$el.html(this.template());
        var self = this;
        // setTimeout(function() {
        //     self.appendChart();
        // }, 500);

        return this;
    }

});
