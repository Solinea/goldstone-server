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

describe('cpuResourceView.js spec', function() {
    beforeEach(function() {

        this.tesetData = [{
            "name": "nova.hypervisor.vcpus",
            "region": "RegionOne",
            "value": 16,
            "metric_type": "gauge",
            "@timestamp": "2015-04-07T17:21:48.285186+00:00",
            "unit": "count"
        }, {
            "name": "nova.hypervisor.vcpus_used",
            "region": "RegionOne",
            "value": 7,
            "metric_type": "gauge",
            "@timestamp": "2015-04-07T17:21:48.285186+00:00",
            "unit": "count"
        }, {
            "name": "nova.hypervisor.vcpus",
            "region": "RegionOne",
            "value": 16,
            "metric_type": "gauge",
            "@timestamp": "2015-04-07T17:20:48.087410+00:00",
            "unit": "count"
        }, {
            "name": "nova.hypervisor.vcpus_used",
            "region": "RegionOne",
            "value": 7,
            "metric_type": "gauge",
            "@timestamp": "2015-04-07T17:20:48.087410+00:00",
            "unit": "count"
        }];

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

        this.testCollection = new CpuResourceCollection({
            urlPrefix: '/something/fancy'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new StackedBarChartView({
            chartTitle: "Test Cpu Resources",
            collection: this.testCollection,
            featureSet: 'cpu',
            height: 300,
            infoCustom: 'novaCpuResources',
            el: '.testContainer',
            width: $('.testContainer').width(),
            yAxisLabel: 'Test Y Axis Label'
        });

        this.testCollection.reset();
        this.testCollection.add(this.tesetData);
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('view dataPrep', function() {
        it('prepares JSON payload for rendering', function() {
            // CPU Resources chart data prep
            // {timestamp: [used, phys, virt]}
            var test1 = this.testView.dataPrep(this.testCollection.toJSON());

            expect(test1).to.deep.equal(
                [{
                    "eventTime": 1428427308285,
                    "Used": 7,
                    "Physical": 16,
                    // "Virtual": 23904
                }, {
                    "eventTime": 1428427248087,
                    "Used": 7,
                    "Physical": 16,
                    // "Virtual": 23904
                }]);
        });
    });
    describe('view specialInit', function() {
        it('set Axis', function() {
            this.testView.specialInit();
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
            this.testCollection.add(this.tesetData);
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(3);
            expect($('g').find('text').text()).to.equal('10:21:15:30:450246810121416182022PhysicalUsed');
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
