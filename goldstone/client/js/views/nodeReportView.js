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

var NodeReportView = GoldstoneBasePageView.extend({

    defaults: {},

    initialize: function(options) {

        // options.node_uuid passed in during View instantiation
        this.node_uuid = options.node_uuid;

        // invoke the 'superclass'
        NodeReportView.__super__.initialize.apply(this, arguments);

        // and also invoke the local method initializeChartButtons();
        this.initializeChartButtons();
    },

    triggerChange: function() {

        var ns = this.defaults;

        // triggerChange event triggered by changing the global range selector
        // or by clicking on the (services|reports|events) tab buttons.

        if (this.visiblePanel.Services) {
            this.serviceStatusChartView.trigger('lookbackSelectorChanged');
            this.cpuUsageView.trigger('lookbackSelectorChanged');
            this.memoryUsageView.trigger('lookbackSelectorChanged');
            this.networkUsageView.trigger('lookbackSelectorChanged');
            this.hypervisorCoreView.trigger('lookbackSelectorChanged');
        }

        if (this.visiblePanel.Reports) {
            this.reportsReport.trigger('lookbackSelectorChanged');
        }

        if (this.visiblePanel.Events) {
            this.eventsReport.trigger('lookbackSelectorChanged');
        }

        if (this.visiblePanel.Logs) {
            this.computeLookback();
            this.logAnalysisView.trigger('lookbackSelectorChanged', [ns.start, ns.end]);
        }
    },

    computeLookback: function() {
        var ns = this.defaults;
        ns.end = +new Date();
        ns.start = ns.end - (ns.globalLookback * 60 * 1000);
    },

    setGlobalLookbackRefreshTriggers: function() {
        // sets listeners on global selectors

        var self = this;

        this.listenTo(app.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange();

            // changing the lookback also resets the setInterval counter
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(app.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();

            // reset the setInterval counter
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
    },

    // simple model to record which tab is currently visible
    visiblePanel: {
        Services: true,
        Reports: false,
        Events: false,
        Details: false,
        Logs: false
    },

    // function to toggle key in visiblePanel
    // to currently active tab
    flipVisiblePanel: function(selected) {
        var self = this;
        _.each(_.keys(self.visiblePanel), function(item) {
            if (item === selected) {
                self.visiblePanel[item] = true;
            } else {
                self.visiblePanel[item] = false;
            }
        });
    },

    initializeChartButtons: function() {
        var self = this;

        // initially hide the other tabs, displaying only 'Services'
        $("#reportsReport").hide();
        $("#eventsReport").hide();
        $("#detailsReport").hide();
        $("#logsReport").hide();

        // Initialize click listener on tab buttons
        $("button#headerBar").click(function() {

            // sets key corresponding to active tab to 'true'
            // on this.visiblePanel
            self.flipVisiblePanel($(this).context.innerHTML);

            // and triggers change
            self.triggerChange();

            // unstyle formerly 'active' button to appear 'unpressed'
            $("button#headerBar.active").toggleClass("active");

            // style 'active' button to appear 'pressed'
            $(this).toggleClass("active");

            // pass the textual content of button to _.each to
            // show/hide the correct report section
            var selectedButton = ($(this).context.innerHTML.toLowerCase());
            _.each($("button#headerBar"), function(item) {
                $("#node-report-panel").find('#' + item.innerHTML + 'Report').hide();
            });
            $("#node-report-panel").find('#' + selectedButton + 'Report').show();
        });
    },

    constructHostName: function(loc) {

        // example usage:
        // constructHostName(controller-01.lab.solinea.com) ===> controller-01
        // CAUTION:
        // if a node is keyed WITH a '.' in the name, api call
        // will return [], due to improper lookup

        locEnd = loc.slice(loc.lastIndexOf('/') + 1);
        if (locEnd.indexOf('.') === -1) {
            return locEnd;
        } else {
            return locEnd.slice(0, locEnd.indexOf('.'));
        }
    },

    renderCharts: function() {

        var ns = this.defaults;

        // ChartHeaderViews frame out chart header bars and populate info buttons

        new ChartHeaderView({
            el: '#service-status-title-bar',
            chartTitle: 'Service Status Report',
            infoText: 'serviceStatus',
            columns: 12
        });
        new ChartHeaderView({
            el: '#utilization-title-bar',
            chartTitle: 'Utilization',
            infoText: 'utilization',
            columns: 12
        });
        new ChartHeaderView({
            el: '#hypervisor-title-bar',
            chartTitle: 'Hypervisor',
            infoText: 'hypervisor',
            columns: 12
        });

        // construct api calls from url component
        // between the last '/' and the following '.'
        // IMPORTANT: see caveat on node naming in constructHostName function
        var hostName = this.constructHostName(location.href);

        //----------------------------
        // instantiate charts via
        // backbone collection / views

        //---------------------------
        // instantiate Service status chart
        this.serviceStatusChart = new ServiceStatusCollection({
            nodeName: hostName
        });

        this.serviceStatusChartView = new ServiceStatusView({
            collection: this.serviceStatusChart,
            el: '#node-report-main #node-report-r2',
            width: $('#node-report-main #node-report-r2').width(),
            globalLookback: ns.globalLookback
        });

        //---------------------------
        // instantiate CPU Usage chart
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

        //---------------------------
        // instantiate Memory Usage chart
        this.memoryUsageChart = new UtilizationMemCollection({
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        this.memoryUsageView = new UtilizationMemView({
            collection: this.memoryUsageChart,
            el: '#node-report-r3 #node-report-panel #memory-usage',
            width: $('#node-report-r3 #node-report-panel #memory-usage').width(),
            featureSet: 'memUsage'
        });

        //---------------------------
        // instantiate Network Usage chart

        this.networkUsageChart = new UtilizationNetCollection({
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        this.networkUsageView = new UtilizationNetView({
            collection: this.networkUsageChart,
            el: '#node-report-r3 #node-report-panel #network-usage',
            width: $('#node-report-r3 #node-report-panel #network-usage').width(),
            featureSet: 'netUsage'
        });

        //---------------------------
        // instantiate Libvirt core/vm chart
        this.hypervisorCoreChart = new HypervisorCollection({
            url: "/core/report_names?node=rsrc-02&timestamp__range={%27gte%27:1429203012258}",
            // url: "/api_perf/stats?start=111&end=112&interval=60s&component=nova",
            globalLookback: ns.globalLookback
        });

        this.hypervisorCoreView = new HypervisorView({
            collection: this.hypervisorCoreChart,
            el: '#node-report-r4 #node-report-panel #cores-usage',
            width: $('#node-report-r4 #node-report-panel #cores-usage').width(),
            axisLabel: "Cores"
        });


        //---------------------------
        // instantiate Libvirt mem/vm  chart
        this.hypervisorMemoryChart = new HypervisorCollection({
            url: "/core/report_names?node=rsrc-02&timestamp__range={%27gte%27:1429203012258}",
            // url: "/api_perf/stats?start=111&end=112&interval=60s&component=nova",
            globalLookback: ns.globalLookback
        });
        this.hypervisorMemoryView = new HypervisorView({
            collection: this.hypervisorMemoryChart,
            el: '#node-report-r4 #node-report-panel #memory-usage',
            width: $('#node-report-r4 #node-report-panel #memory-usage').width(),
            axisLabel: "GB"
        });

        //---------------------------
        // instantiate Libvirt top 10 CPU consumer VMs chart
        this.hypervisorVmCpuChart = new HypervisorVmCpuCollection({
            url: "/core/report_names?node=rsrc-02&timestamp__range={%27gte%27:1429203012258}",
            // url: "/api_perf/stats?start=111&end=112&interval=60s&component=nova",
            globalLookback: ns.globalLookback
        });

        this.hypervisorVmCpuView = new HypervisorVmCpuView({
            collection: this.hypervisorVmCpuChart,
            el: '#node-report-r4 #node-report-panel #vm-cpu-usage',
            width: $('#node-report-r4 #node-report-panel #vm-cpu-usage').width()
        });

        //---------------------------
        // instantiate Reports tab

        this.reportsReportCollection = new ReportsReportCollection({
            globalLookback: ns.globalLookback,
            nodeName: hostName
        });

        this.reportsReport = new ReportsReportView({
            collection: this.reportsReportCollection,
            el: '#node-report-panel #reportsReport',
            width: $('#node-report-panel #reportsReport').width(),
            nodeName: hostName
        });

        //---------------------------
        // instantiate Events tab

        this.eventsReport = new EventsReportView({
            el: '#node-report-panel #eventsReport',
            width: $('#node-report-panel #eventsReport').width(),
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        //---------------------------
        // instantiate Details tab

        this.detailsReport = new DetailsReportView({
            el: '#node-report-panel #detailsReport'
        });

        //---------------------------
        // instantiate Logs tab

        this.logsReportCollection = new LogAnalysisCollection({});

        this.logAnalysisView = new LogSearchView({
            collection: this.logAnalysisCollection,
            width: $('#logsReport').width(),
            height: 300,
            el: '#logsReport',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            specificHost: this.node_uuid,
            urlRoot: "/logging/summarize?",
        });
    },

    template: _.template('' +
        '<div id="node-report-r1" class="row">' +
        '<div id="node-report-r1-c1" class="col-md-12">' +
        '<h1><%= this.node_uuid %></h1>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-main" class="col-md-12">' +

        // buttons
        '<div class="btn-group" role="group">' +
        '<button type="button" id="headerBar" class="servicesButton active btn btn-default">Services</button>' +
        '<button type="button" id="headerBar" class="reportsButton btn btn-default">Reports</button>' +
        '<button type="button" id="headerBar" class="eventsButton btn btn-default">Events</button>' +
        '<button type="button" id="headerBar" class="detailsButton btn btn-default">Details</button>' +
        '<button type="button" id="headerBar" class="logsButton btn btn-default">Logs</button>' +
        '</div><br><br>' +

        '<div id="main-container" class="col-md-12">' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div id="servicesReport">' +

        // placeholder for title bar and info popover
        '<div id="service-status-title-bar"></div>' +
        '<div class="well col-md-12">' +
        '<div style="margin-left: 14px;" id="node-report-r2" class="row">' +
        '</div>' +
        '</div>' +
        '<div id="node-report-r3" class="row">' +
        '<div id="node-report-r3-c1" class="col-md-12">' +

        // placeholder for title bar and info popover
        '<div id="utilization-title-bar"></div>' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div class="well col-md-12">' +
        '<div class="col-md-4" id="cpu-usage">' +
        '<h4 class="text-center">CPU Usage</h4>' +
        '</div>' +
        '<div class="col-md-4" id="memory-usage">' +
        '<h4 class="text-center">Memory Usage</h4>' +
        '</div>' +
        '<div class="col-md-4" id="network-usage">' +
        '<h4 class="text-center">Network Usage</h4>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-r4" class="row">' +
        '<div id="node-report-r4-c1" class="col-md-12">' +

        // placeholder for title bar and info popover
        '<div id="hypervisor-title-bar"></div>' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div class="well col-md-12">' +
        '<div class="col-md-3 text-center" id="cores-usage">' +
        'Cores' +
        '</div>' +
        '<div class="col-md-3 text-center" id="memory-usage">' +
        'Memory' +
        '</div>' +
        '<div class="col-md-6" id="vm-cpu-usage">' +
        'Per VM CPU Usage' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="col-md-12" id="reportsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="eventsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="detailsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="logsReport">&nbsp;</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
