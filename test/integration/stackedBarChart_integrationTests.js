/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('apiPerfView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>' +
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
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new StackedBarChartCollection({
            urlPrefix: 'nova'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new StackedBarChartView({
            chartTitle: "Tester API Performance",
            collection: this.testCollection,
            height: 300,
            infoCustom: 'novaSpawns',
            el: 'body',
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
                urlPrefix: 'glance'
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
            $(this.testView.el).find('#info-button').click();
            expect($('div.popover').length).to.equal(1);
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.legend-items').find('text').text()).to.equal('FailSuccess');
            expect($('.panel-title').text().trim()).to.equal('Tester API Performance');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            this.testCollection.add({
                url: '/blah'
            });
            this.testView.update();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(2);
            this.update_spy.restore();
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            expect($('#noDataReturned').text()).to.equal('');
            this.testView.dataErrorMessage(null, {
                status: '999',
                responseText: 'naughty - coal for you!'
            });
            expect($('.popup-message').text()).to.equal('999 error: naughty - coal for you!.');
            this.testView.dataErrorMessage(null, {
                status: '123',
                responseText: 'nice - bourbon for you!'
            });
            expect($('.popup-message').text()).to.equal('123 error: nice - bourbon for you!.');
            this.testView.dataErrorMessage('butterfly - spread your wings again');
            expect($('.popup-message').text()).to.equal('butterfly - spread your wings again');
            this.testCollection.add({
                url: '/blah'
            });
            this.testView.update();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.dataErrorMessage_spy.callCount).to.equal(3);
            this.dataErrorMessage_spy.restore();
        });
        it('listens for changes to the global lookback/refresh selectors', function() {
            this.urlGenerator_spy = sinon.spy(this.testCollection, "urlGenerator");
            this.testView.trigger('lookbackSelectorChanged');
            expect(this.urlGenerator_spy.callCount).to.equal(1);
            this.urlGenerator_spy.restore();
        });
        it('properly computes bar heights based on the d.name param', function() {

            // Success / Failure get computed as a difference
            // between y0 and y1
            var test1 = this.testView.computeBarHeightPopover({
                name: 'Failure',
                y0: 5,
                y1: 10
            });
            var test2 = this.testView.computeBarHeightPopover({
                name: 'Success',
                y0: 10,
                y1: 5
            });
            expect(test1).to.equal('<p>Failure<br>5');
            expect(test2).to.equal('<p>Success<br>-5');

            // Any other d.name values get computed as the
            // value of y1
            var test3 = this.testView.computeBarHeightPopover({
                name: 'Virtual',
                y0: 5,
                y1: 10
            });
            var test4 = this.testView.computeBarHeightPopover({
                name: 'Philosphical',
                y0: 10,
                y1: 42
            });
            var test5 = this.testView.computeBarHeightPopover({
                name: '',
                y0: 12,
                y1: 'Sucks'
            });
            expect(test3).to.equal('<p>Virtual<br>10');
            expect(test4).to.equal('<p>Philosphical<br>42');
            expect(test5).to.equal('<p><br>Sucks');

            // can handle empty input
            var test6 = this.testView.computeBarHeightPopover({});
            expect(test6).to.equal('<p>Missing name param<br>No value reported');

            // can handle incompletely formatted input
            var test7 = this.testView.computeBarHeightPopover({
                name: 'Lazy'
            });
            expect(test7).to.equal('<p>Lazy<br>No value reported');
            var test8 = this.testView.computeBarHeightPopover({
                name: 'Careless',
                y0: 108
            });
            expect(test8).to.equal('<p>Careless<br>No value reported');
            var test9 = this.testView.computeBarHeightPopover({
                name: 'Sleepy',
                y1: 400
            });
            expect(test9).to.equal('<p>Sleepy<br>No value reported');
            var test10 = this.testView.computeBarHeightPopover({
                y0: 105,
                y1: 200
            });
            expect(test10).to.equal('<p>Missing name param<br>200');

            // returns y1 value of charts that don't have a
            // name param of "Failure" or "Success"
            var test11 = this.testView.computeBarHeightPopover({
                name: 'Nada',
                y0: 12,
                y1: 12
            });
            expect(test11).to.equal('<p>Nada<br>12');

            // returns the y1-y0 value of charts that have a
            // name param of "Failure" or "Success"
            var test12 = this.testView.computeBarHeightPopover({
                name: 'Failure',
                y0: 12,
                y1: 12
            });
            expect(test12).to.equal('<p>Failure<br>0');
        });
    });
});
