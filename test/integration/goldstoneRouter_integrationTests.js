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
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        this.testRouter = new GoldstoneRouter();
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('router is instantiated properly', function() {
        it('contains routes', function() {
            expect(this.testRouter.routes).to.be.an('object');
            expect(this.testRouter.routes.password).to.equal('password');
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
        it('calls routes properly', function() {
            this.testRouter.apiPerfReport();
            this.testRouter.cinderReport();
            this.testRouter.discover();
            this.testRouter.glanceReport();
            this.testRouter.help();
            this.testRouter.logSearch();
            this.testRouter.keystoneReport();
            this.testRouter.login();
            this.testRouter.metricViewer();
            this.testRouter.metricViewer(6);
            this.testRouter.metricViewer(7);
            this.testRouter.metricViewer();
            this.testRouter.metricViewer();
            this.testRouter.neutronReport();
            this.testRouter.novaReport();
            this.testRouter.password();
            this.testRouter.nodeReport('control-01');
            this.testRouter.settings();
            this.testRouter.tenant();
            this.testRouter.redirect();
        });
    });
});
