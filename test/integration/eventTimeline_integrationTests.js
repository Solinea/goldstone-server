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

        this.testCollection = new EventTimelineCollection({
        });
        this.testCollection.add([{
            "id": "045ab8d4-1fe8-421b-90fe-6097ecb35465",
            "event_type": "OpenStackSyslogError",
            "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "message": "2014-10-28 22:11:11.485 2783 ... [instance: a28776ec-15e6-4913-b4db-d23c1da57b40] ",
            "created": "2014-10-28T22:11:11.000487+00:00"
        }, {
            "id": "a05c6600-a9bc-4b1c-a8ad-b4d1979ef6bc",
            "event_type": "OpenStackSyslogError",
            "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "message": "2014-10-28 22:11:10.826 2783 ERROR ... nova.compute.manager [instance: a28776ec-15e6-4913-b4db-d23c1da57b40] ",
            "created": "2014-10-28T22:11:10.000827+00:00"
        }, {
            "id": "ba20ff69-2b76-4501-905a-4f988db03531",
            "event_type": "OpenStackSyslogError",
            "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "message": "2014-10-28 22:11:10.822 2783 ERROR ...e6-4913-b4db-d23c1da57b40] ",
            "created": "2014-10-28T22:11:10.000823+00:00"
        }, {
            "id": "08881714-2447-4bce-b8c2-84fefd4b0716",
            "event_type": "OpenStackSyslogError",
            "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "message": "2014-10-28 22:11:10.824 2783...t#0122014-10-28 22:11:10.824 2783 TRACE nova.compute.manager ",
            "created": "2014-10-28T22:11:10.000824+00:00"
        }, {
            "id": "a21b6bdb-a505-42cd-856f-72c445af9790",
            "event_type": "OpenStackSyslogError",
            "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "message": "2014-10-28 22:11:10.989 2783 ERROR nova.virt.libvirt.driver destroy, instance disappeared.",
            "created": "2014-10-28T22:11:10.000989+00:00"
        }, {
            "id": "22dd3391-33b2-4878-be94-310e3cde5c00",
            "event_type": "GenericSyslogError",
            "source_id": "adf65eb9-88d9-418a-b100-0cf020d55867",
            "message": "kernel: kvm: 13513: cpu0 unhandled wrmsr: 0x6c0 data 0",
            "created": "2014-10-28T22:10:43.000096+00:00"
        }, {
            "id": "b6ba37b1-5d0e-4046-bfbe-5a6672999975",
            "event_type": "GenericSyslogError",
            "source_id": "adf65eb9-88d9-418a-b100-0cf020d55867",
            "message": "kernel: kvm: 13513: cpu0 unhandled wrmsr: 0x6c3 data 0",
            "created": "2014-10-28T22:10:43.000096+00:00"
        }, {
            "id": "a36dfdfc-b15a-45b7-98a3-b288b653a339",
            "event_type": "GenericSyslogError",
            "source_id": "adf65eb9-88d9-418a-b100-0cf020d55867",
            "message": "kernel: kvm: 13513: cpu0 unhandled wrmsr: 0x6c2 data 0",
            "created": "2014-10-28T22:10:43.000096+00:00"
        }]);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new EventTimelineView({
            collection: this.testCollection,
            el: '.testContainer',
            chartTitle: "Test Chart Title",
            width: 800
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
            expect(this.testCollection.length).to.equal(9);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(10);
            this.testCollection.pop();
            expect(this.testCollection.length).to.equal(9);
        });
        it('should parse appropriate', function() {
            var testData = {a: "blah", b:"wah", results:[1,2,3]};
            testData = {a: "blah", b:"wah", results:[1,2,3], next: null};
            var test2 = this.testCollection.parse(testData);
            expect(test2).to.deep.equal([1,2,3]);
            testData = {a: "blah", b:"wah", results:[1,2,3], next: 'fantastic/core/urls/forever'};
            var test3 = this.testCollection.parse(testData);
            expect(test3).to.deep.equal([1,2,3]);
        });
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
            expect($('.form-control').text()).to.equal("15 minutes1 hour6 hours1 day5 seconds15 seconds30 seconds1 minute5 minutes");

        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            expect($('svg').length).to.equal(1);
            expect($('g').find('.axis').text()).to.equal('');
            expect($('.panel-title').text().trim()).to.equal('Test Chart Title');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle events without an event_type', function() {
                this.testCollection.reset();
                this.testCollection.add({
                "id": "a05c6600-a9bc-4b1c-a8ad-b4d1979ef6bc",
                "event_type": undefined,
                "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
                "message": "2014-10-28 22:11:10.826 2783 ERROR ... nova.compute.manager [instance: a28776ec-15e6-4913-b4db-d23c1da57b40] ",
                "created": "2014-10-28T22:11:10.000827+00:00"
            });
                this.testView.update();
                expect($('.form-control').text()).to.equal("15 minutes1 hour6 hours1 day5 seconds15 seconds30 seconds1 minute5 minutesUnspecified Error Type");
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
            this.testCollection.add({
                "id": "a05c6600-a9bc-4b1c-a8ad-b4d1979ef6bc",
                "event_type": "OpenStackSyslogError",
                "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
                "message": "2014-10-28 22:11:10.826 2783 ERROR ... nova.compute.manager [instance: a28776ec-15e6-4913-b4db-d23c1da57b40] ",
                "created": "2014-10-28T22:11:10.000827+00:00"
            });
            this.testView.update();
            this.testView.redraw();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(3);
            this.update_spy.restore();
        });
            it('sets refresh rate appropriately', function() {
                // defaults to 30sec
                expect($('#eventAutoRefreshInterval').val()).to.equal('30');
                $('#eventAutoRefreshInterval').val(5);
                expect($('#eventAutoRefreshInterval').val()).to.equal('5');
                $('#eventAutoRefreshInterval').val(15);
                expect($('#eventAutoRefreshInterval').val()).to.equal('15');
                $('#eventAutoRefreshInterval').val(30);
                expect($('#eventAutoRefreshInterval').val()).to.equal('30');
                $('#eventAutoRefreshInterval').val(60);
                expect($('#eventAutoRefreshInterval').val()).to.equal('60');
                $('#eventAutoRefreshInterval').val(300);
                expect($('#eventAutoRefreshInterval').val()).to.equal('300');
                // can't set a value not in the list of choices
                $('#eventAutoRefreshInterval').val(301);
                expect($('#eventAutoRefreshInterval').val()).to.equal(null);
            });
            it('populates the event filters', function() {
                // defaults to 30sec
                expect($('#populateEventFilters').children().length).to.equal(0);
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

            it('appends rectangles and removes based on filtes', function() {
                expect($('svg').find('rect').length).to.equal(0);
                this.testCollection.reset();
                this.testCollection.add({
                    "id": "b6ba37b1-5d0e-4046-bfbe-5a6672999975",
                    "event_type": "GenericSyslogError",
                    "source_id": "adf65eb9-88d9-418a-b100-0cf020d55867",
                    "message": "kernel: kvm: 13513: cpu0 unhandled wrmsr: 0x6c3 data 0",
                    "created": "2014-10-28T22:10:43.000096+00:00"
                });
                this.testView.update();
                expect($('svg').find('rect').length).to.equal(1);
                // adding the same item
                this.testCollection.add({
                    "id": "b6ba37b1-5d0e-4046-bfbe-5a6672999975",
                    "event_type": "GenericSyslogError",
                    "source_id": "adf65eb9-88d9-418a-b100-0cf020d55867",
                    "message": "kernel: kvm: 13513: cpu0 unhandled wrmsr: 0x6c3 data 0",
                    "created": "2014-10-28T22:10:43.000096+00:00"
                });
                // should be the same count
                expect($('svg').find('rect').length).to.equal(1);
                // adding a different item
                this.testCollection.add({
                    "id": "b6ba37b1-5d0e-5046-bfbe-5a6672999975",
                    "event_type": "GenericSyslogError",
                    "source_id": "3df65eb9-88d9-418a-b100-0cf020d55867",
                    "message": "kernel: kvm: 13513: cpu0 unhandled wrmsr: 0x6c3 data 0",
                    "created": "2014-10-28T22:10:42.000096+00:00"
                });
                this.testView.update();
                // should NOT be the same count
                expect($('svg').find('rect').length).to.equal(2);
                expect($('.form-control').text()).to.equal("15 minutes1 hour6 hours1 day5 seconds15 seconds30 seconds1 minute5 minutesGeneric Syslog Error");
                // responds to click events
                expect($('#GenericSyslogError').prop('checked')).to.equal(true);
                $('#GenericSyslogError').click();
                expect($('#GenericSyslogError').prop('checked')).to.equal(false);
                expect($('#GenericSyslogErr').prop('checked')).to.equal(undefined);
            });
    });
});
