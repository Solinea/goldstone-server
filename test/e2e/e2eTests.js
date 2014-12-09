// e2e tests
// TODO: replace cpu resources/ memory resources/ disk resources svg test when charts are back online

casper.test.begin('Node Report Page is loading properly', 62, function suite(test) {
    casper.start('http://localhost:8000/report/node/controller-01', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('.navbar-brand > img', 'Favicon should load');
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // page h1
        test.assertSelectorHasText('div#node-report-r1-c1 h1', 'controller-01');

        // Service Status graph loads
        test.assertSelectorHasText('div #service-status-title-bar', 'Service Status Report');
        test.assertExists('div#node-report-r2', 'Service Status Section should load');
        test.assertExists('.alert-success', 'Service node statuses should load');

        // Utilization graphs load
        test.assertSelectorHasText('div #utilization-title-bar', 'Utilization');
        test.assertExists('div#node-report-r3', 'Usage Charts should load');
        test.assertExists('div#node-report-r3-c1 #cpu-usage svg', 'CPU Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r3 #cpu-usage', 'CPU Usage');

        test.assertExists('div#node-report-r3-c1 #memory-usage svg', 'Network Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r3 #network-usage', 'Network Usage');

        test.assertExists('div#node-report-r3-c1 #network-usage svg', 'Network Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r3 #cpu-usage', 'CPU Usage');

        // Hypervisor graphs load
        test.assertSelectorHasText('div #hypervisor-title-bar', 'Hypervisor');
        test.assertExists('div#node-report-r4', 'Hypervisor Charts should load');
        test.assertExists('div#node-report-r4-c1 #cores-usage svg', 'CPU Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', 'Cores');

        test.assertExists('div#node-report-r4-c1 #memory-usage svg', 'Network Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage', 'Memory');

        test.assertExists('div#node-report-r4-c1 #vm-cpu-usage svg', 'Per VM CPU Usage Section svg chart should load');
        test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'Per VM CPU Usage');
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

        test.assertElementCount('td', 30, "Event report has 30 visible data points");
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Homepage is loading properly', 30, function suite(test) {
    casper.start('http://localhost:8000/', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Event timeline graph loads
        test.assertExists('div#goldstone-discover-r1-c1', 'Event Timeline Section should load');
        test.assertExists('div#goldstone-discover-r1-c1 svg', 'Event Timeline Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c1', 'Event Timeline');

        // Cloud Topology graph loads
        test.assertExists('div#goldstone-discover-r2-c1', 'Cloud Topology Section should load');
        test.assertExists('div#goldstone-discover-r2-c1 svg', 'Cloud Topology Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r2-c1', 'Cloud Topology');

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

        // Cloud Topology info button brings up popover
        test.assertNotVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should now be visible');
        this.click('#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

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
        test.assertExists('div#goldstone-discover-r2-c2', 'Node Availability Section should load');
        test.assertExists('div#goldstone-discover-r2-c2 svg', 'Node Availability svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r2-c2', 'Node Availability');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Nova Topology Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/nova/discover', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Nova API Perf graph loads
        test.assertExists('div#nova-discover-r1-c1', 'Nova Topology Section should load');
        test.assertExists('div#nova-discover-r1-c1 svg', 'Nova Topology svg should load');
        test.assertSelectorHasText('div#nova-discover-r1-c1', 'Nova Topology');

        // Nova Topology info button brings up popover
        test.assertNotVisible('#nova-discover-r1-c1 div.popover.fade.bottom.in', 'nova topology info popover should not be visible');
        this.click('#nova-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-discover-r1-c1 div.popover.fade.bottom.in', 'nova topology info popover should now be visible');
        this.click('#nova-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-discover-r1-c1 div.popover.fade.bottom.in', 'nova topology info popover should not be visible');
        this.click('#nova-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#nova-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Cinder Topology Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/cinder/discover', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Cinder API Perf graph loads
        test.assertExists('div#cinder-discover-r1-c1', 'Cinder Topology Section should load');
        test.assertExists('div#cinder-discover-r1-c1 svg', 'Cinder Topology svg should load');
        test.assertSelectorHasText('div#cinder-discover-r1-c1', 'Cinder Topology');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');

        // Cinder Topology info button brings up popover
        test.assertNotVisible('#cinder-discover-r1-c1 div.popover.fade.bottom.in', 'cinder topology info popover should not be visible');
        this.click('#cinder-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#cinder-discover-r1-c1 div.popover.fade.bottom.in', 'cinder topology info popover should now be visible');
        this.click('#cinder-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#cinder-discover-r1-c1 div.popover.fade.bottom.in', 'cinder topology info popover should not be visible');
        this.click('#cinder-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#cinder-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#cinder-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#cinder-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Glance Topology Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/glance/discover', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Glance API Perf graph loads
        test.assertExists('div#glance-discover-r1-c1', 'Glance Topology Section should load');
        test.assertExists('div#glance-discover-r1-c1 svg', 'Glance Topology svg should load');
        test.assertSelectorHasText('div#glance-discover-r1-c1', 'Glance Topology');

        // Glance Topology info button brings up popover
        test.assertNotVisible('#glance-discover-r1-c1 div.popover.fade.bottom.in', 'glance topology info popover should not be visible');
        this.click('#glance-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#glance-discover-r1-c1 div.popover.fade.bottom.in', 'glance topology info popover should now be visible');
        this.click('#glance-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#glance-discover-r1-c1 div.popover.fade.bottom.in', 'glance topology info popover should not be visible');
        this.click('#glance-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#glance-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#glance-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#glance-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Keystone Topology Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/keystone/discover', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Keystone API Perf graph loads
        test.assertExists('div#keystone-discover-r1-c1', 'Keystone Topology Section should load');
        test.assertExists('div#keystone-discover-r1-c1 svg', 'Keystone Topology svg should load');
        test.assertSelectorHasText('div#keystone-discover-r1-c1', 'Keystone Topology');

        // Keystone Topology info button brings up popover
        test.assertNotVisible('#keystone-discover-r1-c1 div.popover.fade.bottom.in', 'keystone topology info popover should not be visible');
        this.click('#keystone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#keystone-discover-r1-c1 div.popover.fade.bottom.in', 'keystone topology info popover should now be visible');
        this.click('#keystone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#keystone-discover-r1-c1 div.popover.fade.bottom.in', 'keystone topology info popover should not be visible');
        this.click('#keystone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#keystone-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#keystone-discover-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#keystone-discover-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('API Perf Page is loading properly', 46, function suite(test) {
    casper.start('http://localhost:8000/api_perf/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Nova API Perf graph loads
        test.assertExists('div#api-perf-report-r1-c1', 'Nova API Perf Section should load');
        test.assertExists('div#api-perf-report-r1-c1 svg', 'Nova svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Nova API Performance');

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

/*casper.test.begin('Nova (compute) Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/nova/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Nova API Perf graph loads
        test.assertExists('div#nova-report-r1-c1', 'Nova API Perf Section should load');
        test.assertExists('div#nova-report-r1-c1 svg', 'Nova svg should load');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Nova API Performance');

        // Nova API info button brings up popover
        test.assertNotVisible('#nova-api-perf-panel div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('#nova-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-api-perf-panel div.popover.fade.bottom.in', 'nova api info popover should now be visible');
        this.click('#nova-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-api-perf-panel div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('#nova-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#nova-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');*/

        /* pending return of these charts
        // VM Spawns graph loads
        test.assertExists('div#nova-report-r1-c2', 'VM Spawns chart section should load');
        // test.assertExists('div#nova-report-r1-c2 svg', 'VM Spawns chart should load');
        test.assertSelectorHasText('div#nova-report-r1-c2', 'VM Spawns');

        // VM Spawns info button brings up popover
        test.assertNotVisible('#nova-spawns-chart-title div.popover.fade.bottom.in', 'VM Spawns info popover should not be visible');
        this.click('#nova-spawns-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-spawns-chart-title div.popover.fade.bottom.in', 'VM Spawns info popover should now be visible');
        this.click('#nova-spawns-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-spawns-chart-title div.popover.fade.bottom.in', 'VM Spawns info popover should not be visible');
        this.click('#nova-spawns-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-spawns-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#nova-spawns-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-spawns-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // CPU Resources graph loads
        test.assertExists('div#nova-report-r2-c1', 'CPU Resources chart section should load');
        // test.assertExists('div#nova-report-r2-c1 svg', 'CPU Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c1', 'CPU Resources');

        // CPU Resources info button brings up popover
        test.assertNotVisible('#nova-cpu-chart-title div.popover.fade.bottom.in', 'CPU Resources info popover should not be visible');
        this.click('#nova-cpu-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-cpu-chart-title div.popover.fade.bottom.in', 'CPU Resources info popover should now be visible');
        this.click('#nova-cpu-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-cpu-chart-title div.popover.fade.bottom.in', 'CPU Resources info popover should not be visible');
        this.click('#nova-cpu-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-cpu-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#nova-cpu-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-cpu-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Memory Resources graph loads
        test.assertExists('div#nova-report-r2-c2', 'Memory Resources chart section should load');
        // test.assertExists('div#nova-report-r2-c2 svg', 'Memory Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c2', 'Memory Resources');

        // Memory Resources info button brings up popover
        test.assertNotVisible('#nova-mem-chart-title div.popover.fade.bottom.in', 'Memory Resources info popover should not be visible');
        this.click('#nova-mem-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-mem-chart-title div.popover.fade.bottom.in', 'Memory Resources info popover should now be visible');
        this.click('#nova-mem-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-mem-chart-title div.popover.fade.bottom.in', 'Memory Resources info popover should not be visible');
        this.click('#nova-mem-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-mem-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#nova-mem-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-mem-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Disk Resources graph loads
        test.assertExists('div#nova-report-r3-c1', 'Disk Resources section should load');
        // test.assertExists('div#nova-report-r3-c1 svg', 'Disk Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r3-c1', 'Disk Resources');

        // Disk Resources info button brings up popover
        test.assertNotVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#nova-disk-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#nova-disk-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#nova-disk-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#nova-disk-chart-title .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');
        */

        //footer loads and is visible
   /*     test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});*/


casper.test.begin('Neutron (network) Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/neutron/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Neutron API Perf graph loads
        test.assertExists('div#neutron-report-r1-c1', 'Neutron API Perf Section should load');
        test.assertExists('div#neutron-report-r1-c1 svg', 'Neutron svg should load');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Neutron API Performance');

        // Neutron API info button brings up popover
        test.assertNotVisible('#neutron-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#neutron-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#neutron-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#neutron-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#neutron-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#neutron-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#neutron-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#neutron-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#neutron-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Block Storage (cinder) Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/cinder/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Cinder API Perf graph loads
        test.assertExists('div#cinder-report-r1-c1', 'Cinder API Perf Section should load');
        test.assertExists('div#cinder-report-r1-c1 svg', 'Cinder svg should load');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Cinder API Performance');

        // Cinder API info button brings up popover
        test.assertNotVisible('#cinder-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#cinder-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#cinder-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#cinder-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#cinder-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#cinder-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#cinder-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#cinder-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#cinder-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Image (glance) Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/glance/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Glance API Perf graph loads
        test.assertExists('div#glance-report-r1-c1', 'Glance API Perf Section should load');
        test.assertExists('div#glance-report-r1-c1 svg', 'Glance svg should load');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Glance API Performance');

        // Glance API info button brings up popover
        test.assertNotVisible('#glance-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#glance-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#glance-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#glance-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#glance-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#glance-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#glance-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#glance-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#glance-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Identity (keystone) Page is loading properly', 14, function suite(test) {
    casper.start('http://localhost:8000/keystone/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Keystone API Perf graph loads
        test.assertExists('div#keystone-report-r1-c1', 'Keystone API Perf Section should load');
        test.assertExists('div#keystone-report-r1-c1 svg', 'Keystone svg should load');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Keystone API Performance');

        // Keystone API info button brings up popover
        test.assertNotVisible('#keystone-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#keystone-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#keystone-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#keystone-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#keystone-api-perf-panel div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#keystone-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#keystone-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#keystone-api-perf-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#keystone-api-perf-panel div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Logging page is loading properly', 18, function suite(test) {
    casper.start('http://localhost:8000/intelligence/search', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Log Analysis graph loads
        test.assertExists('div.intel_panel', 'Log Analysis Section should load');
        test.assertExists('div.intel_panel svg', 'Log Analysis Section svg chart should load');
        test.assertSelectorHasText('div.intel_panel', 'Log Analysis');

        // Node Availability graph loads
        test.assertExists('div.log_table_panel', 'Search Results Section should load');
        test.assertExists('div#intel-search-data-table', 'Search Results should load');
        test.assertSelectorHasText('div.log_table_panel', 'Search Results');
        test.assertEval(function() {
            return __utils__.findAll('td.sorting_1').length === 10;
        }, "Search Resuts defaults 10 results");

        // Log Analysis info button brings up popover
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('.panel-heading div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
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
