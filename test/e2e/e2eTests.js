// e2e tests

casper.test.begin('Node Report Page is loading properly', 82, function suite(test) {
    casper.start('http://localhost:8000/report/node/ctrl-01', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('.navbar-brand > img', 'Favicon should load');
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // page h1
        test.assertSelectorHasText('div#node-report-r1-c1 h1', 'ctrl-01');

        // Service Status graph loads
        test.assertSelectorHasText('div #service-status-title-bar', 'Service Status Report');
        test.assertExists('div#node-report-r2', 'Service Status Section should load');
        test.assertExists('.alert-success', 'Service node statuses should load');
        test.assertSelectorDoesntHaveText('div #service-status-title-bar', 'No Data Returned');

        // Utilization graphs load
        test.assertSelectorHasText('div #utilization-title-bar', 'Utilization');
        test.assertExists('div#node-report-r3', 'Usage Charts should load');

        // CPU Usage Chart
        test.assertExists('div#node-report-r3-c1 #cpu-usage svg', 'CPU Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', 'CPU Usage');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', '0%');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', '100%');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', 'idle');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', 'user');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', 'sys');
        test.assertSelectorHasText('div #node-report-r3-c1 #cpu-usage', 'wait');
        test.assertSelectorDoesntHaveText('div #node-report-r3-c1 #cpu-usage', 'No Data Returned');

        // Memory Usage Chart
        test.assertExists('div#node-report-r3-c1 #memory-usage svg', 'Network Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r3-c1 #memory-usage', 'Memory Usage');
        test.assertSelectorHasText('div #node-report-r3-c1 #memory-usage', 'Total');
        test.assertSelectorHasText('div #node-report-r3-c1 #memory-usage', 'GB');
        test.assertSelectorHasText('div #node-report-r3-c1 #memory-usage', '0');
        test.assertSelectorHasText('div #node-report-r3-c1 #memory-usage', 'used');

        // Network Usage Chart
        test.assertExists('div#node-report-r3-c1 #network-usage svg', 'Network Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r3-c1 #network-usage', 'Network Usage');
        test.assertSelectorHasText('div #node-report-r3-c1 #network-usage', '0');
        test.assertSelectorHasText('div #node-report-r3-c1 #network-usage', 'tx');
        test.assertSelectorHasText('div #node-report-r3-c1 #network-usage', 'rx');

        // Hypervisor graphs load
        test.assertSelectorHasText('div #hypervisor-title-bar', 'Hypervisor');
        test.assertExists('div#node-report-r4', 'Hypervisor Charts should load');
        test.assertExists('div#node-report-r4-c1 #cores-usage svg', 'CPU Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', 'Cores');
        test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', 'Total Cores');
        test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', '0');

        test.assertExists('div#node-report-r4-c1 #memory-usage svg', 'Network Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage', 'Memory');
        test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage', 'Total GB');
        test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage', '0');

        test.assertExists('div#node-report-r4-c1 #vm-cpu-usage svg', 'Per VM CPU Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'Per VM CPU Usage');
        test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'percent utilization');
        test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'UserSystemWait');
        test.assertElementCount('#data-filterer .btn-group button', 3, 'per vm cpu usage chart has 3 buttons');

        // tabs should open and close as expected
        test.assertVisible('div#servicesReport', 'Services tab should start out visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should start out hidden');
        test.assertNotVisible('div#eventsReport', 'Events tab should start out hidden');

        this.click('.servicesButton');
        test.assertVisible('div#servicesReport', 'Services tab should  still be visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should still be hidden');
        test.assertNotVisible('div#eventsReport', 'Events tab should still be hidden');

        this.click('.reportsButton');
        test.assertNotVisible('div#servicesReport', 'Services tab should now be hidden');
        test.assertVisible('div#reportsReport', 'Reports tab should now be visible');
        test.assertNotVisible('div#eventsReport', 'Events tab should still be hidden');

        this.click('.eventsButton');
        test.assertNotVisible('div#servicesReport', 'Services tab should still be hidden');
        test.assertNotVisible('div#reportsReport', 'Reports tab should now be hidden');
        test.assertVisible('div#eventsReport', 'Events tab should now be showing');

        test.assertSelectorHasText('.sorting', 'Event TypeMessage');
        test.assertEval(function() {
            return __utils__.findAll('.sorting').length === 2;
        }, "Event report has 2 unsorted table headers");
        test.assertEval(function() {
            return __utils__.findAll('.sorting_desc').length === 1;
        }, "Event report has 1 sorted table header");

        this.click('.servicesButton');
        test.assertVisible('div#servicesReport', 'Services tab should now be visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should still be hidden');
        test.assertNotVisible('div#eventsReport', 'Events tab should now be hidden');

        // Service Status info button brings up popover
        test.assertNotVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should not be visible');
        this.click('#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.click('#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should not be visible');
        this.click('#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Utilization info button brings up popover
        test.assertNotVisible('#utilization-title-bar div.popover.fade.bottom.in', 'utilization info popover should not be visible');
        this.click('#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#utilization-title-bar div.popover.fade.bottom.in', 'utilization info popover should now be visible');
        this.click('#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#utilization-title-bar div.popover.fade.bottom.in', 'utilization info popover should not be visible');
        this.click('#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#utilization-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#utilization-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Hypervisor info button brings up popover
        test.assertNotVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'hypervisor info popover should not be visible');
        this.click('#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'hypervisor info popover should now be visible');
        this.click('#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'hypervisor info popover should not be visible');
        this.click('#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // events report
        test.assertEval(function() {
            return __utils__.findAll('td').length > 1 || $('td').text() === 'No data available in table';
        }, "Event report renders report results or 'No data available in table'");

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');

    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Homepage is loading properly', 64, function suite(test) {
    casper.start('http://localhost:8000/', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        /*
        EVENT TIMELINE E2E TESTS
        */

        // Event timeline graph loads
        test.assertExists('div#goldstone-discover-r1-c1', 'Event Timeline Section should load');
        test.assertExists('div#goldstone-discover-r1-c1 svg', 'Event Timeline Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c1', 'Event Timeline');

        // checks for a timestamp of any sort which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return __utils__.findAll('div #goldstone-discover-r1-c1 g.tick').length > 0 || $('div #goldstone-discover-r1-c1').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");


        // Event Timeline info button brings up popover
        test.assertNotVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should not be visible');
        this.click('#goldstone-event-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should now be visible');
        this.click('#goldstone-event-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should not be visible');
        this.click('#goldstone-event-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-event-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');

        /*
        NODE AVAILABILITY E2E TESTS
        */

        // Node Availability info button brings up popover
        test.assertNotVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should not be visible');
        this.click('#goldstone-node-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should now be visible');
        this.click('#goldstone-node-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should not be visible');
        this.click('#goldstone-node-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-node-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Node Availability graph loads
        test.assertExists('div#goldstone-discover-r1-c2', 'Node Availability Section should load');
        test.assertExists('div#goldstone-discover-r1-c2 svg', 'Node Availability svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c2', 'Node Availability');
        test.assertSelectorHasText('div #goldstone-discover-r1-c2', 'Ping Only');
        test.assertSelectorHasText('div #goldstone-discover-r1-c2', 'Logs');
        test.assertSelectorHasText('div #goldstone-discover-r1-c2', 'Disabled');
        test.assertSelectorDoesntHaveText('div #goldstone-discover-r1-c2', 'No Data Returned');

        /*
        CLOUD TOPOLOGY E2E TESTS
        */

        // Cloud Topology graph loads
        test.assertExists('div#goldstone-discover-r2-c1', 'Cloud Topology Section should load');
        test.assertExists('div#goldstone-discover-r2-c1 svg', 'Cloud Topology Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r2-c1', 'Cloud Topology');

        // Cloud Topology resource list loads
        test.assertExists('div#goldstone-discover-r2-c2', 'Resource List section should load');
        test.assertSelectorHasText('div #goldstone-discover-r2-c2', 'Resource List');

        // Cloud Topology viz has the expected branches and leaves
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'RegionOne');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'nova');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'cinder');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'keystone');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'glance');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'internal');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'flavors');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'hypervisors');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'volume');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'snapshots');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'transfers');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'endpoints');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'roles');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'services');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'tenants');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'users');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'images');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'aggregates');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'hosts');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'instances');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'volumes');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'backups');

        // Cloud Topology info button brings up popover
        test.assertNotVisible('#goldstone-discover-r1-c1 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r1-c1 div.popover.fade.bottom.in', 'cloud topology info popover should now be visible');
        this.click('#goldstone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r1-c1 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        /*
        RESOURCE LIST E2E TESTS
        */

        // Resource List info button brings up popover
        test.assertNotVisible('#goldstone-discover-r1-c2 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r1-c2 div.popover.fade.bottom.in', 'cloud topology info popover should now be visible');
        this.click('#goldstone-discover-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r1-c2 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-discover-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // No resource list is visible prior to clicking on node
        test.assertNotVisible('#goldstone-discover-r1-c2 .dataTables_scrollHead');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('API Perf Page is loading properly', 65, function suite(test) {
    casper.start('http://localhost:8000/api_perf/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Nova API Perf graph loads
        test.assertExists('div#api-perf-report-r1-c1', 'Nova API Perf Section should load');
        test.assertExists('div#api-perf-report-r1-c1 svg', 'Nova svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Nova API Performance');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r1-c1', 'No Data Returned');

        // Nova API info button brings up popover
        test.assertNotVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should now be visible');
        this.click('#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Neutron API Perf graph loads
        test.assertExists('div#api-perf-report-r1-c2', 'Neutron API Perf Section should load');
        test.assertExists('div#api-perf-report-r1-c2 svg', 'Neutron svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Neutron API Performance');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r1-c2', 'No Data Returned');

        // Neutron API info button brings up popover
        test.assertNotVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'neutron api info popover should not be visible');
        this.click('#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'neutron api info popover should now be visible');
        this.click('#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'neutron api info popover should not be visible');
        this.click('#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Keystone API Perf graph loads
        test.assertExists('div#api-perf-report-r2-c1', 'Keystone API Perf Section should load');
        test.assertExists('div#api-perf-report-r2-c1 svg', 'Keystone svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Keystone API Performance');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r2-c1', 'No Data Returned');

        // Keystone API info button brings up popover
        test.assertNotVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'keystone api info popover should not be visible');
        this.click('#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'keystone api info popover should now be visible');
        this.click('#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'keystone api info popover should not be visible');
        this.click('#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Glance API Perf graph loads
        test.assertExists('div#api-perf-report-r2-c2', 'Glance API Perf Section should load');
        test.assertExists('div#api-perf-report-r2-c2 svg', 'Glance svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Glance API Performance');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r2-c2', 'No Data Returned');

        // Glance API info button brings up popover
        test.assertNotVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'glance api info popover should not be visible');
        this.click('#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'glance api info popover should now be visible');
        this.click('#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'glance api info popover should not be visible');
        this.click('#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Cinder API Perf graph loads
        test.assertExists('div#api-perf-report-r3-c1', 'Cinder API Perf Section should load');
        test.assertExists('div#api-perf-report-r3-c1 svg', 'Cinder svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Cinder API Performance');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r3-c1', 'No Data Returned');

        // Cinder API info button brings up popover
        test.assertNotVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'cinder api info popover should not be visible');
        this.click('#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'cinder api info popover should now be visible');
        this.click('#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'cinder api info popover should not be visible');
        this.click('#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Nova (compute) Page is loading properly', 53, function suite(test) {
    casper.start('http://localhost:8000/nova/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Nova API Perf graph loads
        test.assertExists('div#nova-report-r1-c1', 'Nova API Perf Section should load');
        test.assertExists('div#nova-report-r1-c1 svg', 'Nova svg should load');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Nova API Performance');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#nova-report-r1-c1', 'No Data Returned');


        // Nova API info button brings up popover
        test.assertNotVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should now be visible');
        this.click('div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // VM Spawns graph loads
        test.assertExists('div#nova-report-r1-c2', 'VM Spawns chart section should load');
        test.assertExists('div#nova-report-r1-c2 svg', 'VM Spawns chart should load');
        test.assertSelectorHasText('div#nova-report-r1-c2', 'VM Spawns');

        // checks for 'fail' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r1-c2').text().indexOf('Fail') >= 0 || $('div #nova-report-r1-c2').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");

        // VM Spawns info button brings up popover
        test.assertNotVisible('div#nova-report-r1-c2     div.popover.fade.bottom.in', 'VM Spawns info popover should not be visible');
        this.click('div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'VM Spawns info popover should now be visible');
        this.click('div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'VM Spawns info popover should not be visible');
        this.click('div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // CPU Resources graph loads
        test.assertExists('div#nova-report-r2-c1', 'CPU Resources chart section should load');
        test.assertExists('div#nova-report-r2-c1 svg', 'CPU Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c1', 'CPU Resources');

        // checks for 'Physical' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r2-c1').text().indexOf('Physical') >= 0 || $('div #nova-report-r2-c1').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");


        // CPU Resources info button brings up popover
        test.assertNotVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'CPU Resources info popover should not be visible');
        this.click('div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'CPU Resources info popover should now be visible');
        this.click('div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'CPU Resources info popover should not be visible');
        this.click('div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Memory Resources graph loads
        test.assertExists('div#nova-report-r2-c2', 'Memory Resources chart section should load');
        test.assertExists('div#nova-report-r2-c2 svg', 'Memory Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c2', 'Memory Resources');

        // checks for 'Physical' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r2-c2').text().indexOf('Physical') >= 0 || $('div #nova-report-r2-c2').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");

        // Memory Resources info button brings up popover
        test.assertNotVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'Memory Resources info popover should not be visible');
        this.click('div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'Memory Resources info popover should now be visible');
        this.click('div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'Memory Resources info popover should not be visible');
        this.click('div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Disk Resources graph loads
        test.assertExists('div#nova-report-r3-c1', 'Disk Resources section should load');
        test.assertExists('div#nova-report-r3-c1 svg', 'Disk Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r3-c1', 'Disk Resources');

        // checks for 'Physical' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r3-c1').text().indexOf('Total') >= 0 || $('div #nova-report-r3-c1').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");

        // Disk Resources info button brings up popover
        test.assertNotVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');


        // footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});


casper.test.begin('Neutron (network) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/neutron/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Neutron API Perf graph loads
        test.assertExists('div#neutron-report-r1-c1', 'Neutron API Perf Section should load');
        test.assertExists('div#neutron-report-r1-c1 svg', 'Neutron svg should load');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Neutron API Performance');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#neutron-report-r1-c1', 'No Data Returned');

        // Neutron API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Block Storage (cinder) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/cinder/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#cinder-report-r1-c1', 'No Data Returned');

        // Cinder API Perf graph loads
        test.assertExists('div#cinder-report-r1-c1', 'Cinder API Perf Section should load');
        test.assertExists('div#cinder-report-r1-c1 svg', 'Cinder svg should load');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Cinder API Performance');

        // Cinder API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Image (glance) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/glance/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Glance API Perf graph loads
        test.assertExists('div#glance-report-r1-c1', 'Glance API Perf Section should load');
        test.assertExists('div#glance-report-r1-c1 svg', 'Glance svg should load');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Glance API Performance');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#glance-report-r1-c1', 'No Data Returned');

        // Glance API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Identity (keystone) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/keystone/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Keystone API Perf graph loads
        test.assertExists('div#keystone-report-r1-c1', 'Keystone API Perf Section should load');
        test.assertExists('div#keystone-report-r1-c1 svg', 'Keystone svg should load');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Keystone API Performance');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#keystone-report-r1-c1', 'No Data Returned');

        // Keystone API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Logging page is loading properly', 27, function suite(test) {
    casper.start('http://localhost:8000/intelligence/search', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Log Analysis graph loads
        test.assertExists('div.log-analysis-container', 'Log Analysis Section should load');
        test.assertExists('div.log-analysis-container svg', 'Log Analysis Section svg chart should load');
        test.assertSelectorHasText('div.log-analysis-container', 'Log Analysis');
        test.assertSelectorHasText('div.log-analysis-container', 'Log Events');
        test.assertSelectorHasText('div.log-analysis-container', '0');
        test.assertSelectorDoesntHaveText('div.log-analysis-container', 'No Data Returned');

        // Search Results section loads
        test.assertExists('div.log_table_panel', 'Search Results Section should load');
        test.assertExists('div#intel-search-data-table', 'Search Results should load');
        test.assertSelectorHasText('div.log_table_panel', 'Search Results');
        test.assertSelectorHasText('div.log_table_panel', 'Previous');
        test.assertSelectorHasText('div.log_table_panel', 'Next');
        test.assertSelectorDoesntHaveText('div.log_table_panel', 'No Data Returned');
        test.assertEval(function() {
            return __utils__.findAll('td.sorting_1').length === 10;
        }, "Search Resuts defaults 10 results");

        // zoom buttons
        test.assertExists('.fa-backward', 'more zoom out button exists');
        test.assertExists('.fa-forward', 'more zoom in button exists');
        test.assertExists('.fa-search-plus', 'zoom in button exists');
        test.assertExists('.fa-search-minus', 'zoom out button exists');

        // Log Analysis info button brings up popover
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'Info popover should not be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('.panel-heading div.popover.fade.bottom.in', 'Info popover should now be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'Info popover should not be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('.panel-heading div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});
