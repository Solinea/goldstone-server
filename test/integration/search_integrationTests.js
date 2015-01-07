/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('apiPerfView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div id="settingsUpdateButton">clickme</div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new ApiPerfCollection({
            urlPrefix: 'cinder'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new ApiPerfView({
            chartTitle: "Tester API Performance",
            collection: this.testCollection,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: 'body',
            width: $('body').width(),
            yAxisLabel: 'yAxisTest'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('triggers various', function() {
        it('functions', function() {
            updateLogSearch();
            refreshLogSearch(); 
            startLogSearchRefresh();           
            // $('#settingsUpdateButton').click();
        });
    });
});
