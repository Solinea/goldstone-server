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

describe('NodeReportView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="test-container"></div>' +
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
        }, 'OK']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        // blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";app = {};
        goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        this.testView = new NodeReportView({
            el: '.test-container',
            node_uuid: 'power-of-greyskull'
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
        });
        it('should exist', function() {
            this.testView.render();
        });
        it('view responds to global selector changes', function() {
            this.getGlobalLookbackRefresh_spy = sinon.spy(this.testView, "getGlobalLookbackRefresh");
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(0);

            goldstone.globalLookbackRefreshSelectors.trigger('globalRefreshChange');
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(1);

            goldstone.globalLookbackRefreshSelectors.trigger('globalLookbackChange');
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(2);

            $('#global-refresh-range').val('-1');
            this.testView.getGlobalLookbackRefresh();
            this.testView.scheduleInterval();
            expect(this.getGlobalLookbackRefresh_spy.callCount).to.equal(3);

            this.getGlobalLookbackRefresh_spy.restore();
        });
        it('should correctly parse the node from the url', function() {
            var test1 = this.testView.constructHostName('http://localhost:8000/report/node/controller-01.lab.solinea.com');
            var test2 = this.testView.constructHostName('http://localhost:8000/report/node/controller-01');
            var test3 = this.testView.constructHostName('http://localhost:8000/report/node/controller-01.a.b.c.d.e.f.g.h');
            var test4 = this.testView.constructHostName('http://localhost:8000/report/node/');
            expect(test1).to.equal('controller-01');
            expect(test2).to.equal('controller-01');
            expect(test3).to.equal('controller-01');
            expect(test4).to.equal('');
        });
        it('should show/hide report sections accordingly', function() {
            this.testView.initializeChartButtons();
            $('#headerBar').click();
            expect($('#servicesReport').css('display')).to.equal('block');
            expect($('#reportsReport').css('display')).to.equal('none');
            expect($('#eventsReport').css('display')).to.equal('none');
            $('.reportsButton').click();
            expect($('#servicesReport').css('display')).to.equal('block');
            expect($('#reportsReport').css('display')).to.equal('block');
            expect($('#eventsReport').css('display')).to.equal('none');
            $('.eventsButton').click();
            expect($('#servicesReport').css('display')).to.equal('block');
            expect($('#reportsReport').css('display')).to.equal('block');
            expect($('#eventsReport').css('display')).to.equal('block');
        });
    });
});
