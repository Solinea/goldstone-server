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
//integration tests - serviceStatusView.js

describe('serviceStatusView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.protoFetchSpy = sinon.spy(ServiceStatusCollection.prototype, "fetch");

        this.testCollection = new ServiceStatusCollection({
            url: '/null/and/void'
        });

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new ServiceStatusView({
            collection: this.testCollection,
            el: '.testContainer',
            width: 800
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(1);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.pop();
            expect(this.testCollection.length).to.equal(1);

            // for coverage report
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse dummy data appropriately', function() {
            var testData = {
                results: [],
                next: 'notNull'
            };
            var test1 = this.testCollection.parse(testData);
            expect(test1.length).to.equal(0);
            testData = {
                results: [{
                    name: 'fee'
                }, {
                    name: 'fi'
                }, {
                    name: 'fo'
                }],
                next: null
            };
            var test2 = this.testCollection.parse(testData);
            expect(test2.length).to.equal(3);
        });
        it('should create sets of unique services', function() {
            this.testCollection.reset();
            this.testCollection.add([{
                name: 'bingBap1',
                value: 'running'
            }, {
                name: 'bingBap1',
                value: 'stopped'
            }, {
                name: 'bingBap1',
                value: 'stopped'
            }, {
                name: 'bingBap1',
                value: 'stopped'
            }, {
                name: 'bingBap2',
                value: 'running'
            }, {
                name: 'bingBap2',
                value: 'stopped'
            }, {
                name: 'bingBap2',
                value: 'stopped'
            }, {
                name: 'bingBap2',
                value: 'stopped'
            }, {
                name: 'bingBap2',
                value: 'stopped'
            }, {
                name: 'bingBap3',
                value: 'running'
            }, {
                name: 'bingBap3',
                value: 'stopped'
            }, {
                name: 'bingBap3',
                value: 'stopped'
            }, {
                name: 'bingBap3',
                value: 'stopped'
            }]);
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal([{
                'bingBap1': 'running'
            }, {
                'bingBap2': 'running'
            }, {
                'bingBap3': 'running'
            }]);
        });
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');

        });
        it('appends the correct class', function() {
            var test = "running";
            var test1 = this.testView.classSelector(test);
            expect(test1).to.equal('alert alert-success');
            test = "not-running";
            var test2 = this.testView.classSelector(test);
            expect(test2).to.equal('alert alert-danger fa fa-exclamation-circle');
        });
        it('behaves properly on sync and render', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect(this.update_spy.callCount).to.equal(0);
            this.testCollection.defaults.setAchieved = false;
            this.testCollection.trigger('sync');
            expect(this.update_spy.callCount).to.equal(0);
            this.testCollection.defaults.setAchieved = true;
            this.testCollection.reset();
            this.testCollection.add([{
                name: 'bingBap1'
            }, {
                name: 'bingBap2'
            }, {
                name: 'bingBap33333333333333333333333'
            }, {
                name: 'bingBap3'
            }, {
                name: 'bingBap3'
            }]);
            this.testCollection.trigger('sync');
            expect(this.update_spy.callCount).to.equal(0);
            expect($('.mainContainer .toRemove').length).to.equal(4);

            // replaces characters > 27 with ...
            expect($('.testContainer').text()).to.equal(' bingBap1 bingBap2 bingBap3 bingBap33333333333333333333...');

            // mouseover on truncated nodes brings up tooltip
            expect($('.tooltip').length).to.equal(0);
            $($('.toRemove')[2]).mouseover();
            expect($('.tooltip').length).to.equal(0);
            $($('.toRemove')[3]).mouseover();
            expect($('.tooltip').length).to.equal(1);
            this.update_spy.restore();
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').length).to.equal(1);
            this.testCollection.reset();
            this.testView.update();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            // it doesn't RE-apply 'No Data Returned' if it's already there:
            this.testView.update();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            // it REMOVES 'No Data Returned' if data starts flowing again:
            this.testCollection.add({
                name: 'fee'
            }, {
                name: 'fi'
            }, {
                name: 'fo'
            });
            this.testView.update();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(3);
            this.update_spy.restore();
        });
        it('sorts appropriately', function() {
            assert.isDefined(this.testView.sorter, 'this.testView.sorter has been defined');
            var testData = [{
                "ovs-agent1": false,
            }, {
                "ovs-agent2": true,
            }, {
                "ovs-agent3": true,
            }, {
                "neutron-agent3": false
            }, {
                "nova-compute1": true
            }, {
                "neutron-agent1": true
            }, {
                "nova-compute2": false
            }, {
                "neutron-agent2": true
            }, {
                "nova-compute3": true
            }, ];

            var test1 = this.testView.sorter(testData);
            expect(test1).to.deep.equal(
                [{
                    "neutron-agent1": true
                }, {
                    "neutron-agent2": true
                }, {
                    "neutron-agent3": false
                }, {
                    "nova-compute1": true
                }, {
                    "nova-compute2": false
                }, {
                    "nova-compute3": true
                }, {
                    "ovs-agent1": false,
                }, {
                    "ovs-agent2": true
                }, {
                    "ovs-agent3": true
                }]);
        });
    });
    it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
        this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
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
        this.testView.clearDataErrorMessage();
        expect($('#noDataReturned').text()).to.equal('');
        expect(this.dataErrorMessage_spy.callCount).to.equal(3);
        this.dataErrorMessage_spy.restore();
    });
});
