/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('eventsReportView.js spec', function() {
    beforeEach(function() {

        this.dummyData = '{ "count": 30, "next": "http://localhost:8000/core/events?source_name=compute-01&created__gte=1415673772907&page_size=10&created__lte=1415760172907&message__prefix=26&page=2", "previous": null, "results": [ { "id": "2aa3b533-094d-4f82-8543-8add8bad6552", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled rdmsr: 0x345", "created": "2014-11-11T19:15:23.000135+00:00" },{"id": "e982a3bf-4c33-4fde-b2b3-93d6d64d0654", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c3 data 0", "created": "2014-11-11T19:15:23.000140+00:00" }, {"id": "f54ae0ed-a446-47a6-a021-cfdb6cd357ad", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x684 data 0", "created": "2014-11-11T19:15:23.000140+00:00"}, {"id": "3bdba2e2-af0c-4be0-b90b-63fb5df89d57", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x681 data 0", "created": "2014-11-11T19:15:23.000139+00:00"}, {"id": "3b6759e2-f273-4d1e-be88-91aaa0456474", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c0 data 0", "created": "2014-11-11T19:15:23.000139+00:00"}, {"id": "95f78aaa-a90f-4538-9b4e-455cd15e4bdd", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x683 data 0", "created": "2014-11-11T19:15:23.000140+00:00"}, {"id": "79ff4e7e-77b0-460d-8086-a013af73297a", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c2 data 0", "created": "2014-11-11T19:15:23.000139+00:00"}, {"id": "2339a2e7-e491-4d5f-b280-ed8789ffe201", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c1 data 0", "created": "2014-11-11T19:15:23.000139+00:00"}, {"id": "dd187053-c314-4cf8-9854-bfa82fe1ee35", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x682 data 0", "created": "2014-11-11T19:15:23.000139+00:00"}, {"id": "53d8a33f-e870-4b07-9f43-545f5b10e057", "event_type": "GenericSyslogError", "source_id": "f8ccefbb-f969-4aff-9d59-ff4b457e8259", "source_name": "compute-01", "message": "kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x680 data 0", "created": "2014-11-11T19:15:23.000139+00:00"}            ]}';

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
                "Content-Type": "application/json"
            },
            this.dummyData
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new EventsReportView({
            el: '.testContainer',
            width: 800,
            nodeName: 'testNode-01'
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
            expect(this.testView.el).to.equal('.testContainer');
            expect($(this.testView.el).text()).to.equal(' Events Report102550100 records per pageSearch:Processing...CreatedEvent TypeMessage');
        });
    });
    describe('dataTable is constructed and', function() {
        it('should exist', function() {
            expect($('#events-report-table').length).to.equal(1);
        });
        it('should have 3 headers', function() {
            expect($('.sorting').length).to.equal(3);
        });
        it('should have a search box', function() {
            expect($('input.form-control.input-sm').length).to.equal(1);
        });
        it('should default to showing 10 records per page', function() {
            expect($('select.form-control').val()).to.equal('10');
        });
        it('properly constructs lookup urls', function() {
            var now = +new Date();
            this.testView.defaults.globalLookback = 10;
            var lookback = now - (1000 * 60 * this.testView.defaults.globalLookback);
            this.testView.urlGen();
            expect(this.testView.defaults.globalLookback).to.equal(10);
            expect(this.testView.defaults.hostName).to.equal('testNode-01');
            expect(this.testView.defaults.url).to.equal("/core/events?source_name=testNode-01&created__lte=" + now + "&created__gte=" + lookback);

            // one more time for Ringo
            now = +new Date();
            this.testView.defaults.globalLookback = 100;
            lookback = now - (1000 * 60 * this.testView.defaults.globalLookback);
            this.testView.urlGen();
            expect(this.testView.defaults.globalLookback).to.equal(100);
            expect(this.testView.defaults.hostName).to.equal('testNode-01');
            expect(this.testView.defaults.url).to.equal("/core/events?source_name=testNode-01&created__lte=" + now + "&created__gte=" + lookback);
        });
        it('should know what to do with received data', function() {
            expect(this.testView.dataPrep(this.dummyData)).to.be.an('object');
            expect(this.testView.dataPrep(this.dummyData)).to.deep.equal({
                recordsTotal: 30,
                recordsFiltered: 30,
                result: [
                    ['2014-11-11T19:15:23.000135+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled rdmsr: 0x345', '2aa3b533-094d-4f82-8543-8add8bad6552', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000140+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c3 data 0', 'e982a3bf-4c33-4fde-b2b3-93d6d64d0654', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000140+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x684 data 0', 'f54ae0ed-a446-47a6-a021-cfdb6cd357ad', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000139+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x681 data 0', '3bdba2e2-af0c-4be0-b90b-63fb5df89d57', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000139+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c0 data 0', '3b6759e2-f273-4d1e-be88-91aaa0456474', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000140+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x683 data 0', '95f78aaa-a90f-4538-9b4e-455cd15e4bdd', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000139+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c2 data 0', '79ff4e7e-77b0-460d-8086-a013af73297a', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000139+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x6c1 data 0', '2339a2e7-e491-4d5f-b280-ed8789ffe201', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000139+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x682 data 0', 'dd187053-c314-4cf8-9854-bfa82fe1ee35', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01'],
                    ['2014-11-11T19:15:23.000139+00:00', 'GenericSyslogError', 'kernel: kvm: 26303: cpu0 unhandled wrmsr: 0x680 data 0', '53d8a33f-e870-4b07-9f43-545f5b10e057', 'f8ccefbb-f969-4aff-9d59-ff4b457e8259', 'compute-01']
                ]
            });
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
