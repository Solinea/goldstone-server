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

var NodeReportView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.node_uuid = options.node_uuid;
        this.defaults.globalLookback = null;
        this.defaults.globalRefresh = null;

        var ns = this.defaults;
        var self = this;

        this.render();
        this.initializeChartButtons();
        this.getGlobalLookbackRefresh();
        this.renderCharts();
    },

    getGlobalLookbackRefresh: function() {
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.defaults.globalRefresh = $('#global-refresh-range').val();
    },

    initializeChartButtons: function() {
        $("#reportsReport").hide();
        $("#eventsReport").hide();
        $("button#headerBar").click(function() {
            $("button#headerBar.active").toggleClass("active");
            $(this).toggleClass("active");
            var selectedButton = ($(this).context.innerHTML.toLowerCase());
            _.each($("button#headerBar"), function(item) {
                $("#node-report-panel").find('#' + item.innerHTML + 'Report').hide();
            });
            $("#node-report-panel").find('#' + selectedButton + 'Report').show();
        });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    renderCharts: function() {

        var ns = this.defaults;

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
        var loc = location.pathname;
        locEnd = loc.slice(loc.lastIndexOf('/') + 1);
        var hostName = locEnd.slice(0, locEnd.indexOf('.'));

        //----------------------------
        // instantiate charts via
        // backbone collection / views

        //---------------------------
        // instantiate Service status chart
        var serviceStatusChart = new ServiceStatusCollection({
            nodeName: hostName
        });

        var serviceStatusChartView = new ServiceStatusView({
            collection: serviceStatusChart,
            el: '#node-report-main #node-report-r2',
            width: $('#node-report-main #node-report-r2').width(),
            globalLookback: ns.globalLookback
        });

        //---------------------------
        // instantiate CPU Usage chart
        var cpuUsageChart = new UtilizationCpuCollection({
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        var cpuUsageView = new UtilizationCpuView({
            collection: cpuUsageChart,
            el: '#node-report-r3 #node-report-panel #cpu-usage',
            width: $('#node-report-r3 #node-report-panel #cpu-usage').width()
        });

        //---------------------------
        // instantiate Memory Usage chart
        var memoryUsageChart = new UtilizationMemCollection({
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        var memoryUsageView = new UtilizationMemView({
            collection: memoryUsageChart,
            el: '#node-report-r3 #node-report-panel #memory-usage',
            width: $('#node-report-r3 #node-report-panel #memory-usage').width()
        });

        //---------------------------
        // instantiate Network Usage chart

        var networkUsageChart = new UtilizationNetCollection({
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        var networkUsageView = new UtilizationNetView({
            collection: networkUsageChart,
            el: '#node-report-r3 #node-report-panel #network-usage',
            width: $('#node-report-r3 #node-report-panel #network-usage').width()
        });

        //---------------------------
        // instantiate Libvirt core/vm chart
        var hypervisorCoreChart = new HypervisorCollection({
            url: "/glance/api_perf?start=111&end=112&interval=3600s&render=false",
            globalLookback: ns.globalLookback
        });

        var hypervisorCoreView = new HypervisorView({
            collection: hypervisorCoreChart,
            el: '#node-report-r4 #node-report-panel #cores-usage',
            width: $('#node-report-r4 #node-report-panel #cores-usage').width(),
            axisLabel: "Cores"
        });


        //---------------------------
        // instantiate Libvirt mem/vm  chart
        var hypervisorMemoryChart = new HypervisorCollection({
            url: "/glance/api_perf?start=111&end=112&interval=3600s&render=false",
            globalLookback: ns.globalLookback
        });
        var hypervisorMemoryView = new HypervisorView({
            collection: hypervisorMemoryChart,
            el: '#node-report-r4 #node-report-panel #memory-usage',
            width: $('#node-report-r4 #node-report-panel #memory-usage').width(),
            axisLabel: "GB"
        });

        //---------------------------
        // instantiate Libvirt top 10 CPU consumer VMs chart
        var hypervisorVmCpuChart = new HypervisorVmCpuCollection({
            url: "/glance/api_perf?start=111&end=112&interval=3600s&render=false",
            globalLookback: ns.globalLookback
        });

        var hypervisorVmCpuView = new HypervisorVmCpuView({
            collection: hypervisorVmCpuChart,
            el: '#node-report-r4 #node-report-panel #vm-cpu-usage',
            width: $('#node-report-r4 #node-report-panel #vm-cpu-usage').width()
        });

        //---------------------------
        // instantiate Reports tab data

        var reportsReport = new ReportsReportView({
            el: '#node-report-panel #reportsReport',
            width: $('#node-report-panel #reportsReport').width(),
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        //---------------------------
        // instantiate Events tab data

        var eventsReport = new EventsReportView({
            el: '#node-report-panel #eventsReport',
            width: $('#node-report-panel #eventsReport').width(),
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });



        //----------------------------
        // wire up listeners between global selectors and charts

        var triggerChange = function() {
            cpuUsageView.trigger('selectorChanged');
            memoryUsageView.trigger('selectorChanged');
            networkUsageView.trigger('selectorChanged');
            eventsReport.trigger('selectorChanged');
        };
        // change listeners for global selectors
        $('#global-refresh-range').on('change', function() {
            triggerChange();
        });
        $('#global-lookback-range').on('change', function() {
            triggerChange();
        });
    },

    template: _.template('' +
        '<div id="node-report-r1" class="row">' +
        '<div id="node-report-r1-c1" class="col-md-12">' +
        '<h1><%= node_uuid %></h1>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-main" class="col-md-12">' +

        '<!-- buttons -->' +
        '<div class="btn-group">' +
        '<button type="button" id="headerBar" class="servicesButton active btn ' + 'btn-default">Services</button>' +
        '<button type="button" id="headerBar" class="reportsButton btn btn-' + 'default">Reports</button>' +
        '<button type="button" id="headerBar" class="eventsButton btn btn-' + 'default">Events</button><br><br>' +
        '</div>' +

        '<div id="main-container" class="col-md-12">' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div id="servicesReport">' +

        '<!-- placeholder for title bar and info popover -->' +
        '<div id="service-status-title-bar"></div>' +
        '<div style="margin-left: 14px;" id="node-report-r2" class="row">' +
        '</div>' +
        '<div id="node-report-r3" class="row">' +
        '<div id="node-report-r3-c1" class="col-md-12">' +

        '<!-- placeholder for title bar and info popover -->' +
        '<div id="utilization-title-bar"></div>' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div class="well col-md-4" id="cpu-usage">' +
        '<h4 class="text-center">CPU Usage</h4>' +
        '</div>' +
        '<div class="well col-md-4" id="memory-usage">' +
        '<h4 class="text-center">Memory Usage</h4>' +
        '</div>' +
        '<div class="well col-md-4" id="network-usage">' +
        '<h4 class="text-center">Network Usage</h4>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-r4" class="row">' +
        '<div id="node-report-r4-c1" class="col-md-12">' +

        '<!-- placeholder for title bar and info popover -->' +
        '<div id="hypervisor-title-bar"></div>' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div class="well col-md-3 text-center" id="cores-usage">' +
        'Cores' +
        '</div>' +
        '<div class="well col-md-3 text-center" id="memory-usage">' +
        'Memory' +
        '</div>' +
        '<div class="well col-md-6" id="vm-cpu-usage">' +
        'Per VM CPU Usage' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="col-md-12" id="reportsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="eventsReport">&nbsp;</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
