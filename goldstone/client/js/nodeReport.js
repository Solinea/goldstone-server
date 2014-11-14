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

var renderCharts = function() {

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
        width: $('#node-report-main #node-report-r2').width()
    });

    //---------------------------
    // instantiate CPU Usage chart
    var cpuUsageChart = new UtilizationCpuCollection({
        nodeName: hostName
    });

    var cpuUsageView = new UtilizationCpuView({
        collection: cpuUsageChart,
        el: '#node-report-r3 #node-report-panel #cpu-usage',
        width: $('#node-report-r3 #node-report-panel #cpu-usage').width()
    });

    //---------------------------
    // instantiate Memory Usage chart
    var memoryUsageChart = new UtilizationMemCollection({
        nodeName: hostName
    });

    var memoryUsageView = new UtilizationMemView({
        collection: memoryUsageChart,
        el: '#node-report-r3 #node-report-panel #memory-usage',
        width: $('#node-report-r3 #node-report-panel #memory-usage').width()
    });

    //---------------------------
    // instantiate Network Usage chart

    var networkUsageChart = new UtilizationNetCollection({
        nodeName: hostName
    });

    var networkUsageView = new UtilizationNetView({
        collection: networkUsageChart,
        el: '#node-report-r3 #node-report-panel #network-usage',
        width: $('#node-report-r3 #node-report-panel #network-usage').width()
    });

    //---------------------------
    // instantiate Libvirt core/vm chart
    var hypervisorCoreChart = new HypervisorCollection({
        url: "/glance/api_perf?start=111&end=112&interval=3600s&render=false"
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
        url: "/glance/api_perf?start=111&end=112&interval=3600s&render=false"
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
        url: "/glance/api_perf?start=111&end=112&interval=3600s&render=false"
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
        nodeName: hostName
    });

    //---------------------------
    // instantiate Events tab data

    var eventsReport = new EventsReportView({
        el: '#node-report-panel #eventsReport',
        width: $('#node-report-panel #eventsReport').width(),
        nodeName: hostName
    });
};
