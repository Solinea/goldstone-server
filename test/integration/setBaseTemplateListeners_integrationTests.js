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

describe('setBaseTemplateListeners.js spec', function() {
    beforeEach(function() {
        // defined in test_mocks.js
        $('body').html(goldstone.sidebarHTMLMock);

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        // goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        goldstone.gsRouter = new GoldstoneRouter();
        goldstone.setBaseTemplateListeners();
        Backbone.history.start();
    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
        Backbone.history.stop();
    });
    describe('router changes change highlighting', function() {
        it('manages the sidebar alert menu', function() {
            expect($('.tab-content').hasClass('open')).to.equal(false);
            $('.tab-content').addClass('open');
            expect($('.tab-content').hasClass('open')).to.equal(true);

            // test closer icon
            $('.alert-close').click();
            expect($('.tab-content').hasClass('open')).to.equal(false);
        });
        it('sets discover tab default highlighting', function() {
            expect($('li.dashboard-tab').hasClass('active')).to.equal(false);
            // also navigating to the page, highlighting
            // will also be applied
            goldstone.gsRouter.navigate('discover', {
                trigger: true
            });
            expect($('li.dashboard-tab').hasClass('active')).to.equal(true);
        });
        it('removes highlighting for page views where it is not relevant', function() {
            goldstone.gsRouter.navigate('discover', {
                trigger: true
            });
            expect($('li.dashboard-tab').hasClass('active')).to.equal(true);
            goldstone.gsRouter.navigate('settings', {
                trigger: true
            });
            expect($('li.dashboard-tab').hasClass('active')).to.equal(false);
        });
        it('sets highlighting appropriately', function() {
            goldstone.gsRouter.navigate('discover', {
                trigger: true
            });
            expect($('li.dashboard-tab').hasClass('active')).to.equal(true);
            expect($('li.topology-tab').hasClass('active')).to.equal(false);
            goldstone.gsRouter.navigate('topology', {
                trigger: true
            });
            expect($('li.dashboard-tab').hasClass('active')).to.equal(false);
            expect($('li.topology-tab').hasClass('active')).to.equal(true);
        });
    });
});
