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

describe('UtilizationMem.js spec', function() {
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

        this.testCollection = new HypervisorCollection({
            url: '/something/fancy'
        });

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new HypervisorView({
            collection: this.testCollection,
            el: '.testContainer',
            width: $('.testContainer').width(),
            axisLabel: "CoresTest"
        });

        this.testCollection.reset();
        this.testCollection.add([{
            "date": 1412815619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }, {
            "date": 1412818619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }, {
            "date": 1412823619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }, {
            "date": 1412828619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }]);
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
            expect(this.testCollection.length).to.equal(4);
            this.testCollection.add({
                metric_type: "gauge",
                name: "os.mem.free",
                node: "compute-02",
                timestamp: 1415072450561,
                unit: "bytes",
                value: 31947214848
            });
            expect(this.testCollection.length).to.equal(5);
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
        it('should provide tooltips', function() {
            this.testView.update();
            expect($('rect').length).to.equal(16);
            expect($('.d3-tip').length).to.equal(1);
            expect($('.d3-tip').css('opacity')).to.equal('0');
            $($('rect')[5]).mouseover();
            $($('rect')[5]).mouseout();
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
            "date": 1412815619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }, {
            "date": 1412818619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }, {
            "date": 1412823619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }, {
            "date": 1412828619263,
            "VM1": 41.62,
            "VM2": 22.36,
            "VM3": 25.58,
            "VM4": 9.13,
        }]);
            this.testView.update();
            this.testCollection.trigger('sync');
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(3);
            expect($('g').find('text').text()).to.equal('0102030405060708090Total CoresTest: 98.6910/08/201410/08/201410/08/201410/08/2014');
            this.update_spy.restore();
        });
    });
});
