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
        $('body').html('' +
            '<div class="sidebar clearfix">' +
            '<ul class="btn-grp">' +
            '<a href="#discover">' +
            '<li class="dashboard-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Dashboard">' +
            '<span class="btn-icon-block"><i class="icon dashboard-icon">&nbsp;</i></span>' +
            '<span data-i18n="Dashboard" class="btn-txt i18n">Dashboard</span>' +
            '</li>' +
            '</a>' +
            '<li class="alerts-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Alerts">' +
            '<span class="btn-icon-block"><i class="icon alerts">&nbsp;</i></span>' +
            '<span data-i18n="Alerts" class="btn-txt i18n">Alerts</span>' +
            '</li>' +
            '<a href="#metrics/api_perf">' +
            '<li class="metrics-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Metrics">' +
            '<span class="btn-icon-block"><i class="icon metrics">&nbsp;</i></span>' +
            '<span data-i18n="Metrics" class="btn-txt i18n">Metrics</span>' +
            '</li>' +
            '</a>' +
            '<a href="#reports/logbrowser">' +
            '<li class="reports-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Reports">' +
            '<span class="btn-icon-block"><i class="icon reports">&nbsp;</i></span>' +
            '<span data-i18n="Reports" class="btn-txt i18n">Reports</span>' +
            '</li>' +
            '</a>' +
            '<a href="#topology">' +
            '<li class="topology-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Topology">' +
            '<span class="btn-icon-block"><i class="icon topology">&nbsp;</i></span>' +
            '<span data-i18n="Topology" class="btn-txt i18n">Topology</span>' +
            '</li>' +
            '</a>' +
            '<span class="addon-menu-view-container">' +
            '</span>' +
            '<li class="menu-toggle" data-toggle="tooltip" data-placement="right" title="" data-original-title="Expand">' +
            '<span class="btn-icon-block"><i class="icon expand">&nbsp;</i></span>' +
            '<span data-i18n="Icons Only" class="btn-txt i18n">Icons Only</span>' +
            '</li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab alert-tab">' +
            '<h4 class="header-block i18n" data-i18n="Alerts">Alerts</h4>' +
            '<div class="subtab">' +
            '<ul class="tab-links">' +
            '<li class="active i18n" data-i18n="Unread">Unread</li>' +
            '<li class="i18n" data-i18n="All">All</li>' +
            '</ul>' +
            '<div class="sub-tab-content">' +
            '<div class="tabs">' +
            '<ul class="list-content">' +
            '</ul>' +
            '</div>' +
            '<div class="tabs"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="router-content-container">' +
            '</div>' +
            '');

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
        this.server.restore();
        Backbone.history.stop();
    });
    describe('router changes change highlighting', function() {
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
