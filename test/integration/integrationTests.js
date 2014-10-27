/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('apiPerfView.js spec', function() {
    beforeEach(function() {

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new ApiPerfCollection({
            url: '/something/fancy'
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
            startStopInterval: {
                start: 1413644531000,
                end: 1414249331000,
                interval: "3600s"
            },
            width: $('body').width(),
            yAxisLabel: 'yAxisTest'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            var dataTest = JSON.stringify('hello');
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            this.testCollection.initialize({
                url: 'hi'
            });
            expect(this.testCollection.length).to.equal(1);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.parse(dataTest);
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('body');
        });
        it('info button popover responds to click event', function() {
            expect($('div.popover').length).to.equal(0);
            $(this.testView.el).find('#api-perf-info').click();
            expect($('div.popover').length).to.equal(1);
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.legend-items').find('text').text()).to.equal('MinMaxAvg');
            expect($('.panel-title').text().trim()).to.equal('Tester API Performance');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            expect($('#noDataReturned').text()).to.equal('No Data Returned');
            this.testCollection.add({
                url: '/blah'
            });
            this.testView.update();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(2);
            this.update_spy.restore();
        });
    });
});
