/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

// basic sanity check.
// base object is tested in apiPerfReportView_integrationTests.js

describe('NodeReportView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="test-container"></div>' +
            '<div style="width:10%;" class="col-xl-1 pull-right">&nbsp;' +
            '</div>' +
            '<div class="col-xl-2 pull-right">' +
            '<form class="global-refresh-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-1">' +
            '<div class="input-group">' +
            '<select class="form-control" id="global-refresh-range">' +
            '<option value="15">refresh 15s</option>' +
            '<option value="30" selected>refresh 30s</option>' +
            '<option value="60">refresh 1m</option>' +
            '<option value="300">refresh 5m</option>' +
            '<option value="-1">refresh off</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '<div class="col-xl-1 pull-right">' +
            '<form class="global-lookback-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-1">' +
            '<div class="input-group">' +
            '<select class="form-control" id="global-lookback-range">' +
            '<option value="15">lookback 15m</option>' +
            '<option value="60" selected>lookback 1h</option>' +
            '<option value="360">lookback 6h</option>' +
            '<option value="1440">lookback 1d</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        // blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new NodeReportView({
            el: '.test-container',
            node_uuid: 'power-of-greyskull'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.test-container');
            expect($(this.testView.el).text()).to.equal('power-of-greyskullServicesReportsEvents Service Status Report UtilizationCPU UsageMemory UsageNetwork Usage HypervisorCoresMemoryPer VM CPU UsageUserSystemWait Reports Available Reports list loading or not available Report DataSelecting a report from the dropdown above will populate this area with the report results.  Events Report102550100 records per pageSearch:Processing...CreatedEvent TypeMessage');
        });
        it('should exist', function() {
            this.testView.render();
        });
        it('view responds to global selector changes', function() {
            this.getGlobalLookbackRefresh_spy = sinon.spy(this.testView, "getGlobalLookbackRefresh");
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(0);

            $('#global-lookback-range').trigger('change');
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(1);

            $('#global-refresh-range').trigger('change');
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(2);

            $('#global-refresh-range').val('-1');
            this.testView.getGlobalLookbackRefresh();
            this.testView.scheduleInterval();
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(3);

            this.getGlobalLookbackRefresh_spy.restore();
        });
        it('view won\'t refresh if global refresh is set to off', function() {
            var test1 = this.testView.defaults.scheduleInterval;
            $('#global-refresh-range').val('-1');
            this.testView.getGlobalLookbackRefresh();
            this.testView.scheduleInterval();
            expect(this.testView.defaults.scheduleInterval).to.equal(test1);
            $('#global-refresh-range').val('30');
            this.testView.getGlobalLookbackRefresh();
            this.testView.scheduleInterval();
            expect(this.testView.defaults.scheduleInterval).to.not.equal(test1);
        });
        it('should correctly parse the node from the url', function() {
            var test1 = this.testView.constructHostName('http://localhost:8000/report/node/controller-01.lab.solinea.com');
            var test2 = this.testView.constructHostName('http://localhost:8000/report/node/controller-01');
            var test3 = this.testView.constructHostName('http://localhost:8000/report/node/controller-01.a.b.c.d.e.f.g.h');
            var test4 = this.testView.constructHostName('http://localhost:8000/report/node/');
            expect(test1).to.equal('controller-01');
            expect(test2).to.equal('controller-01');
            expect(test3).to.equal('controller-01');
            expect(test4).to.equal('');
        });
    });
});
