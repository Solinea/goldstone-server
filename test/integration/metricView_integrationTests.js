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

describe('stackedAreaCollection.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class=".metric-chart-instance"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new MetricViewCollection({
            url: '/snoopy/waves/',
        });

        this.testView = new MetricView({
            collection: this.testCollection,
            height: 320,
            el: '.metric-chart-instance',
            width: $('.metric-chart-instance').width()
        });

        this.testCollection.reset();

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('tests methods', function() {
        it('processesOptions', function() {
            this.testView.processOptions();
        });

    });
});
