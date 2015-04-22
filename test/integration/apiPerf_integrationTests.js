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

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new ApiPerfCollection({
            urlPrefix: 'cinder'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

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
            $(this.testView.el).find('#api-perf-info').click();
            expect($('div.popover').length).to.equal(1);
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testCollection.reset();
            this.testCollection.add({
                "1428278400000": {
                    "count": 2521,
                    "response_status": [{
                        "500.0-599.0": 0
                    }, {
                        "400.0-499.0": 0
                    }, {
                        "300.0-399.0": 0
                    }, {
                        "200.0-299.0": 2521
                    }],
                    "stats": {
                        "count": 2521,
                        "min": 0.02646,
                        "sum_of_squares": 133.52903063427792,
                        "max": 4.436677,
                        "sum": 192.028544,
                        "std_deviation": 0.2171740845396112,
                        "std_deviation_bounds": {
                            "upper": 0.5105197454378103,
                            "lower": -0.3581765927206345
                        },
                        "variance": 0.047164582995618196,
                        "avg": 0.07617157635858787
                    }
                }
            }, {
                "1428364800000": {
                    "count": 6634,
                    "response_status": [{
                        "500.0-599.0": 0
                    }, {
                        "400.0-499.0": 0
                    }, {
                        "300.0-399.0": 0
                    }, {
                        "200.0-299.0": 6634
                    }],
                    "stats": {
                        "count": 6634,
                        "min": 0.026544,
                        "sum_of_squares": 136.976272022154,
                        "max": 2.87089,
                        "sum": 427.832964,
                        "std_deviation": 0.12840767674683387,
                        "std_deviation_bounds": {
                            "upper": 0.3213063037499234,
                            "lower": -0.1923244032374121
                        },
                        "variance": 0.016488531447519383,
                        "avg": 0.06449095025625565
                    }
                }
            });
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.legend-items').find('text').text()).to.equal('MinMaxAvg');
            expect($('.panel-title').text().trim()).to.equal('Tester API Performance');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').text()).to.equal('');
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
