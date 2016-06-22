/**
 * Copyright 2016 Solinea, Inc.
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
        $('body').html(goldstone.bottomNavigationBarMock);

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        goldstone.gsRouter = new GoldstoneRouter();
        goldstone.breadcrumbManager = new BreadcrumbManager({
            el: '#bottom-bar'
        });
        goldstone.setBaseTemplateListeners();
        Backbone.history.start();
    });
    afterEach(function() {
        $('body').html('');
        Backbone.history.stop();
        this.server.restore();
        goldstone.gsRouter = null;
    });
    describe('router changes alter dom elements accordingly', function() {
        it('updates the software license link accordingly', function() {
            $('body').append('<a class="dynamic-license"><span>License</span></a>');
            expect($('.dynamic-license').attr('href')).to.equal(undefined);
            goldstone.gsRouter.trigger('route', 'settings');
            expect($('.dynamic-license').attr('href')).to.equal("https://www.apache.org/licenses/LICENSE-2.0");
            goldstone.gsRouter.trigger('route', 'topology');
            expect($('.dynamic-license').attr('href')).to.equal("http://solinea.com/wp-content/uploads/2016/03/Solinea-Goldstone-Software-License-v1.0.pdf");
        });
        it('appends breadcrumb accordingly', function() {
            expect($('.breadcrumb-path').text()).to.equal('Dashboard');
            goldstone.breadcrumbManager.createBreadcrumb([{
                title: 'Dashboard',
                location: '#'
            }, {
                title: 'Settings',
                location: '#'
            }, {
                title: 'Other',
                location: '#'
            }]);
            expect($('.breadcrumb-path').text()).to.equal('DashboardSettingsOther');
            goldstone.breadcrumbManager.createBreadcrumb([{
                title: 'Test',
                location: '#'
            }]);
            expect($('.breadcrumb-path').text()).to.equal('Test');
        });
        it('updates dashboard status color accordingly', function() {
            $('body').html(goldstone.topNavigationBarMock);
            expect($('.d-a-s-h-b-o-a-r-d')[0].outerHTML).to.equal('<li class="d-a-s-h-b-o-a-r-d"><a href="/#discover"><span class="i18n" data-i18n="Dashboard">Dashboard</span></a></li>');
            goldstone.breadcrumbManager.updateColor('green');
            expect($('.d-a-s-h-b-o-a-r-d')[0].outerHTML).to.equal('<li class="d-a-s-h-b-o-a-r-d status-green"><a href="/#discover"><span class="i18n" data-i18n="Dashboard">Dashboard</span></a></li>');
            goldstone.breadcrumbManager.updateColor('red');
            expect($('.d-a-s-h-b-o-a-r-d')[0].outerHTML).to.equal('<li class="d-a-s-h-b-o-a-r-d status-red"><a href="/#discover"><span class="i18n" data-i18n="Dashboard">Dashboard</span></a></li>');
            goldstone.breadcrumbManager.updateColor('yellow');
            expect($('.d-a-s-h-b-o-a-r-d')[0].outerHTML).to.equal('<li class="d-a-s-h-b-o-a-r-d status-yellow"><a href="/#discover"><span class="i18n" data-i18n="Dashboard">Dashboard</span></a></li>');
        });
    });
});
