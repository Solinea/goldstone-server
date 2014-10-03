// e2e tests

casper.test.begin('Homepage is loading properly', 15, function suite(test) {
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

casper.test.begin('Nova Topology Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Cinder Topology Page is loading properly', 9, function suite(test) {
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
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Glance Topology Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Keystone Topology Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('API Perf Page is loading properly', 21, function suite(test) {
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

        // Neutron API Perf graph loads
        test.assertExists('div#api-perf-report-r1-c2', 'Neutron API Perf Section should load');
        test.assertExists('div#api-perf-report-r1-c2 svg', 'Neutron svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Neutron API Performance');

        // Keystone API Perf graph loads
        test.assertExists('div#api-perf-report-r2-c1', 'Keystone API Perf Section should load');
        test.assertExists('div#api-perf-report-r2-c1 svg', 'Keystone svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Keystone API Performance');

        // Glance API Perf graph loads
        test.assertExists('div#api-perf-report-r2-c2', 'Glance API Perf Section should load');
        test.assertExists('div#api-perf-report-r2-c2 svg', 'Glance svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Glance API Performance');

        // Cinder API Perf graph loads
        test.assertExists('div#api-perf-report-r3-c1', 'Cinder API Perf Section should load');
        test.assertExists('div#api-perf-report-r3-c1 svg', 'Cinder svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Cinder API Performance');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Nova (compute) Page is loading properly', 21, function suite(test) {
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

        // Neutron API Perf graph loads
        test.assertExists('div#nova-report-r1-c2', 'VM Spawns chart section should load');
        test.assertExists('div#nova-report-r1-c2 svg', 'VM Spawns chart should load');
        test.assertSelectorHasText('div#nova-report-r1-c2', 'VM Spawns');

        // Keystone API Perf graph loads
        test.assertExists('div#nova-report-r2-c1', 'CPU Resources chart section should load');
        test.assertExists('div#nova-report-r2-c1 svg', 'CPU Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c1', 'CPU Resources');

        // Glance API Perf graph loads
        test.assertExists('div#nova-report-r2-c2', 'Memory Resources chart section should load');
        test.assertExists('div#nova-report-r2-c2 svg', 'Memory Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c2', 'Memory Resources');

        // Cinder API Perf graph loads
        test.assertExists('div#nova-report-r3-c1', 'Disk Resources section should load');
        test.assertExists('div#nova-report-r3-c1 svg', 'Disk Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r3-c1', 'Disk Resources');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});


casper.test.begin('Neutron (network) Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Block Storage (cinder) Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Image (glance) Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Identity (keystone) Page is loading properly', 9, function suite(test) {
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

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Logging page is loading properly', 13, function suite(test) {
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
        test.assertEval(function(){
            return __utils__.findAll('td.sorting_1').length === 10;
        }, "Search Resuts defaults 10 results");

        // footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});
