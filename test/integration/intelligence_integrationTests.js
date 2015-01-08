/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('eventsReportView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer" style="width=500"></div><div id="testMultiRsrcView"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
                "Content-Type": "application/json"
            },
            'wowza'
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('registers various selectors', function() {
            var test1 = isRefreshing();
            expect(test1).to.equal(undefined);
            var test2 = getRefreshInterval();
            expect(test2).to.equal(undefined);
            var test3 = refocusCockpitSecondaryCharts({
                1: 1,
                2: 2,
                3: 3
            });
        });
        it('tests the combos of _getSearchFormDates', function() {

            $('body').html('<input type="checkbox" id="endTimeNow"></input><input id="settingsEndTime" value=""></input>');
            var test4 = _getSearchFormDates();
            var d = new Date();
            expect(test4[1]).to.be.closeTo(d, 1000);

            $('body').html('<input type="checkbox" checked id="endTimeNow"></input><input id="settingsEndTime" value=""></input>');
            var test5 = _getSearchFormDates();
            d = new Date();
            expect(test5[1]).to.be.closeTo(d, 1000);

            $('body').html('<input type="checkbox" id="endTimeNow"></input><input id="settingsEndTime" value="boboskiwat"></input>');
            var test7 = _getSearchFormDates();
            d = new Date();
            expect(test7[1]).to.be.closeTo(d, 1000);

            // // // //

            $('body').html('<input type="checkbox" id="endTimeNow"></input><input id="settingsStartTime" value=""></input>');
            var test8 = _getSearchFormDates();
            d = new Date();
            d.addWeeks(-1);
            expect(test8[0]).to.be.closeTo(d, 1000);

            $('body').html('<input type="checkbox" id="endTimeNow"></input><input id="settingsStartTime" value="boboskiwat"></input>');
            var test10 = _getSearchFormDates();
            d = new Date();
            d.addWeeks(-1);
            expect(test10[0]).to.be.closeTo(d, 1000);

        });
        it('triggers _barChartBase', function() {
            var test1 = _barChartBase('.testContainer', {}, 'blah');
            var test2 = _barChartBase('.testContainer');
        });
        it('triggers _lineChartBase', function() {
            var test1 = _lineChartBase('.testContainer', {}, 'blah');
            var test2 = _lineChartBase('.testContainer');
        });
        it('triggers refreshSearchTable', function() {
            $('body').html('#log-search-table');
            refreshSearchTable();
        });
        it('triggers badEventMultiLine', function() {
            badEventMultiLine('.testContainer', 1, 2);
        });
        it('triggers _chartCrossFilterSetup', function() {
            var start = new Date();
            var end = (new Date()).addWeeks(-1);
            _chartCrossFilterSetup({start: start, end: end}, {uriBase: 'boboskiwat'});
        });
        it('triggers various functions', function() {
            // in search.js
            physCpuChart();
            physDiskChart();
            physMemChart();
            drawSearchTable('#testMultiRsrcView', 1419895319848, 1419896319848);
        });
    });
});
