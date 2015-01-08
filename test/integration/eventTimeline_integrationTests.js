/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - eventTimeline.js

describe('eventTimeline.js spec', function() {
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
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new EventTimelineCollection({});
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
            var testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3]
            };
            testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: null
            };
            var test2 = this.testCollection.parse(testData);
            expect(test2).to.deep.equal([1, 2, 3]);
            testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: 'fantastic/core/urls/forever'
            };
            var test3 = this.testCollection.parse(testData);
            expect(test3).to.deep.equal([1, 2, 3]);
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
            expect($('g').find('.axis').text()).to.equal('');
            expect($('.panel-title').text().trim()).to.equal('Test Chart Title');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('registers changes on the global lookback/refresh selectors', function() {

            this.clearScheduledSpy = sinon.spy(this.testView, "clearScheduledFetch");
            this.updateSettingsSpy = sinon.spy(this.testView, "updateSettings");
            this.fetchNowWithResetSpy = sinon.spy(this.testView, "fetchNowWithReset");
            this.scheduleFetchSpy = sinon.spy(this.testView, "scheduleFetch");

            expect(this.clearScheduledSpy.callCount).to.equal(0);
            expect(this.updateSettingsSpy.callCount).to.equal(0);
            expect(this.scheduleFetchSpy.callCount).to.equal(0);
            expect(this.fetchNowWithResetSpy.callCount).to.equal(0);

            $('.global-lookback-selector .form-control').trigger('change');
            expect(this.clearScheduledSpy.callCount).to.equal(0);
            expect(this.updateSettingsSpy.callCount).to.equal(1);
            expect(this.fetchNowWithResetSpy.callCount).to.equal(1);
            expect(this.scheduleFetchSpy.callCount).to.equal(0);

            $('.global-refresh-selector .form-control').trigger('change');
            expect(this.clearScheduledSpy.callCount).to.equal(1);
            expect(this.updateSettingsSpy.callCount).to.equal(2);
            expect(this.fetchNowWithResetSpy.callCount).to.equal(1);
            expect(this.scheduleFetchSpy.callCount).to.equal(1);
            this.testView.fetchNowNoReset();
            this.clearScheduledSpy.restore();
            this.updateSettingsSpy.restore();
            this.fetchNowWithResetSpy.restore();
            this.scheduleFetchSpy.restore();
        });
        it('scheduleFetch short-circuits if pause is true', function() {
            this.testView.defaults.scheduleTimeout = null;

            this.scheduleFetchSpy = sinon.spy(this.testView, "scheduleFetch");
            this.clearScheduledSpy = sinon.spy(this.testView, "clearScheduledFetch");

            expect(this.clearScheduledSpy.callCount).to.equal(0);
            expect(this.scheduleFetchSpy.callCount).to.equal(0);

            this.testView.defaults.delay = -1;

            this.testView.scheduleFetch();

            expect(this.clearScheduledSpy.callCount).to.equal(1);
            expect(this.scheduleFetchSpy.callCount).to.equal(1);
            expect(this.testView.defaults.scheduleTimeout).to.equal(null);

            this.testView.defaults.delay = 1;
            this.testView.scheduleFetch();

            expect(this.clearScheduledSpy.callCount).to.equal(2);
            expect(this.scheduleFetchSpy.callCount).to.equal(2);
            expect(this.testView.defaults.scheduleTimeout).to.not.equal(null);

            this.scheduleFetchSpy.restore();
            this.clearScheduledSpy.restore();
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
            expect($('.form-control').text()).to.equal("Unspecified Error Typerefresh 15srefresh 30srefresh 1mrefresh 5mrefresh offlookback 15mlookback 1hlookback 6hlookback 1d");
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('');
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
                "id": "a05c6600-a9bc-4b1c-a8ad-b4d1979ef6bc",
                "event_type": "OpenStackSyslogError",
                "source_id": "46b24373-eedc-43d5-9543-19dea317d88f",
                "message": "2014-10-28 22:11:10.826 2783 ERROR ... nova.compute.manager [instance: a28776ec-15e6-4913-b4db-d23c1da57b40] ",
                "created": "2014-10-28T22:11:10.000827+00:00"
            });
            this.testView.update();
            this.testView.redraw();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(3);
            this.update_spy.restore();
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
        it('appends rectangles and removes based on filters', function() {
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
            expect($('.form-control').text()).to.equal("Generic Syslog Errorrefresh 15srefresh 30srefresh 1mrefresh 5mrefresh offlookback 15mlookback 1hlookback 6hlookback 1d");
            // responds to click events
            expect($('#GenericSyslogError').prop('checked')).to.equal(true);
            $('#GenericSyslogError').click();
            expect($('#GenericSyslogError').prop('checked')).to.equal(false);
            expect($('#GenericSyslogErr').prop('checked')).to.equal(undefined);
        });
        it('correctly identifies if refresh is selected', function() {
            var test1 = this.testView.isRefreshSelected();
            expect(test1).to.equal(true);
            $('.global-refresh-selector .form-control').val(-1);
            var test2 = this.testView.isRefreshSelected();
            expect(test2).to.equal(false);
        });
        it('correctly identifies the lookback range', function() {
            var test1 = this.testView.lookbackRange();
            expect(test1).to.equal(60);
            $('.global-lookback-selector .form-control').val(360);
            var test2 = this.testView.lookbackRange();
            expect(test2).to.equal(360);
        });
        it('correctly identifies the refresh rate', function() {
            var test1 = this.testView.refreshInterval();
            expect(test1).to.equal(30);
            $('.global-refresh-selector .form-control').val(60);
            var test2 = this.testView.refreshInterval();
            expect(test2).to.equal(60);
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            expect($('.popup-message').text()).to.equal('');
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
});
