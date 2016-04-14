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

        this.clock = sinon.useFakeTimers(3600000);

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith('GET', '/core/api-calls/?@timestamp__range={"gte":0,"lte":3600000}&interval=60s&component=cinder', [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify([])
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new ApiPerfCollection({
            componentParam: 'cinder',
            urlBase: '/core/api-calls/'
        });

        this.testView = new ApiPerfView({
            chartTitle: "Tester API Performance",
            collection: this.testCollection,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: 'body',
            width: $('body').width(),
            yAxisLabel: 'yAxisTest'
        });
    });
    afterEach(function() {
        $('body').html('');
        // this.server.respond();
        this.server.restore();
        this.clock.restore();
    });

    describe('collection is constructed', function() {
        it('should exist', function() {
            this.server.respond();
            this.server.respond();
            var dataTest = {
                aggregations: {
                    per_interval: {
                        buckets: {
                            'hello': 'hi'
                        }
                    }
                }
            };
            var dataTest1 = {
                'hello': 'hi'
            };
            expect(this.testCollection.preProcessData(dataTest)).to.deep.equal({
                'hello': 'hi'
            });
            expect(this.testCollection.preProcessData(dataTest1)).to.deep.equal([]);
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            this.server.respond();
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('body');
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testCollection.reset();
            this.testCollection.add([{
                doc_count: 15,
                key: 145255857000,
                statistics: {
                    avg: 0.029311533333333337,
                    count: 15,
                    max: 0.062048,
                    min: 0.001824,
                    sum: 0.43967300000000004
                }
            }]);
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.legend-items').find('text').text()).to.include('Min');
            expect($('g.legend-items').find('text').text()).to.include('Max');
            expect($('g.legend-items').find('text').text()).to.include('Avg');
            expect($('.panel-title').text().trim()).to.equal('Tester API Performance');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            this.testCollection.reset();
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(1);
            this.update_spy.restore();
        });
        it('appends dataErrorMessages to container', function() {
            this.testView.dataErrorMessage('this is a test');
            this.testView.dataErrorMessage('number two test');
        });
    });
});
