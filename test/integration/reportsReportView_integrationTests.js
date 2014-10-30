/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('reportsReportView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new ReportsReportView({
            el: '.testContainer',
            width: 800
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
            expect(this.testView.el).to.equal('.testContainer');
            expect($(this.testView.el).text()).to.equal('No Reports Data');
        });
        it('responds appropritely based on localStorage variables', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('#availableReportResul').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            this.testView.update();

            var testLocalStorageData = JSON.stringify({a:1, b:2, c:3});

            localStorage.setItem('reportNodeData', testLocalStorageData);
            $(this.testView.el).empty();
            this.testView.update();
            expect($(this.testView.el).text()).to.equal('Sample Report Lista: 1b: 2c: 3Sample Data Load:');
            expect(this.update_spy.callCount).to.equal(2);
            this.update_spy.restore();

            localStorage.clear();
        });
    });

});
