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

describe('goldstoneRouter.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="router-content-container"></div>');
        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        this.testRouter = new GoldstoneRouter();
    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
    });
    describe('router is instantiated properly', function() {
        it('contains routes', function() {
            expect(this.testRouter.routes).to.be.an('object');
            expect(this.testRouter.routes.discover).to.equal('discover');
        });
        it('extends objects properly', function() {
            var test1 = this.testRouter.extendOptions({
                a: 1
            }, [{
                b: 2
            }, {
                c: 3
            }]);
            expect(test1).to.deep.equal({
                a: 1,
                b: 2,
                c: 3
            });
        });
        it('calls routes properly and triggers a re-translation of translateBaseTemplate', function() {
            goldstone.testi18n = new I18nModel();
            goldstone.testi18n.listenTo(this.testRouter, 'switchingView', function() {
                goldstone.testi18n.translateBaseTemplate();
            });
            var tranlateSpy = sinon.spy(goldstone.testi18n, "translateBaseTemplate");

            this.testRouter.apiBrowser();
            this.testRouter.apiPerfReport();
            this.testRouter.discover();
            this.testRouter.eventsBrowser();
            this.testRouter.logSearch();
            this.testRouter.nodeReport('control-01');
            this.testRouter.redirect();
            this.testRouter.savedSearchApi();
            this.testRouter.savedSearchEvent();
            this.testRouter.savedSearchLog();
            this.testRouter.settings();
            this.testRouter.tenant();
            this.testRouter.topology();

            expect(tranlateSpy.callCount).to.equal(12);
            tranlateSpy.restore();
        });
    });
});
