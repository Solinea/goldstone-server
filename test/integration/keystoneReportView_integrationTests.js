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

describe('keystoneReportView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        app = {};
        app.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";
        this.testView = new KeystoneReportView({
            el: '.test-container',
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
            expect($(this.testView.el).text()).to.equal(' Keystone API PerformanceResponse Time (s)');
            this.testView.triggerChange('lookbackSelectorChanged');
            this.testView.triggerChange('lookbackIntervalReached');
            this.testView.triggerChange();
        });
    });

});
