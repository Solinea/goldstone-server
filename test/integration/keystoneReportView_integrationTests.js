/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

// basic sanity check.
// base object is tested in apiPerfReportView_integrationTests.js

describe('keystoneReportView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        app = {};
        app.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";
        this.testView = new KeystoneReportView({
            el: '.test-container',
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
            expect($(this.testView.el).text()).to.equal(' Keystone API PerformanceResponse Time (s)');
            this.testView.triggerChange('lookbackSelectorChanged');
            this.testView.triggerChange('lookbackIntervalReached');
            this.testView.triggerChange();
        });
    });

});
