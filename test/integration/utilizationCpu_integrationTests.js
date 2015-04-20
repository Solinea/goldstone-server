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

describe('utilizationCpu.js spec', function() {
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

        this.protoFetchSpy = sinon.spy(ServiceStatusCollection.prototype, "fetch");

        this.testCollection = new UtilizationCpuCollection({
            url: '/something/fancy'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new UtilizationCpuView({
            collection: this.testCollection,
            el: '.testContainer',
            width: $('.testContainer').width(),
            featureSet: 'cpuUsage'
        });

        this.testCollection.reset();
        this.testCollection.add([{
            "@timestamp": 1415148790577,
            "name": "os.cpu.sys",
            "metric_type": "gauge",
            "value": 0.12160618725179,
            "unit": "percent",
            "node": "compute-02"
        }, {
            "@timestamp": 1415148790577,
            "name": "os.cpu.wait",
            "metric_type": "gauge",
            "value": 0.12160618725179,
            "unit": "percent",
            "node": "compute-02"
        }, {
            "@timestamp": 1415148790577,
            "name": "os.cpu.user",
            "metric_type": "gauge",
            "value": 0.12160618725179,
            "unit": "percent",
            "node": "compute-02"
        }, {
            "@timestamp": 1415149790577,
            "name": "os.cpu.sys",
            "metric_type": "gauge",
            "value": 0.12160618725179,
            "unit": "percent",
            "node": "compute-02"
        }, {
            "@timestamp": 1415149790577,
            "name": "os.cpu.wait",
            "metric_type": "gauge",
            "value": 0.12160618725179,
            "unit": "percent",
            "node": "compute-02"
        }, {
            "@timestamp": 1415149790577,
            "name": "os.cpu.user",
            "metric_type": "gauge",
            "value": 0.12160618725179,
            "unit": "percent",
            "node": "compute-02"
        }, ]);

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
            this.testCollection.initialize({
                url: 'hi'
            });
            expect(this.testCollection.length).to.equal(6);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(7);
            this.testCollection.parse(dataTest);
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse appropriately', function() {
            this.testCollection.defaults.urlCollectionCount = 10;
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(10);
            var test = 'monkeys';
            this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(9);
            test = {
                monkeys: 'apples',
                next: null
            };
            this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(8);
            test = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(8);
            expect(test1).to.deep.equal([1, 2, 3]);
            test = {
                monkeys: 'bananas',
                next: null,
                results: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(7);
            expect(test2).to.deep.equal([1, 2, 3]);
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            this.testCollection.reset();
            this.testCollection.add([{
                "@timestamp": 1415148790577,
                "name": "os.cpu.sys",
                "metric_type": "gauge",
                "value": 0.2,
                "unit": "percent",
                "node": "compute-02"
            }, {
                "@timestamp": 1415148790577,
                "name": "os.cpu.wait",
                "metric_type": "gauge",
                "value": 0.2,
                "unit": "percent",
                "node": "compute-02"
            }, {
                "@timestamp": 1415148790577,
                "name": "os.cpu.user",
                "metric_type": "gauge",
                "value": 0.2,
                "unit": "percent",
                "node": "compute-02"
            }, {
                "@timestamp": 1415149790577,
                "name": "os.cpu.sys",
                "metric_type": "gauge",
                "value": 0.3,
                "unit": "percent",
                "node": "compute-02"
            }, {
                "@timestamp": 1415149790577,
                "name": "os.cpu.wait",
                "metric_type": "gauge",
                "value": 0.3,
                "unit": "percent",
                "node": "compute-02"
            }, {
                "@timestamp": 1415149790577,
                "name": "os.cpu.user",
                "metric_type": "gauge",
                "value": 0.3,
                "unit": "percent",
                "node": "compute-02"
            }, ]);
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal([{
                    wait: 0.2,
                    sys: 0.2,
                    user: 0.2,
                    idle: 99.4,
                    date: '1415148790577'
                }, {
                    wait: 0.3,
                    sys: 0.3,
                    user: 0.3,
                    idle: 99.1,
                    date: '1415149790577'
                }

            ]);
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
            expect($('g.x axis').find('text').text()).to.equal('');
            expect($('.y axis').text().trim()).to.equal('');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            this.testCollection.add({
                "@timestamp": 1415148790577,
                "name": "os.cpu.sys",
                "metric_type": "gauge",
                "value": 0.12160618725179,
                "unit": "percent",
                "node": "compute-02"
            });
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(3);
            expect($('g').find('text').text()).to.equal('waitsysuseridle.5770%10%20%30%40%50%60%70%80%90%100%');
            this.update_spy.restore();
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.testView.update();

            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            expect($('.popup-message').text()).to.equal('');
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
    });
});
