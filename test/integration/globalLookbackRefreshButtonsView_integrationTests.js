/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

// basic sanity check.
// base object is tested in apiPerfReportView_integrationTests.js

describe('globalLookbackRefreshButtonsView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new GlobalLookbackRefreshButtonsView({
            el: '.test-container',
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.test-container');
            expect($(this.testView.el).text()).to.include('30srefresh 1mrefresh 5mrefresh offlookback 15mlookback 1hlookback 6hlookback 1d');
        });
    });
    describe('view takes optional parameters for lookback/refresh values', function() {
        it('should instantiate the basic default values if none supplied', function() {
            // clear existing selectors on page
            $('body').html('<div class="test-container"></div>');
            this.testView = new GlobalLookbackRefreshButtonsView({
                el: '.test-container',
            });
            expect($(this.testView.el).text()).to.equal(' refresh 30srefresh 1mrefresh 5mrefresh offlookback 15mlookback 1hlookback 6hlookback 1d');
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
            expect($(this.testView.el).text()).to.equal(' refresh 30srefresh 1mrefresh 5mrefresh offlookback 15mlookback 1hlookback 6hlookback 1d');
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
            expect($(this.testView.el).text()).to.equal(' refresh 30srefresh 1mrefresh 5mrefresh offlookback 15mlookback 1hlookback 6hlookback 1d');
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
            expect($(this.testView.el).text()).to.equal(' refresh 30srefresh 1mrefresh 5mrefresh offtentwentythirty');
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
            expect($(this.testView.el).text()).to.equal(' twentyfortysixtylookback 15mlookback 1hlookback 6hlookback 1d');
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
