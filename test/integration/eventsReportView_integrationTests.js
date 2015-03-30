/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('eventsReportView.js spec', function() {
    beforeEach(function() {

        this.dummyData = JSON.stringify({
            "count": 2,
            "next": null,
            "previous": null,
            "results": [{
                "event_type": "GenericSyslogError",
                "@timestamp": "2015-03-26T23:19:31.381Z",
                "syslog_facility": "kernel",
                "syslog_severity": "ERROR",
                "host": "rsrc-01",
                "log_message": "kernel: kvm: 5222: cpu0 unhandled rdmsr: 0x345"
            }, {
                "event_type": "GenericSyslogError",
                "@timestamp": "2015-03-26T23:19:01.006Z",
                "syslog_facility": "kernel",
                "syslog_severity": "ERROR",
                "host": "rsrc-01",
                "log_message": "kernel: kvm: 4103: cpu0 unhandled rdmsr: 0x345"
            }]
        });

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
            expect(this.testView.defaults.url).to.equal('/logging/events/search?host=testNode-01&@timestamp__range={"gte":' + lookback + ',"lte":' + now + '}');

            // one more time for Ringo
            now = +new Date();
            this.testView.defaults.globalLookback = 100;
            lookback = now - (1000 * 60 * this.testView.defaults.globalLookback);
            this.testView.urlGen();
            expect(this.testView.defaults.globalLookback).to.equal(100);
            expect(this.testView.defaults.hostName).to.equal('testNode-01');
            expect(this.testView.defaults.url).to.equal('/logging/events/search?host=testNode-01&@timestamp__range={"gte":' + lookback + ',"lte":' + now + '}');
        });
        it('should know what to do with received data', function() {
            expect(this.testView.dataPrep(this.dummyData)).to.be.an('object');
            expect(this.testView.dataPrep(this.dummyData)).to.deep.equal({
                recordsTotal: 2,
                recordsFiltered: 2,
                result: [
                    ["2015-03-26T23:19:31.381Z", "GenericSyslogError", "kernel: kvm: 5222: cpu0 unhandled rdmsr: 0x345", "ERROR", "rsrc-01", "kernel"],
                    ["2015-03-26T23:19:01.006Z", "GenericSyslogError", "kernel: kvm: 4103: cpu0 unhandled rdmsr: 0x345", "ERROR", "rsrc-01", "kernel"]
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
