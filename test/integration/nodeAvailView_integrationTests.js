/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - nodeAvailView.js

describe('nodeAvailView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new NodeAvailCollection({
            url: '/something/fancy'
        });
        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new NodeAvailView({
            collection: this.testCollection,
            h: {"main": 450, "swim": 50},
            el: '.testContainer',
            chartTitle: "Test Chart Title",
            width: 500
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
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g').find('.axis').text()).to.equal('DisabledLogsPing Only');
            expect($('.panel-title').text().trim()).to.equal('Test Chart Title');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('#noDataReturned').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            console.log(this.testCollection.toJSON());
            this.testCollection.reset();
            this.testView.update();
            expect($('#noDataReturned').length).to.equal(0);
            // SHOULD BE 'NO DATA RETURNED!!??'
            expect($('#noDataReturned').text()).to.equal('');
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
