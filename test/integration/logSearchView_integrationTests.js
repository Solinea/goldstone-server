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

describe('logSearchView.js spec', function() {
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
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        this.testView = new LogSearchPageView({
            el: '.testContainer',
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
            expect($(this.testView.el).text()).to.include('Log BrowserEvent BrowserApi BrowserLogs vs Time×CloseLog Severity FiltersUncheck log-type to hide from displayExitLog EventsLog Browser102550100 records per pageSearch:TimestampSyslog SeverityComponentHostMessage');
        });
        it('view responds to global selector changes', function() {
            this.getGlobalLookbackRefresh_spy = sinon.spy(this.testView, "getGlobalLookbackRefresh");
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(0);

            goldstone.globalLookbackRefreshSelectors.trigger('globalLookbackChange');
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(1);

            goldstone.globalLookbackRefreshSelectors.trigger('globalRefreshChange');
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(2);

            $('#global-refresh-range').val('-1');
            this.testView.getGlobalLookbackRefresh();
            this.testView.scheduleInterval();
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(3);

            this.getGlobalLookbackRefresh_spy.restore();
        });
    });

});
