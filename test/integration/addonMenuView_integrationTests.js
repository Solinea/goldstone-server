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
//integration tests - addonMenuView.js

describe('AddonMenuView.js spec', function() {
    beforeEach(function() {
        $('body').html(goldstone.sidebarHTMLMock);
        // to answer GET requests
        // this.server = sinon.fakeServer.create();
        // this.server.autoRespond = false;
        // this.server.respondWith([200, {
        //     "Content-Type": "application/json"
        // }, 'OK']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        goldstone.gsRouter = new GoldstoneRouter();

        this.testView = new AddonMenuView({});
    });
    afterEach(function() {
        $('body').html('');
        // this.server.respond();
        // this.server.restore();
    });
    describe('view is constructed', function() {

        it('does render additional drop-downs with addons installed', function() {
            expect($('li.t-o-p-o-l-o-g-y').length).to.equal(0);
            expect($('li.a-u-d-i-t').length).to.equal(0);

            localStorage.setItem('compliance', JSON.stringify([{
                "url_root": "compliance",
            }]));
            localStorage.setItem('topology', JSON.stringify([{
                "url_root": "topology",
            }]));
            this.testView.instanceSpecificInit();
            expect($('li.t-o-p-o-l-o-g-y').length).to.equal(1);
            expect($('li.a-u-d-i-t').length).to.equal(1);
            // expect($('.dropdown-submenu').length).to.equal(2);
            localStorage.removeItem('addons');
        });
        it('does dynamically set new routes', function() {
            goldstone.testApp = {};
            goldstone.testApp.routes = [
                ['testApp/route1', 'route 1', goldstone.testApp.route1],
                ['testApp/route2', 'route 2', goldstone.testApp.route2],
                ['testApp/route3', 'route 3', goldstone.testApp.route3]
            ];

            localStorage.removeItem('topology');
            localStorage.removeItem('compliance');
            localStorage.setItem('compliance', JSON.stringify([{
                "url_root": "testApp",
            }]));

            this.testView.instanceSpecificInit();

            var routes = Backbone.history;
            expect(routes.handlers[0].route.toString()).to.include('testApp');
            expect(routes.handlers[1].route.toString()).to.include('testApp');
            expect(routes.handlers[2].route.toString()).to.include('testApp');
            expect(routes.handlers[3].route.toString()).to.not.include('testApp');
            goldstone.gsRouter.navigate('route1');
        });
    });
});
