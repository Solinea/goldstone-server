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
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:04:24.921Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "abrtd: Init complete, entering main loop"
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:04:23.921Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "abrtd: Init complete, entering main loop"
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:04:22.921Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "abrtd: Init complete, entering main loop"
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:04:21.921Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "abrtd: Init complete, entering main loop"
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:04:20.921Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "abrtd: Init complete, entering main loop"
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:04:17.460Z",
            "syslog_facility": "kernel",
            "syslog_severity": "CRITICAL",
            "host": "rsrc-01",
            "log_message": "kernel: STARTING CRC_T10DIF"
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:03:05.401Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "rpcbind: rpcbind terminating on signal. Restart with \"rpcbind -w\""
        }, {
            "doc_type": "GenericSyslogError",
            "timestamp": "2015-03-18T18:03:03.193Z",
            "syslog_facility": "daemon",
            "syslog_severity": "ERROR",
            "host": "rsrc-01",
            "log_message": "abrtd: Got signal 15, exiting"
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

            this.updateSettingsSpy = sinon.spy(this.testView, "updateSettings");
            this.fetchNowWithResetSpy = sinon.spy(this.testView, "fetchNowWithReset");
            this.fetchNowNoResetSpy = sinon.spy(this.testView, "fetchNowNoReset");

            expect(this.updateSettingsSpy.callCount).to.equal(0);
            expect(this.fetchNowNoResetSpy.callCount).to.equal(0);
            expect(this.fetchNowWithResetSpy.callCount).to.equal(0);

            this.testView.trigger('lookbackSelectorChanged');
            expect(this.updateSettingsSpy.callCount).to.equal(1);
            expect(this.fetchNowWithResetSpy.callCount).to.equal(1);
            expect(this.fetchNowNoResetSpy.callCount).to.equal(0);

            this.testView.trigger('lookbackIntervalReached');
            expect(this.updateSettingsSpy.callCount).to.equal(2);
            expect(this.fetchNowWithResetSpy.callCount).to.equal(1);
            expect(this.fetchNowNoResetSpy.callCount).to.equal(1);

            this.updateSettingsSpy.restore();
            this.fetchNowWithResetSpy.restore();
            this.fetchNowNoResetSpy.restore();
        });
        it('can handle events without an doc_type', function() {
            this.testCollection.reset();
            this.testCollection.add({
                "doc_type": undefined,
                "timestamp": "2015-03-18T18:04:21.921Z",
                "syslog_facility": "daemon",
                "syslog_severity": "WARNING",
                "host": "rsrc-01",
                "log_message": "abrtd: Init complete, entering main loop"
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
                "doc_type": "GenericSyslogError",
                "timestamp": "2015-03-18T18:04:21.921Z",
                "syslog_facility": "daemon",
                "syslog_severity": "ERROR",
                "host": "rsrc-01",
                "log_message": "abrtd: Init complete, entering main loop"
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
                "doc_type": "GenericSyslogError",
                "timestamp": "2015-03-18T18:04:21.921Z",
                "syslog_facility": "daemon",
                "syslog_severity": "ERROR",
                "host": "rsrc-01",
                "log_message": "abrtd: Init complete, entering main loop"
            });
            this.testView.update();
            expect($('svg').find('rect').length).to.equal(1);
            // adding the same item
            this.testCollection.add({
                "doc_type": "GenericSyslogError",
                "timestamp": "2015-03-18T18:04:21.921Z",
                "syslog_facility": "daemon",
                "syslog_severity": "ERROR",
                "host": "rsrc-01",
                "log_message": "abrtd: Init complete, entering main loop"
            });
            // should be the same count
            expect($('svg').find('rect').length).to.equal(1);
            // adding a different item
            this.testCollection.add({
                "doc_type": "GenericSyslogError",
                "timestamp": "2015-03-18T18:04:22.921Z",
                "syslog_facility": "daemon",
                "syslog_severity": "NOTICE",
                "host": "rsrc-02",
                "log_message": "abrtd: Init complete, entering main loop"
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
        it('correctly identifies the lookback range', function() {
            var test1 = this.testView.lookbackRange();
            expect(test1).to.equal(60);
            $('.global-lookback-selector .form-control').val(360);
            var test2 = this.testView.lookbackRange();
            expect(test2).to.equal(360);
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
