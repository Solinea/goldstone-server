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

describe('HypervisorVmCpu spec', function() {
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

        this.testCollection = new HypervisorVmCpuCollection({
            url: '/something/fancy'
        });

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection.reset();
        this.testCollection.add([{
            date: 1412812619263,

            user: [{
                vm1: 50,
                vm2: 19,
                vm3: 11
            }],
            system: [{
                vm1: 10,
                vm2: 79,
                vm3: 31
            }],
            wait: [{
                vm1: 80,
                vm2: 39,
                vm3: 61
            }]

        }, {
            date: 1412912619263,

            user: [{
                vm1: 80,
                vm2: 29,
                vm3: 51
            }],
            system: [{
                vm1: 80,
                vm2: 59,
                vm3: 21
            }],
            wait: [{
                vm1: 70,
                vm2: 49,
                vm3: 71
            }]

        }, {
            date: 1413012619263,

            user: [{
                vm1: 60,
                vm2: 29,
                vm3: 51
            }],
            system: [{
                vm1: 80,
                vm2: 39,
                vm3: 81
            }],
            wait: [{
                vm1: 30,
                vm2: 79,
                vm3: 51
            }]
        }]);

        this.testView = new HypervisorVmCpuView({
            collection: this.testCollection,
            el: '.testContainer',
            width: $('.testContainer').width(),
            axisLabel: "CoresTest"
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
            expect(this.testCollection.length).to.equal(3);
            this.testCollection.add({
                date: 1413012619263,

                user: [{
                    vm1: 60,
                    vm2: 29,
                    vm3: 51
                }],
                system: [{
                    vm1: 80,
                    vm2: 39,
                    vm3: 81
                }],
                wait: [{
                    vm1: 30,
                    vm2: 79,
                    vm3: 51
                }]
            });
            expect(this.testCollection.length).to.equal(4);
            this.testCollection.parse(dataTest);
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse appropriately', function() {
            var test = {
                monkeys: 'bananas',
                next: null,
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(test);
            // TODO: update when this is returning real data
            expect(test1).to.deep.equal(test1);
        });
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('should append buttons', function() {
            this.testView.refresh();
            $(this.el).find('.btn-sm').click();
            expect($('.btn-sm').length).to.equal(3);
            $(this.el).find('.active').next().click();
            this.testView.refresh();
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
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            this.testView.update();
            expect($('#noDataReturned').text()).to.equal('NoDataReturned');
            this.testCollection.add([{
                date: 1412812619263,

                user: [{
                    vm1: 50,
                    vm2: 19,
                    vm3: 11
                }],
                system: [{
                    vm1: 10,
                    vm2: 79,
                    vm3: 31
                }],
                wait: [{
                    vm1: 80,
                    vm2: 39,
                    vm3: 61
                }]

            }, {
                date: 1412912619263,

                user: [{
                    vm1: 80,
                    vm2: 29,
                    vm3: 51
                }],
                system: [{
                    vm1: 80,
                    vm2: 59,
                    vm3: 21
                }],
                wait: [{
                    vm1: 70,
                    vm2: 49,
                    vm3: 71
                }]

            }]);
            this.testView.update();
            this.testCollection.trigger('sync');
            expect($(this.testView.el).text()).to.include('UserSystemWait');
            $(this.testView.el).find('button').next().click();
            expect($(this.testView.el).text()).to.include('percent utilization (%)vm1vm2vm3');
            expect(this.update_spy.callCount).to.equal(3);
            expect($('g').find('text').text()).to.include('0102030405060708090100percent utilization (%)vm1vm2vm3');
            this.update_spy.restore();
        });
    });
});
