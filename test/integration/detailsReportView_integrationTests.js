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
        $('body').html(
            '<div class="panel panel-primary node_details_panel">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Resource Details' +
            '</h3>' +
            '</div>' +
            '</div>' +

            '<div class="panel-body">' +
            '<table id="details-single-rsrc-table" class="table"></table>' +
            '</div>'
        );

        localStorage.setItem('detailsTabData', "[]");

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);



        this.testView = new DetailsReportView({});
    });
    afterEach(function() {
        $('body').html('');
        localStorage.removeItem('detailsTabData');
        this.server.respond();
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
        });
    });
    describe('view functions behave as expected', function() {
        it('draws a search table', function() {
            var testData = {
                results: []
            };
            expect($('.test-container').text()).to.equal('');

        });
    });
});
