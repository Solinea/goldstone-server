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

// basic sanity check.
// base object is tested in apiPerfReportView_integrationTests.js

describe('globalLookbackRefreshButtonsView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new GlobalLookbackRefreshButtonsView({});
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect($(this.testView.el).text()).to.include(' lookback 15mlookback 1hlookback 6hlookback 1dlookback 3dlookback 7drefresh 30srefresh 1mrefresh 5mrefresh off');
        });
    });
    describe('view takes optional parameters for lookback/refresh values', function() {
        it('should instantiate the basic default values if none supplied', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
            });
            expect($(this.testView.el).text()).to.equal(' lookback 15mlookback 1hlookback 6hlookback 1dlookback 3dlookback 7drefresh 30srefresh 1mrefresh 5mrefresh off');
        });
        it('in the case of an empty array, should return the default set', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
                lookbackValues: {
                    lookback: [],
                    refresh: []
                }
            });
            expect($(this.testView.el).text()).to.equal(' lookback 15mlookback 1hlookback 6hlookback 1dlookback 3dlookback 7drefresh 30srefresh 1mrefresh 5mrefresh off');
        });
        it('in the case of a lack of lookbackValues, should return the default set', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container'
                // lookbackValues: {
                //     lookback:[],
                //     refresh:[]
                // }
            });
            expect($(this.testView.el).text()).to.equal(' lookback 15mlookback 1hlookback 6hlookback 1dlookback 3dlookback 7drefresh 30srefresh 1mrefresh 5mrefresh off');
        });
        it('should allow for passing in lookback only', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
                lookbackValues: {
                    lookback: [
                        [10, 'ten'],
                        [20, 'twenty'],
                        [30, 'thirty']
                    ],
                    refresh: []
                }
            });
            expect($(this.testView.el).text()).to.equal(' tentwentythirtyrefresh 30srefresh 1mrefresh 5mrefresh off');
        });
        it('should allow for passing in refresh only', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
                lookbackValues: {
                    lookback: [],
                    refresh: [
                        [20, 'twenty'],
                        [40, 'forty'],
                        [60, 'sixty']
                    ]
                }
            });
            expect($(this.testView.el).text()).to.equal(' lookback 15mlookback 1hlookback 6hlookback 1dlookback 3dlookback 7dtwentyfortysixty');
        });
        it('should select the first value as default if not designated', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
                lookbackValues: {
                    lookback: [
                        [10, 'ten'],
                        [20, 'twenty'],
                        [30, 'thirty']
                    ],
                    refresh: [
                        [20, 'twenty'],
                        [40, 'forty'],
                        [60, 'sixty']
                    ]
                }
            });
            expect($('#global-lookback-range').val()).to.equal('10');
            expect($('#global-refresh-range').val()).to.equal('20');
            expect($('#global-lookback-range').text()).to.equal('tentwentythirty');
            expect($('#global-refresh-range').text()).to.equal('twentyfortysixty');
        });
        it('should allow for selection of desired value to show as default', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
                lookbackValues: {
                    lookback: [
                        [10, 'ten'],
                        [20, 'twenty', 'selected'],
                        [30, 'thirty']
                    ],
                    refresh: [
                        [20, 'twenty'],
                        [40, 'forty'],
                        [60, 'sixty', 'selected']
                    ]
                }
            });
            expect($('#global-lookback-range').val()).to.equal('20');
            expect($('#global-refresh-range').val()).to.equal('60');
            expect($('#global-lookback-range').text()).to.equal('tentwentythirty');
            expect($('#global-refresh-range').text()).to.equal('twentyfortysixty');
        });
    });

});
