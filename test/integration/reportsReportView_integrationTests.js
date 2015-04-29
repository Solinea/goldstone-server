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

describe('reportsReportView.js spec', function() {
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
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new ReportsReportCollection({
            globalLookback: 60,
            nodeName: 'moreCowbell'
        });

        this.testView = new ReportsReportView({
            collection: this.testCollection,
            el: '.test-container',
            width: 800,
            nodeName: 'moreCowbell',
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
            expect($(this.testView.el).text()).to.equal('Reports Available Reports list loading or not available Report DataSelecting a report from the dropdown above will populate this area with the report results.');
        });
    });
    describe('collection parses correctly', function() {
        it('returns an object', function() {
            var test1 = this.testCollection.parse({
                per_name: [1, 2, 3]
            });
            expect(test1).to.deep.equal({
                result: [1, 2, 3]
            });
        });
    });
    describe('view functions behave as expected', function() {
        it('generates urls appropriately', function() {
            var test1 = this.testView.urlGen('gothamCity');
            expect(test1).to.equal('/core/reports/?name=gothamCity&page_size=1&node=moreCowbell');
        });
        it('appends report names to the dropdown appropriately', function() {
            this.populateReportsDropdownSpy = sinon.spy(this.testView, "populateReportsDropdown");
            expect(this.populateReportsDropdownSpy.callCount).to.equal(0);
            expect($('.reports-available-dropdown-menu').text()).to.equal('Reports list loading or not available');
            // can sync with an emptied out collection
            this.testCollection.reset();
            this.testCollection.trigger('sync');
            this.testCollection.add({
                result: []
            });
            this.testCollection.trigger('sync');
            expect($('.reports-available-dropdown-menu').text()).to.equal('No reports available');
            expect(this.populateReportsDropdownSpy.callCount).to.equal(0);
            this.testCollection.reset();
            this.testCollection.add({
                result: [{
                    'bimbo': 1
                }, {
                    'limbo': 1
                }, {
                    'spam': 1
                }]
            });
            this.testCollection.trigger('sync');
            expect($('.reports-available-dropdown-menu').text()).to.equal('bimbolimbospam');
            expect(this.populateReportsDropdownSpy.callCount).to.equal(1);
            this.testCollection.reset();
            this.testCollection.add({
                result: []
            });
            this.testCollection.trigger('sync');
            expect($('.reports-available-dropdown-menu').text()).to.equal('No reports available');
            expect(this.populateReportsDropdownSpy.callCount).to.equal(1);
            this.testCollection.reset();
            this.testCollection.add({
                result: [{
                    'inky': 0
                }, {
                    'blinky': 1
                }, {
                    'clyde': 2
                }]
            });
            this.testCollection.trigger('sync');
            expect($('.reports-available-dropdown-menu').text()).to.equal('inkyblinkyclyde');
            expect(this.populateReportsDropdownSpy.callCount).to.equal(2);
            this.testCollection.reset();
            this.testCollection.add({
                result: [{
                    'one': 1
                }, {
                    'two': 2
                }, {
                    'three': 3
                }]
            });
            this.testCollection.trigger('sync');
            expect($('.reports-available-dropdown-menu').text()).to.equal('onetwothree');
            $('#report-result').click();
            expect(this.populateReportsDropdownSpy.callCount).to.equal(3);
            this.testCollection.reset();
            this.testCollection.add({
                result: []
            });
            this.testCollection.trigger('sync');
            expect($('.reports-available-dropdown-menu').text()).to.equal('No reports available');
            expect(this.populateReportsDropdownSpy.callCount).to.equal(3);
            this.populateReportsDropdownSpy.restore();
        });
        it('draws a search table', function() {
            expect($('.reports-info-container').text()).to.equal('Selecting a report from the dropdown above will populate this area with the report results.');

            var testData = {
                results: []
            };

            this.testView.drawSearchTable('#reports-result-table', testData);
            expect($('.reports-info-container').text()).to.equal('');
            this.testView.drawSearchTable('#reports-result-table', testData);
        });
        it('preps data for the dataTable appropriately', function() {
            expect($('.data-table-header-container').text()).to.equal('');
            var test1 = this.testView.dataPrep([
                8, 6, 7, 5, 'marvin', 3, 0, 9
            ]);
            expect($('.data-table-header-container > th').text()).to.equal('Result');
            $('.data-table-header-container > th').text('');
            var test2 = this.testView.dataPrep({
                0: {
                    'john': 1,
                    'george': 2,
                    'ringo': 3,
                    'george_name': 4,
                    'stu': undefined
                }
            });
            expect($('.data-table-header-container > th').text()).to.equal('george_namejohngeorgeringostu');
            $('.data-table-header-container > th').text('');
            var test3 = this.testView.dataPrep({
                0: {
                    'john': 1,
                    'george': 2,
                    'blah_name': 3,
                    'ringo': 4,
                    'george_name': 5,
                    'stu': undefined,
                    'namename': 6,
                }
            });
            expect($('.data-table-header-container > th').text()).to.equal('namenamegeorge_nameblah_namejohngeorgeringostu');
            expect(test1).to.deep.equal([
                [8],
                [6],
                [7],
                [5],
                ['marvin'],
                [3],
                [0],
                [9]
            ]);
            expect(test2).to.deep.equal([
                [4, 1, 2, 3, '']
            ]);
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
