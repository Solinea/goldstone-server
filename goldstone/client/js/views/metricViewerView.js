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
            self.getSidrOptions('div#sidr-menu-' + self.options.instance);
            $.sidr('close', 'sidr-menu-' + self.options.instance);
        });
        $('div#sidr-menu-' + this.options.instance).find('.sidr-cancel').on('click', function() {
            console.log('clicked cancel');
            $.sidr('close', 'sidr-menu-' + self.options.instance);
        });
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
        '<select>' +
        '<option value="all" selected>all</option>' +
        '<option value="">ctrl-01</option>' +
        '<option value="">rsrc-01</option>' +
        '<option value="">rsrc-02</option>' +
        '/<select>' +

        '<h2>Lookback</h2>' +
        '<select>' +
        '<option value="15m" selected>lookback 15m</option>' +
        '<option value="1h">lookback 1h</option>' +
        '<option value="6h">lookback 6h</option>' +
        '<option value="1d">lookback 1d</option>' +
        '/<select>' +

        '<h2>Charting Interval</h2>' +
        '<select>' +
        '<option value="1m" selected>1m</option>' +
        '<option value="1h">1h</option>' +
        '<option value="1d">1d</option>' +
        '/<select>' +

        // '<h2>Refresh</h2>' +
        // '<select>' +
        // '<option value="30" selected>30s</option>' +
        // '<option value="60">1m</option>' +
        // '<option value="300">5m</option>' +
        // '/<select>' +

        '<h2>Chart Type</h2>' +
        '<select>' +
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

    appendChart: function() {
        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron',
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: "Neutron API Performance",
            collection: this.neutronApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '.metric-chart-instance' + this.options.instance,
            width: $('.metric-chart-instance' + this.options.instance).width()
        });
    },

    render: function() {
        this.$el.html(this.template());
        var self = this;
        setTimeout(function() {
            self.appendChart();
        }, 500);

        return this;
    }

});
