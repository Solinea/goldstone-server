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

instance variable added to options hash in order to
create a custom binding between each metricViewerChart
and the associated modal menus

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

            if (self.collection.toJSON() === undefined || self.collection.toJSON().length === 0) {
                return;
            } else {
                self.populateMetrics();
            }

            // after the dropdown is populated,
            // attache button listeners
            this.attachModalTriggers();
        });


    },
    attachModalTriggers: function() {
        var self = this;

        // attach listeners to the modal menu buttons
        $('#gear-modal-content' + this.options.instance).find('.modal-submit').on('click', function() {
            self.setChartOptions('#gear-modal-content' + self.options.instance);
            $('span.metric-viewer-title' + self.options.instance).text('Metric: ' +
                self.chartOptions.get('metric') +
                '. Resource: ' +
                self.chartOptions.get('resource'));
        });
        $('#gear-modal-content' + this.options.instance).find('.modal-cancel').on('click', function() {});

        // chartOptions will be stored as a Backbone Model
        // and will be listenTo'd for changes which can
        // trigger the rendering of a new chart
        this.listenTo(this.chartOptions, 'change', function() {
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

    },

    populateMetrics: function() {
        var self = this;

        _.each(self.collection.toJSON(), function(item) {
            $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-options').append('<option>' + _.keys(item)[0] + "</option>");
        });
    },

    processMargins: function() {},

    standardInit: function() {},

    collectionPrep: function() {},

    dataErrorMessage: function(message, errorMessage) {

    },

    update: function() {},

    template: _.template(


        '<div class="modal fade" id="modal-filter-<%= this.options.instance %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div id="gear-modal-content<%= this.options.instance %>">' +

        '<div class="modal-body">' +
        '<h5>Metric</h5>' +
        '<select class="metric-dropdown-options">' +
        // populated by populateMetrics()
        '</select>' +

        '<h5>Resource</h5>' +
        '<select class="resource-dropdown-options">' +
        '<option value="all" selected>all</option>' +
        '<option value="ctrl-01">ctrl-01</option>' +
        '<option value="rsrc-01">rsrc-01</option>' +
        '<option value="rsrc-02">rsrc-02</option>' +
        '</select>' +

        '<h5>Lookback</h5>' +
        '<select class="lookback-dropdown-options">' +
        '<option value="15" selected>lookback 15m</option>' +
        '<option value="60">lookback 1h</option>' +
        '<option value="360">lookback 6h</option>' +
        '<option value="1440">lookback 1d</option>' +
        '</select>' +

        '<h5>Charting Interval</h5>' +
        '<select class="interval-dropdown-options">' +
        '<option value="1m" selected>1m</option>' +
        '<option value="1h">1h</option>' +
        '<option value="1d">1d</option>' +
        '</select>' +

        // '<h5>Chart Type</h5>' +
        // '<select class="chart-type-dropdown-options">' +
        // '<option value="bar" selected>Bar Chart</option>' +
        // '<option value="line">Line Chart</option>' +
        // '</select>'+

        '<br><br>' +
        '</div>' +

        '<div class="modal-footer">' +
        '<button data-dismiss="modal" class="btn btn-primary modal-submit">Submit</button> ' +
        ' <button data-dismiss="modal" class="btn btn-primary modal-cancel">Cancel</button>' +
        '</div>' +

        '</div>' +

        '</div>' +
        '</div>' +
        '</div>' +

        // end modal

        // start visible page elements
        // add trigger that will reveal modal

        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><span class="metric-viewer-title<%= this.options.instance %>">Click gear for config</span>' +
        '<i id="menu-trigger<%= this.options.instance %>" class="pull-right fa fa-gear" data-toggle="modal" data-target="#modal-filter-<%= this.options.instance %>" ></i>' +
        '</h3></div>' +

        // add div that will contain svg for d3 chart
        '<div class="well metric-chart-instance<%= this.options.instance %>" style="height:<%= this.options.height %>px;width:<%= this.options.width %>px;">' +
        '</div>'
    ),

    constructUrlFromParams: function() {
        var options = this.chartOptions.attributes;
        // http://127.0.0.1:8000/core/metrics?name__prefix=nova.hypervisor&@timestamp__range={"gte":1426887188000}
        var url = '/core/metrics/summarize?name=' +
            options.metric + '&timestamp__range={"gte":' +
            (+new Date() - (options.lookback * 60 * 1000)) +
            '}&interval=' + options.interval;
        if (options.resource !== 'all') {
            url += '&node=' + options.resource;
        }
        return url;
    },

    appendChart: function() {

        var url = this.constructUrlFromParams();

        if (this.metricChart) {
            this.metricChart.url = url;
            $(this.metricChartView.el).find('#spinner').show();
            this.metricChart.fetchWithReset();
        } else {
            this.metricChart = new GoldstoneBaseCollection({
                url: url
            });

            this.metricChartView = new MetricView({
                supressHeader: true,
                chartTitle: " ",
                collection: this.metricChart,
                height: 320,
                // infoCustom: [{
                //     key: "API Call",
                //     value: "All"
                // }],
                el: '.metric-chart-instance' + this.options.instance,
                width: $('.metric-chart-instance' + this.options.instance).width()
            });
        }
    },

    render: function() {
        this.$el.html(this.template());
        var self = this;
        return this;
    }

});
