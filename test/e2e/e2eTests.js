casper.test.begin('Homepage is loading properly', 12, function suite(test) {
    casper.start('http://localhost:8000/', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Discover');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Cloud Topology graph loads
        test.assertExists('div#goldstone-discover-r1-c1', 'Cloud Topology Section should load');
        test.assertExists('div#goldstone-discover-r1-c1 svg', 'Cloud Topology Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c1', 'Cloud Topology');

        // Node Availability graph loads
        test.assertExists('div#goldstone-discover-r1-c2', 'Node Availability Section should load');
        test.assertExists('div#goldstone-discover-r1-c2 svg', 'Node Availability svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c2', 'Node Availability');

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
