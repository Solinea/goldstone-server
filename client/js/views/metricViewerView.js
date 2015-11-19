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
instance variable added to options hash in order to
create a custom binding between each metricViewerChart
and the associated modal menus

Instantiated on metricViewerPageView as:

this.metricViewerChartView = new MetricViewerView({
        width: $('#goldstone-metric-r1-c1').width(),
        height: $('#goldstone-metric-r1-c1').width(),
        instance: xxx
});

*/

var MetricViewerView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options;
        this.processListeners();
        this.render();
        this.chartOptions = new Backbone.Model({});
        this.getMetricNames();
        this.getResourceNames();
    },

    getResourceNames: function() {
        var ns = this.defaults;
        var self = this;

        // 'host_name' will be extracted from the returned array of host objects
        $.get("/nova/hosts/", function() {})
            .done(function(data) {
                if (data === undefined || data.length === 0) {
                    $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-text').text(' ' + goldstone.contextTranslate('No resources returned', 'metricviewer'));
                } else {
                    ns.resourceNames = data[0];
                    self.populateResources();
                }
            })
            .fail(function() {
                $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-text').text(' Resource name fetch failed');
            });
    },

    getMetricNames: function() {
        var ns = this.defaults;
        var self = this;

        $.get("/core/metric_names/", function() {})
            .done(function(data) {
                data = data.per_name;
                if (data === undefined || data.length === 0) {
                    $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-text').text(' ' + goldstone.contextTranslate('No metric reports available', 'metricviewer'));
                } else {
                    ns.metricNames = data;
                    self.populateMetrics();
                }
            })
            .fail(function() {
                $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-text').text(' ' + goldstone.contextTranslate('Metric report list fetch failed', 'metricviewer'));
            })
            .always(function() {
                self.attachModalTriggers();
            });
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.listenTo(this, 'globalLookbackReached', function() {
            if (this.metricChart) {
                this.appendChart();
            }
        });
    },

    attachModalTriggers: function() {
        var self = this;

        // attach listener to the modal submit button
        $('#gear-modal-content' + this.options.instance).find('.modal-submit').on('click', function() {

            // on submit --> update the chartOptions Model
            self.setChartOptions('#gear-modal-content' + self.options.instance);

            // and append the metric name and resource to the chart header
            $('span.metric-viewer-title' + self.options.instance).text(goldstone.contextTranslate('Metric', 'metricviewer') + ': ' +
                self.chartOptions.get('metric') +
                '.' + goldstone.contextTranslate('Resource', 'metricviewer') + ': ' +
                self.chartOptions.get('resource'));
        });

        // chartOptions will be stored as a Backbone Model
        // and will be listenTo'd for changes which can
        // trigger the rendering of a new chart
        this.listenTo(this.chartOptions, 'change', function() {
            this.appendChart();
        });
    },

    setChartOptions: function(menu) {

        // if these options change, a 'change' event will
        // be emitted by the Backbone Model and picked up
        // by the listener in this.attachModalTriggers
        // otherwise it will be ignored
        this.chartOptions.set({
            'metric': $(menu).find('.metric-dropdown-options').val(),
            'resource': $(menu).find('.resource-dropdown-options').val(),
            'statistic': $(menu).find('.statistic-dropdown-options').val(),
            'standardDev': $(menu).find('.standard-dev:checked').length,
            'lookbackValue': $(menu).find('.modal-lookback-value').val(),
            'lookbackUnit': $(menu).find('.lookback-dropdown-options').val(),
            'intervalValue': $(menu).find('.modal-interval-value').val(),
            'intervalUnit': $(menu).find('.interval-dropdown-options').val()
        });
    },

    populateMetrics: function() {
        var self = this;
        var ns = this.defaults;

        // clear the 'loading' text next to the dropdown
        $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-text').text('');

        // append the options within the dropdown
        _.each(ns.metricNames, function(item) {
            $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-options').append('<option>' + _.keys(item)[0] + "</option>");
        });
    },

    populateResources: function() {
        var self = this;
        var ns = this.defaults;

        // clear the 'loading' text next to the dropdown
        $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-text').text('');

        // host names will be similar to: ctrl-01.c2.oak.solinea.com
        // so slice from the beginning up to the first '.'
        var resourceNames = _.uniq(_.map(ns.resourceNames, function(item) {
            return (item.host_name).slice(0, item.host_name.indexOf('.'));
        }));

        // add 'all' to the beginning of the array of resources which will
        // be appended as the first drop-down option
        resourceNames.unshift('all');

        // append the options within the dropdown
        _.each(resourceNames, function(item) {
            $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-options').append('<option value="' + item + '">' + item + "</option>");
        });
    },

    constructUrlFromParams: function() {
        // chartOptions is a backbone Model instantiated in initialize:
        var options = this.chartOptions.attributes;

        // set minimum interval to 2 minutes to correct for jagged visualization
        if (options.intervalUnit === 'm') {
            options.intervalValue = Math.max(2, options.intervalValue);
        }

        var url = '/core/metrics/summarize/?name=' +
            options.metric + '&@timestamp__range={"gte":' +
            (+new Date() - (options.lookbackValue * options.lookbackUnit * 1000)) +
            '}&interval=' +
            options.intervalValue +
            options.intervalUnit;
        if (options.resource !== 'all') {
            url += '&node=' + options.resource;
        }
        return url;

        /*
            constructs a url similar to:
            /core/metrics/summarize/?name=os.cpu.user
            &@timestamp__range={'gte':1429649259172}&interval=1m
        */

    },

    appendChart: function() {

        var url = this.constructUrlFromParams();
        // if there is already a chart populating this div:
        if (this.metricChart) {
            this.metricChart.url = url;
            this.metricChart.statistic = this.chartOptions.get('statistic');
            this.metricChart.standardDev = this.chartOptions.get('standardDev');
            $(this.metricChartView.el).find('#spinner').show();
            this.metricChart.fetchWithReset();
        } else {
            this.metricChart = new MetricViewCollection({
                statistic: this.chartOptions.get('statistic'),
                url: url,
                standardDev: this.chartOptions.get('standardDev')
            });
            this.metricChartView = new MetricView({
                collection: this.metricChart,
                height: 320,
                el: '.metric-chart-instance' + this.options.instance,
                width: $('.metric-chart-instance' + this.options.instance).width()
            });
        }
    },

    render: function() {
        this.$el.html(this.template());
        var self = this;
        return this;
    },

    template: _.template(

        //-----------------------
        // START MODAL FORMATTING

        '<div class="modal fade" id="modal-filter-<%= this.options.instance %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div id="gear-modal-content<%= this.options.instance %>">' +

        '<div class="modal-header">' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Select chart parameters\', \'metricviewer\')%></h4>' +
        '</div>' + // end modal-header

        '<div class="modal-body">' +
        '<h5><%=goldstone.contextTranslate(\'Metric\', \'metricviewer\')%></h5>' +
        '<select class="metric-dropdown-options">' +
        // options will be populated by populateMetrics()
        '</select>' +

        // loading text will be removed when options are populated
        '<span class="metric-dropdown-text"> Loading...</span>' +

        // loading text will be removed when options are populated
        '<h5><%=goldstone.contextTranslate(\'Resource\', \'metricviewer\')%></h5>' +
        '<select class="resource-dropdown-options">' +
        // options will be populated by populateMetrics()
        '</select>' +
        '<span class="resource-dropdown-text"> Loading...</span>' +

        '<h5><%=goldstone.contextTranslate(\'Statistic\', \'metricviewer\')%></h5>' +
        '<select class="statistic-dropdown-options">' +
        '<option value="band" selected><%=goldstone.contextTranslate(\'band\', \'metricviewer\')%></option>' +
        '<option value="min"><%=goldstone.contextTranslate(\'min\', \'metricviewer\')%></option>' +
        '<option value="max"><%=goldstone.contextTranslate(\'max\', \'metricviewer\')%></option>' +
        '<option value="avg"><%=goldstone.contextTranslate(\'avg\', \'metricviewer\')%></option>' +
        '</select>' +

        '<h5><%=goldstone.translate(\'Standard Deviation Bands\')%> <input class="standard-dev" type="checkbox"></h5>' +

        // ES can handle s/m/h/d in the "interval" param
        '<h5><%=goldstone.contextTranslate(\'Lookback\', \'metricviewer\')%></h5>' +
        '<input type="number" min="1" step="1" class="modal-lookback-value" value="1" required>' + ' ' +
        '<select class="lookback-dropdown-options">' +
        '<option value="60"><%=goldstone.contextTranslate(\'minutes\', \'metricviewer\')%></option>' +
        '<option value="3600" selected><%=goldstone.contextTranslate(\'hours\', \'metricviewer\')%></option>' +
        '<option value="86400"><%=goldstone.contextTranslate(\'days\', \'metricviewer\')%></option>' +
        '</select>' +

        // ES can handle s/m/h/d in the "interval" param
        '<h5><%=goldstone.contextTranslate(\'Charting Interval (minimum 2 minutes)\', \'metricviewer\')%></h5>' +
        '<input type="number" min="1" step="1" class="modal-interval-value" value="2" required>' + ' ' +
        '<select class="interval-dropdown-options">' +
        '<option value="m" selected><%=goldstone.contextTranslate(\'minutes\', \'metricviewer\')%></option>' +
        '<option value="h"><%=goldstone.contextTranslate(\'hours\', \'metricviewer\')%></option>' +
        '<option value="d"><%=goldstone.contextTranslate(\'days\', \'metricviewer\')%></option>' +
        '</select>' +

        '</div>' + // end modal-body

        '<div class="modal-footer">' +
        '<button data-dismiss="modal" class="pull-left btn btn-primary modal-submit"><%=goldstone.contextTranslate(\'Submit\', \'metricviewer\')%></button> ' +
        '<button data-dismiss="modal" class="pull-left btn btn-primary modal-cancel"><%=goldstone.contextTranslate(\'Cancel\', \'metricviewer\')%></button>' +
        '</div>' + // end modal-footer

        '</div>' + // end gear-modal-content

        '</div>' + // end modal-content
        '</div>' + // end modal-dialog
        '</div>' + // end modal


        // END MODAL FORMATTING
        //---------------------


        // start visible page elements
        // add trigger that will reveal modal

        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><span class="metric-viewer-title<%= this.options.instance %>"><%=goldstone.contextTranslate(\'Click gear for config\', \'metricviewer\')%></span>' +
        '<i id="menu-trigger<%= this.options.instance %>" class="pull-right fa fa-gear" data-toggle="modal" data-target="#modal-filter-<%= this.options.instance %>" ></i>' +
        '</h3></div>' +

        // add div that will contain svg for d3 chart
        '<div class="well metric-chart-instance<%= this.options.instance %>" style="height:<%= this.options.height %>px;width:<%= this.options.width %>px;">' +
        '</div>'
    )

});
