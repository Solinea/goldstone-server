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

describe('apiBrowserDataTableView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="events-browser-table"></div>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        // instantiated only for access to url generation functions
        this.apiBrowserTableCollection = new GoldstoneBaseCollection({
            skipFetch: true
        });
        this.apiBrowserTableCollection.urlBase = "/core/apiperf/search/";
        this.apiBrowserTableCollection.addRange = function() {
            return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
        };

        this.testView = new ApiBrowserDataTableView({
            el: '.events-browser-table',
            chartTitle: 'Events Browser',
            collectionMixin: this.apiBrowserTableCollection,
            infoIcon: 'fa-table',
            width: 300
        });

        // this.update_spy = sinon.spy(this.testView, "update");
        // this.gglr_spy = sinon.spy(this.testView, "getGlobalLookbackRefresh");

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        // this.update_spy.restore();
        // this.gglr_spy.restore();
    });

    describe('testing methods', function() {
        it('serverSideDataPrep', function() {
            var test1 = this.testView.serverSideDataPrep(
                JSON.stringify({
                    results: [1, 2, 3],
                    count: 42,
                })
            );

            expect(test1).to.equal(
                JSON.stringify({
                    results: [1, 2, 3],
                    recordsTotal: 42,
                    recordsFiltered: 42
                })
            );

        // sanity check
        this.testView.update();
        });
    });
});
