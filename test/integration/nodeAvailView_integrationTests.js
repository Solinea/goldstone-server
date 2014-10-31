/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - nodeAvailView.js

describe('nodeAvailView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new NodeAvailCollection({
            url: '/something/fancy',
        });
        this.testCollection.add([{"uuid": "46b24373-eedc-43d5-9543-19dea317d88f", "name": "compute-01", "created": "2014-10-27T19:27:17Z", "updated": "2014-10-28T18:33:18Z", "last_seen_method": "LOGS", "admin_disabled": false, "error_count": 10, "warning_count": 4, "info_count": 33, "audit_count": 551, "debug_count": 0, "polymorphic_ctype": 12}, {"uuid": "d0656d75-1c26-48c5-875b-9130dd8892f4", "name": "compute-02", "created": "2014-10-27T19:27:17Z", "updated": "2014-10-28T18:33:17Z", "last_seen_method": "LOGS", "admin_disabled": false, "error_count": 0, "warning_count": 0, "info_count": 0, "audit_count": 448, "debug_count": 0, "polymorphic_ctype": 12},{"uuid": "46b24373-eedc-43d5-9543-19dea317d88f", "name": "compute-01", "created": "2014-10-27T19:27:17Z", "updated": "2014-10-28T18:33:18Z", "last_seen_method": "LOGS", "admin_disabled": false, "error_count": 10, "warning_count": 4, "info_count": 33, "audit_count": 551, "debug_count": 0, "polymorphic_ctype": 12}]);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new NodeAvailView({
            collection: this.testCollection,
            h: {
                "main": 450,
                "swim": 50
            },
            el: '.testContainer',
            chartTitle: "Test Chart Title",
            width: 500
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(3);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(4);
            this.testCollection.pop();
            expect(this.testCollection.length).to.equal(3);
            this.testCollection.setXhr();
        });
        it('should parse appropriate', function() {
            var testData = {a: "blah", b:"wah", results:[1,2,3]};
            var test1 = this.testCollection.parse(testData);
            expect(test1).to.deep.equal([1,2,3]);
            testData = {a: "blah", b:"wah", results:[1,2,3], next: null};
            var test2 = this.testCollection.parse(testData);
            expect(test2).to.deep.equal([1,2,3]);
            testData = {a: "blah", b:"wah", results:[1,2,3], next: 'fantastic/loggin/urls/forever'};
            var test3 = this.testCollection.parse(testData);
            expect(test3).to.deep.equal([1,2,3]);
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
            expect($('svg').length).to.equal(1);
            expect($('g').find('.axis').text()).to.equal('DisabledLogsPing Only');
            expect($('.panel-title').text().trim()).to.equal('Test Chart Title');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('#noDataReturned').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(1);
            expect($('#noDataReturned').text()).to.equal('No Data Returned');
            // it doesn't RE-apply 'No Data Returned' if it's already there:
            this.testView.update();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(1);
            expect($('#noDataReturned').text()).to.equal('No Data Returned');
            // it REMOVES 'No Data Returned' if data starts flowing again:
            this.testCollection.add(
                {"uuid": "46b24373-eedc-43d5-9543-19dea317d88f", "name": "compute-01", "created": "2014-10-27T19:27:17Z", "updated": "2014-10-28T18:33:18Z", "last_seen_method": "LOGS", "admin_disabled": true, "error_count": 10, "warning_count": 4, "info_count": 33, "audit_count": 551, "debug_count": 0, "polymorphic_ctype": 12});
            this.testView.update();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(3);
            this.update_spy.restore();
        });
        it('sets refresh rate appropriately', function() {
            // defaults to 30sec
            expect($('#nodeAutoRefreshInterval').val()).to.equal('30');
            $('#nodeAutoRefreshInterval').val(5);
            expect($('#nodeAutoRefreshInterval').val()).to.equal('5');
            $('#nodeAutoRefreshInterval').val(15);
            expect($('#nodeAutoRefreshInterval').val()).to.equal('15');
            $('#nodeAutoRefreshInterval').val(30);
            expect($('#nodeAutoRefreshInterval').val()).to.equal('30');
            $('#nodeAutoRefreshInterval').val(60);
            expect($('#nodeAutoRefreshInterval').val()).to.equal('60');
            $('#nodeAutoRefreshInterval').val(300);
            expect($('#nodeAutoRefreshInterval').val()).to.equal('300');
            // can't set a value not in the list of choices
            $('#nodeAutoRefreshInterval').val(301);
            expect($('#nodeAutoRefreshInterval').val()).to.equal(null);
        });
        it('populates the event filters', function() {
            // defaults to 30sec
            expect($('#populateEventFilters').children().length).to.equal(0);
        });
        it('sums appropriately based on filter and count', function() {
            var testData = {"info_count": 42};
            var test1 = this.testView.sums(testData);
            expect(test1).to.equal(42);

            this.testView.defaults.filter.info_count = false;
            testData = {"info_count": 0};
            var test2 = this.testView.sums(testData);
            expect(test2).to.equal(0);

            this.testView.defaults.filter.info = false;
            testData = {"info_count": 42};
            var test3 = this.testView.sums(testData);
            expect(test3).to.equal(0);
        });
        it('redraws successfully', function() {
            expect(this.testView.redraw).is.a('function');

            this.testView.defaults.dataset = this.testCollection.toJSON();

            this.testView.redraw();
        });
        it('schedules fetches appropriately', function() {
            var timeoutVar = (this.testView.defaults.scheduleTimeout);
            this.scheduleFetch_spy = sinon.spy(this.testView, "scheduleFetch");
            this.testView.scheduleFetch();
            expect(this.testView.defaults.scheduleTimeout).to.equal(timeoutVar + 1);
            // returns in the case of being paused
            this.testView.defaults.animation.pause = true;
            this.testView.scheduleFetch();
            $('#eventSettingsUpdateButton-testContainer').click();
            this.testView.defaults.animation.pause = false;
            $('#eventSettingsUpdateButton-testContainer').click();
            expect(this.scheduleFetch_spy.callCount).to.equal(4);
            this.scheduleFetch_spy.restore();
            expect(this.testView.defaults.scheduleTimeout).to.equal(timeoutVar + 3);
        });
        it('appends circles and removes based on filtes', function() {
            expect($('svg').find('circle').length).to.equal(0);
            this.testCollection.reset();
            this.testCollection.add(
                {"uuid": "46b24373-eedc-43d5-9543-19dea317d88f", "name": "compute-01", "created": "2014-10-27T19:27:17Z", "updated": "2014-10-28T18:33:18Z", "last_seen_method": "LOGS", "admin_disabled": false, "error_count": 10, "warning_count": 4, "info_count": 33, "audit_count": 551, "debug_count": 0, "polymorphic_ctype": 12});
            this.testView.update();
            // this.testView.redraw();
            expect($('svg').find('circle').length).to.equal(1);
            console.log(this.testView.defaults.filter);
            var filt = this.testView.defaults.filter;
            filt = { none: false, debug: false, audit: false, info: false, warning: false, error: false
            };
            // TODO: successfully test removal of circle based on filter
            // this.testCollection.reset();
            // this.testView.update();
            // this.testView.redraw();
            // expect($('svg').find('circle').length).to.equal(1);
        });
    });
});
