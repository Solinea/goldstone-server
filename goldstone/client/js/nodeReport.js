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
 * Author: John Stanford
 */

var renderCharts = function() {

    //----------------------------
    // instantiate charts via
    // backbone collection / views

    //---------------------------
    // instantiate Service status chart
    var serviceStatusChart = new ServiceStatusCollection({
        url: "/core/events?page_size=1"
    });

    var serviceStatusChartView = new ServiceStatusView({
        collection: serviceStatusChart,
        location: '#node-report-r2-c1 #servicesChart',
        width: $('#node-report-r2-c1 #servicesChart').width()
    });

    //---------------------------
    // instantiate CPU Usage chart
    var cpuUsageChart = new UtilizationCollection({
        url: "/core/events?page_size=1"
    });

    var cpuUsageView = new UtilizationView({
        collection: cpuUsageChart,
        location: '#node-report-r3 #node-report-panel #cpu-usage',
        width: $('#node-report-r3 #node-report-panel #cpu-usage').width()
    });

    //---------------------------
    // instantiate Memory Usage chart
    var memoryUsageChart = new UtilizationCollection({
        url: "/core/events?page_size=1"
    });

    var memoryUsageView = new UtilizationView({
        collection: memoryUsageChart,
        location: '#node-report-r3 #node-report-panel #memory-usage',
        width: $('#node-report-r3 #node-report-panel #memory-usage').width()
    });

    //---------------------------
    // instantiate Network Usage chart
    var networkUsageChart = new UtilizationCollection({
        url: "/core/events?page_size=1"
    });

    var networkUsageView = new UtilizationView({
        collection: networkUsageChart,
        location: '#node-report-r3 #node-report-panel #network-usage',
        width: $('#node-report-r3 #node-report-panel #network-usage').width()
    });

    //---------------------------
    // instantiate Libvirt core/vm chart
    var hypervisorCoreChart = new HypervisorCollection({
        url: "/core/events?page_size=1"
    });

    var hypervisorCoreView = new HypervisorView({
        collection: hypervisorCoreChart,
        location: '#node-report-r4 #node-report-panel #cores-usage',
        width: $('#node-report-r4 #node-report-panel #cores-usage').width()
    });

    //---------------------------
    // instantiate Libvirt mem/vm  chart
    var hypervisorMemoryChart = new HypervisorCollection({
        url: "/core/events?page_size=1"
    });

    var hypervisorMemoryView = new HypervisorView({
        collection: hypervisorMemoryChart,
        location: '#node-report-r4 #node-report-panel #memory-usage',
        width: $('#node-report-r4 #node-report-panel #memory-usage').width()
    });

    //---------------------------
    // instantiate Libvirt top 10 CPU consumer VMs chart
    var hypervisorVmCpuChart = new HypervisorVmCpuCollection({
        url: "/core/events?page_size=1"
    });

    var hypervisorVmCpuView = new HypervisorVmCpuView({
        collection: hypervisorVmCpuChart,
        location: '#node-report-r4 #node-report-panel #vm-cpu-usage',
        width: $('#node-report-r4 #node-report-panel #vm-cpu-usage').width()
    });
};
