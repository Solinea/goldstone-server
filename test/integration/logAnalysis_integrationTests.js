/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('logAnalysis spec', function() {
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

        this.protoFetchSpy = sinon.spy(LogAnalysisCollection.prototype, "fetch");

        var testStart = (+new Date() - (15 * 60 * 1000));
        var testEnd = (+new Date());


        this.testCollection = new LogAnalysisCollection({});

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new LogAnalysisView({
            collection: this.testCollection,
            width: $('.testContainer').width(),
            height: 300,
            el: '.testContainer',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis Test',
            urlRoot: "/intelligence/log/cockpit/data?"
        });

        this.testCollection.reset();
        this.testCollection.add([{
            audit: 10,
            time: 1421085130000
        }, {
            info: 32,
            time: 1421085140000
        }, {
            warning: 30,
            time: 1421085150000
        }, {
            debug: 30,
            time: 1421085160000
        }, {
            error: 30,
            time: 1421085170000
        }, {
            audit: 30,
            error: 20,
            time: 1421085180000
        }, {
            audit: 30,
            warning: 10,
            time: 1421085190000
        }]);

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            var dataTest = JSON.stringify('hello');
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(7);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(8);
            this.testCollection.parse(dataTest);
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse appropriately', function() {
            expect(this.protoFetchSpy.callCount).to.equal(1);
            testObj = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                data: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(testObj);
            expect(this.protoFetchSpy.callCount).to.equal(2);
            expect(test1).to.deep.equal([1, 2, 3]);
            testObj = {
                monkeys: 'bananas',
                next: null,
                data: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(testObj);
            expect(test2).to.deep.equal([1, 2, 3]);
            expect(this.protoFetchSpy.callCount).to.equal(2);
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal(

                [{
                    debug: 0,
                    audit: 10,
                    info: 0,
                    warning: 0,
                    error: 0,
                    date: 1421085130000
                }, {
                    debug: 0,
                    audit: 0,
                    info: 32,
                    warning: 0,
                    error: 0,
                    date: 1421085140000
                }, {
                    debug: 0,
                    audit: 0,
                    info: 0,
                    warning: 30,
                    error: 0,
                    date: 1421085150000
                }, {
                    debug: 30,
                    audit: 0,
                    info: 0,
                    warning: 0,
                    error: 0,
                    date: 1421085160000
                }, {
                    debug: 0,
                    audit: 0,
                    info: 0,
                    warning: 0,
                    error: 30,
                    date: 1421085170000
                }, {
                    debug: 0,
                    audit: 30,
                    info: 0,
                    warning: 0,
                    error: 20,
                    date: 1421085180000
                }, {
                    debug: 0,
                    audit: 30,
                    info: 0,
                    warning: 10,
                    error: 0,
                    date: 1421085190000
                }]
            );
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');

            this.constructUrl_spy = sinon.spy(this.testView, "constructUrl");
            expect(this.constructUrl_spy.callCount).to.equal(0);
            this.testView.trigger('lookbackSelectorChanged', [1, 2]);
            expect(this.constructUrl_spy.callCount).to.equal(1);
            this.constructUrl_spy.restore();
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.x axis').find('text').text()).to.equal('');
            expect($('.y axis').text().trim()).to.equal('');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').text()).to.equal('');
            this.testCollection.reset();
            this.testView.checkReturnedDataSet(this.testCollection.toJSON());
            expect($('.popup-message').text()).to.equal('No Data Returned');
            this.testCollection.add({
                audit: 10,
                time: 1421085130000
            });
            this.testView.checkReturnedDataSet(this.testCollection.toJSON());
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(0);
            expect($('svg').find('text').text()).to.equal('Log Events');
            this.update_spy.restore();
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.testView.update();

            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            expect($('.popup-message').text()).to.equal('');
            this.testView.dataErrorMessage(null, {
                responseJSON: {
                    status_code: 246,
                    message: 'responseJSON message all up in your tests.'
                }
            });
            expect($('.popup-message').text()).to.equal('246 error: responseJSON message all up in your tests.');
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
            this.testView.dataErrorMessage("butterfly - spread your wings again");
            expect($('.popup-message').text()).to.equal('butterfly - spread your wings again');
            this.testView.clearDataErrorMessage();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.dataErrorMessage_spy.callCount).to.equal(4);
            this.dataErrorMessage_spy.restore();
        });
        it('should set a new url based on global lookback params coming from parent view', function() {
            this.constructUrl_spy = sinon.spy(this.testView, "constructUrl");
            expect(this.constructUrl_spy.callCount).to.equal(0);
            // should construct url
            expect(this.testCollection.url).to.include('/intelligence/log/cockpit/data?start_time=NaN&end_time=');
            this.testView.trigger('refreshReached', [1000, 2000]);
            expect(this.testCollection.url).to.equal('/intelligence/log/cockpit/data?start_time=1&end_time=2&interval=1s');
            this.testView.trigger('refreshReached', [1421428385868, 1421438385868]);
            expect(this.testCollection.url).to.equal('/intelligence/log/cockpit/data?start_time=1421428385&end_time=1421438385&interval=96s');
            expect(this.constructUrl_spy.callCount).to.equal(2);
            // should not construct url
            this.testView.defaults.isZoomed = true;
            this.testView.trigger('refreshReached', [1, 2]);
            expect(this.constructUrl_spy.callCount).to.equal(2);
            this.constructUrl_spy.restore();
        });
        it('should trigger paint new chart appropriately', function() {
            this.paintNewChart_spy = sinon.spy(this.testView, "paintNewChart");
            expect(this.paintNewChart_spy.callCount).to.equal(0);
            this.testView.paintNewChart([1000,2000], 10);
            expect(this.paintNewChart_spy.callCount).to.equal(1);
            this.testView.dblclicked([1000, 2000]);
            expect(this.paintNewChart_spy.callCount).to.equal(2);
            this.paintNewChart_spy.restore();
        });
        it('should construct new collection url\'s appropriately via paintNewChart functionality', function() {
            var time2 = 1421085130000;
            var time1 = time2 - (1000 * 60 * 60);
            this.testView.render();
            this.testView.update();
            // no mult
            this.testView.paintNewChart([time1,time2]);
            expect(this.testCollection.url).to.equal('/intelligence/log/cockpit/data?start_time=1421085174&end_time=1421085204&interval=1s');
            // mult >= 1
            this.testView.paintNewChart([time1,time2], 10);
            expect(this.testCollection.url).to.equal('/intelligence/log/cockpit/data?start_time=1421085183&end_time=1421085195&interval=1s');
            // mult < 1
            this.testView.paintNewChart([time1,time2], 0.5);
            expect(this.testCollection.url).to.equal('/intelligence/log/cockpit/data?start_time=1421085069&end_time=1421085309&interval=2s');
        });
    });
});
