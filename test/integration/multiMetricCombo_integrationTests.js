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

describe('stackedAreaCollection.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new MultiMetricComboCollection({
            globalLookback: 30,
            metricNames: ['os.mem.toad', 'os.mem.lippy', 'os.mem.zippy'],
            nodeName: 'marvin'
        });

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new UtilizationMemView({
            collection: this.testCollection,
            el: '.testContainer',
            width: $('.testContainer').width(),
            featureSet: 'memUsage'
        });

        this.testCollection.reset();

        this.testData = [

            {
                "units": [
                    "percent"
                ],
                "per_interval": [{
                    "1431532800000": {
                        "count": 122,
                        "stats": {
                            "count": 122,
                            "min": 94,
                            "sum_of_squares": 1077992,
                            "max": 94,
                            "sum": 11468,
                            "std_deviation": 0,
                            "std_deviation_bounds": {
                                "upper": 94,
                                "lower": 94
                            },
                            "variance": 0,
                            "avg": 94
                        }
                    }
                }, {
                    "1431536400000": {
                        "count": 180,
                        "stats": {
                            "count": 180,
                            "min": 94,
                            "sum_of_squares": 1590480,
                            "max": 94,
                            "sum": 16920,
                            "std_deviation": 0,
                            "std_deviation_bounds": {
                                "upper": 94,
                                "lower": 94
                            },
                            "variance": 0,
                            "avg": 94
                        }
                    }
                }],
                metricSource: "os.mem.toad"
            },

            {
                "units": [
                    "percent"
                ],
                "per_interval": [{
                    "1431532800000": {
                        "count": 122,
                        "stats": {
                            "count": 122,
                            "min": 94,
                            "sum_of_squares": 1077992,
                            "max": 94,
                            "sum": 11468,
                            "std_deviation": 0,
                            "std_deviation_bounds": {
                                "upper": 94,
                                "lower": 94
                            },
                            "variance": 0,
                            "avg": 94
                        }
                    }
                }, {
                    "1431536400000": {
                        "count": 180,
                        "stats": {
                            "count": 180,
                            "min": 94,
                            "sum_of_squares": 1590480,
                            "max": 94,
                            "sum": 16920,
                            "std_deviation": 0,
                            "std_deviation_bounds": {
                                "upper": 94,
                                "lower": 94
                            },
                            "variance": 0,
                            "avg": 94
                        }
                    }
                }],
                metricSource: "os.mem.lippy"

            },

            {
                "units": [
                    "percent"
                ],
                "per_interval": [{
                    "1431532800000": {
                        "count": 122,
                        "stats": {
                            "count": 122,
                            "min": 94,
                            "sum_of_squares": 1077992,
                            "max": 94,
                            "sum": 11468,
                            "std_deviation": 0,
                            "std_deviation_bounds": {
                                "upper": 94,
                                "lower": 94
                            },
                            "variance": 0,
                            "avg": 94
                        }
                    }
                }, {
                    "1431536400000": {
                        "count": 180,
                        "stats": {
                            "count": 180,
                            "min": 94,
                            "sum_of_squares": 1590480,
                            "max": 94,
                            "sum": 16920,
                            "std_deviation": 0,
                            "std_deviation_bounds": {
                                "upper": 94,
                                "lower": 94
                            },
                            "variance": 0,
                            "avg": 94
                        }
                    }
                }],
                metricSource: "os.mem.zippy"

            }

        ];

        this.testCollection.add(this.testData);

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
            expect(this.testCollection.length).to.equal(3);
            this.testCollection.parse(dataTest);
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse appropriately', function() {
            this.testCollection.defaults.urlCollectionCount = this.testCollection.defaults.metricNames.length;
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(3);
            var test = {
                result: 'monkeys'
            };
            var res1 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(2);
            expect(res1).to.deep.equal({
                result: 'monkeys',
                metricSource: 'os.mem.toad'
            });
            test = {
                monkeys: 'apples',
                next: null
            };
            res1 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(1);
            expect(res1).to.deep.equal({
                monkeys: 'apples',
                next: null,
                metricSource: 'os.mem.lippy'
            });
            test = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(1);
            expect(test1).to.deep.equal({
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                results: [1, 2, 3],
                metricSource: 'os.mem.lippy'
            });
            test = {
                monkeys: 'bananas',
                next: null,
                results: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(0);
            expect(test2).to.deep.equal({
                monkeys: 'bananas',
                next: null,
                results: [1, 2, 3],
                metricSource: 'os.mem.zippy'
            });
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal(
                [{
                    used: 0,
                    free: 0,
                    total: 0.1,
                    date: '1431532800000'
                }, {
                    used: 0,
                    free: 0,
                    total: 0.1,
                    date: '1431536400000'
                }]
            );
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
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.add(this.testData);
            this.testCollection.defaults.urlCollectionCount = 0;
            this.testView.update();
            this.testCollection.trigger('sync');
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(4);
            expect($('g').find('text').text()).to.equal('usedTotal: 0GB09 AM09:1509:3009:4510 AM0.000000000.000000010.000000020.000000030.000000040.000000050.000000060.000000070.00000008');
            this.update_spy.restore();
        });
    });
});
