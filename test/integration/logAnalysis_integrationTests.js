/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('logAnalysis.js spec', function() {
    beforeEach(function() {

        $('body').html('<div id="log-viewer-visualization"></div>' +
            '<div id="log-viewer-table"></div>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.protoFetchSpy = sinon.spy(LogBrowserCollection.prototype, "fetch");

        var testEnd = (+new Date());
        var testStart = (testEnd - (15 * 60 * 1000));


        this.testCollection = new LogBrowserCollection({
            urlBase: '/logging/summarize/'
        });

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.testCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'logBrowser',
            marginLeft: 60,
            urlRoot: "/logging/summarize/?",
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage')
        });

        this.testCollection.reset();
        this.testCollection.add({
            "timestamps": [1427474584000, 1427474585000],
            "levels": ["INFO", "WARNING", "ALERT", "CRITICAL", "ERROR", "NOTICE"],
            "data": [{
                    "1427474584000": [{
                        "INFO": 100
                    }, {
                        "NOTICE": 50
                    }, {
                        "WARNING": 20
                    }]
                }, {
                    "1427474585000": [{
                        "WARNING": 20
                    }, {
                        "INFO": 30
                    }, {
                        "NOTICE": 40
                    }]
                }, {
                    "1427474586000": [{
                        "ERROR": 20
                    }, {
                        "DEBUG": 30
                    }, {
                        "CRITICAL": 40
                    }]
                }
            ]
        });

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
            expect(this.testCollection.length).to.equal(1);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.parse(dataTest);
        });
        it('should parse appropriately', function() {
            testObj = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                data: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(testObj);
            expect(test1).to.deep.equal({
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                data: [1, 2, 3]
            });
            testObj = {
                monkeys: 'bananas',
                next: null,
                data: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(testObj);
            expect(test2).to.deep.equal({
                monkeys: 'bananas',
                next: null,
                data: [1, 2, 3]
            });
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal({
                "finalData": [{
                    "INFO": 100,
                    "NOTICE": 50,
                    "WARNING": 20,
                    "EMERGENCY": 0,
                    "ALERT": 0,
                    "CRITICAL": 0,
                    "ERROR": 0,
                    "DEBUG": 0,
                    "date": "1427474584000"
                }, {
                    "WARNING": 20,
                    "INFO": 30,
                    "NOTICE": 40,
                    "EMERGENCY": 0,
                    "ALERT": 0,
                    "CRITICAL": 0,
                    "ERROR": 0,
                    "DEBUG": 0,
                    "date": "1427474585000"
                }, {
                    "WARNING": 0,
                    "INFO": 0,
                    "NOTICE": 0,
                    "EMERGENCY": 0,
                    "ALERT": 0,
                    "CRITICAL": 40,
                    "ERROR": 20,
                    "DEBUG": 30,
                    "date": "1427474586000"
                }],
                "logLevels": ["INFO", "WARNING", "ALERT", "CRITICAL", "ERROR", "NOTICE"]
            });
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('#log-viewer-visualization');
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
            this.testView.dataErrorMessage(null, {
                responseJSON: {
                    status_code: 246,
                    message: 'responseJSON message all up in your tests.',
                    detail: 'and some extra details, just for fun'
                }
            });
            expect($('.popup-message').text()).to.equal('246 error: responseJSON message all up in your tests. and some extra details, just for fun');
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
            expect(this.testCollection.url).to.include('/logging/summarize/?@timestamp__range={"gte":');
            this.testView.trigger('lookbackIntervalReached', [1000, 2000]);
            expect(this.testCollection.url).to.include('/logging/summarize/?@timestamp__range={"gte":');
            this.testView.trigger('lookbackIntervalReached', [1421428385868, 1421438385868]);
            expect(this.testCollection.url).to.include('/logging/summarize/?@timestamp__range={"gte":');
            expect(this.testCollection.url).to.include('&interval=');
            expect(this.constructUrl_spy.callCount).to.equal(2);
            // should not construct url
            this.testView.isZoomed = true;
            this.testView.trigger('lookbackIntervalReached');
            expect(this.constructUrl_spy.callCount).to.equal(2);
            this.constructUrl_spy.restore();
        });
        it('should trigger paint new chart appropriately', function() {
            this.paintNewChart_spy = sinon.spy(this.testView, "paintNewChart");
            expect(this.paintNewChart_spy.callCount).to.equal(0);
            this.testView.paintNewChart([1000, 2000], 10);
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
            this.testView.paintNewChart([time1, time2]);
            expect(this.testCollection.url).to.include('/logging/summarize/?@timestamp__range={"gte":');
            expect(this.testCollection.url).to.include('}&interval=0.5s');
            // mult >= 1
            this.testView.paintNewChart([time1, time2], 10);
            expect(this.testCollection.url).to.equal('/logging/summarize/?@timestamp__range={"gte":1427474583793,"lte":1427474586193}&interval=0.5s&per_host=False');
            // mult < 1
            this.testView.paintNewChart([time1, time2], 0.5);
            expect(this.testCollection.url).to.equal('/logging/summarize/?@timestamp__range={"gte":1427474581993,"lte":1427474589993}&interval=0.5s&per_host=False');
        });
    });
});
