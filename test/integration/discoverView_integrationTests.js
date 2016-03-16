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
//integration tests

describe('discover.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        data = [];

        goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        this.testView = new DiscoverPageView({
            el: '.test-container'
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('triggers discover.js', function() {
            $('body').append('<div id="goldstone-discover-r1-c1" style="width:500px;"></div>');
            $('body').append('<div id="goldstone-discover-r1-c2" style="width:500px;"></div>');
            $('body').append('<div id="goldstone-discover-r2-c1" style="width:500px;"></div>');
            $('body').append('<div id="goldstone-discover-r2-c2" style="width:500px;"></div>');
            this.testView.renderCharts();
            this.testView.triggerChange('lookbackSelectorChanged');
        });
    });
});
