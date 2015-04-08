/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('discover.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        data = [];

        app = {};
        app.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        this.testView = new DiscoverView({
            el: '.test-container'
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('triggers discover.js', function() {
            $('body').append('<div id="goldstone-discover-r1-c1" style="width:500px;"></div>');
            $('body').append('<div id="goldstone-discover-r1-c2" style="width:500px;"></div>');
            $('body').append('<div id="goldstone-discover-r2-c1" style="width:500px;"></div>');
            $('body').append('<div id="goldstone-discover-r2-c2" style="width:500px;"></div>');
            this.testView.renderCharts();
            this.testView.triggerChange('lookbackSelectorChanged');
        });
    });
});
