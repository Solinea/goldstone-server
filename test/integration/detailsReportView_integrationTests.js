/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('reportsReportView.js spec', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="panel panel-primary node_details_panel">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Resource Details' +
            '</h3>' +
            '</div>' +
            '</div>' +

            '<div class="panel-body">' +
            '<table id="details-single-rsrc-table" class="table"></table>' +
            '</div>'
        );

        localStorage.setItem('detailsTabData', "[]");

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new DetailsReportView({});
    });
    afterEach(function() {
        $('body').html('');
        localStorage.removeItem('detailsTabData');
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
        });
    });
    describe('view functions behave as expected', function() {
        it('draws a search table', function() {
            var testData = {
                results: []
            };
            expect($('.test-container').text()).to.equal('');

        });
    });
});
