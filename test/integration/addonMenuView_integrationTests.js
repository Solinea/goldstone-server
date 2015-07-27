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
        $('body').html('' +
            '<div id="wrap">' +
            '<div class="navbar navbar-default navbar-fixed-top" role="navigation">' +
            '<div class="container">' +
            '<div class="navbar-header">' +
            '<button type="button" class="navbar-toggle"' +
            'data-toggle="collapse" data-target=".navbar-collapse">' +
            '<span class="sr-only">Toggle navigation</span>' +
            '<span class="icon-bar"></span>' +
            '<span class="icon-bar"></span>' +
            '<span class="icon-bar"></span>' +
            '</button>' +
            '</div>' +
            '<div class="collapse navbar-collapse">' +
            '<ul class="nav navbar-nav">' +
            '<li><a href="#discover" id="goldstone-text"> goldstone</a></li>' +
            '<li class="dropdown">' +
            '<a href="#" class="dropdown-toggle"' +
            'data-toggle="dropdown"><i' +
            'class="fa fa-camera"></i> Metrics<b' +
            'class="caret"></b></a>' +
            '<ul class="dropdown-menu">' +
            '<li><a href="#metrics/api_perf"><i' +
            'class="fa fa-puzzle-piece"></i> API Performance</a></li>' +
            '<li><a href="#metrics/nova_report"><i' +
            'class="fa fa-cloud"></i> Compute</a></li>' +
            '<li><a href="#metrics/neutron_report"><i' +
            'class="fa fa-star"></i> Network</a></li>' +
            '<li><a href="#metrics/cinder_report"><i' +
            'class="fa fa-hdd-o"></i> Block Storage</a></li>' +
            '<li><a href="#metrics/glance_report"><i' +
            'class="fa fa-picture-o"></i> Image</a></li>' +
            '<li><a href="#metrics/keystone_report"><i' +
            'class="fa fa-key"></i> Identity</a></li>' +
            '<li><a href="#metrics/metric_report"><i' +
            'class="fa fa-bars"></i> Metric Report</a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown">' +
            '<a href="#" class="dropdown-toggle"' +
            'data-toggle="dropdown"><i' +
            'class="fa fa-pencil-square-o"></i> Reports<b' +
            'class="caret"></b></a>' +
            '<ul class="dropdown-menu">' +
            '<li><a href="#reports/logbrowser"><i' +
            'class="fa fa-search"></i> Log Browser</a>' +
            '</li>' +
            '<li><a href="#reports/eventbrowser"><i' +
            'class="fa fa-search"></i> Event Browser</a>' +
            '</li>' +
            '<li><a href="#reports/apibrowser"><i' +
            'class="fa fa-search"></i> Api Browser</a>' +
            '</li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown addon-menu-view-container">' +
            '</li>' +
            '<li class="dropdown addon-additional-menu-hook">' +
            '</li>' +
            '</ul>' +
            '<ul class="nav navbar-nav navbar pull-right">' +
            '<h4>' +
            '<a href="#login">' +
            '<div class="logout-icon-container"></div>' +
            '</a>' +
            '</h4>' +
            '</ul>' +
            '<ul class="nav navbar-nav navbar-right">' +
            '<h4>' +
            '<a href="#help" target="_blank">' +
            '<i class="fa fa-question pull-right"></i>' +
            '</a>' +
            '</h4>' +
            '</ul>' +
            '<ul class="nav navbar-nav navbar pull-right">' +
            '<h4>' +
            '<a href="#settings">' +
            '<i class="fa fa-cog pull-right"></i>' +
            '</a>' +
            '</h4>' +
            '</ul>' +
            '<ul class="nav navbar-nav navbar pull-right">' +
            '<h4>' +
            '<i class="fa fa-bug pull-right"></i>' +
            '</h4>' +
            '</ul>' +
            '<ul class="nav navbar-nav navbar pull-right">' +
            '<h4>' +
            '<a href="https://groups.google.com/forum/#!forum/goldstone-users" target="' + '_blank" >' +
            '<i class="fa fa-envelope-o pull-right"></i>' +
            '</a>' +
            '</h4>' +
            '</ul>' +
            '<div class="global-range-refresh-container"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div id="body-container" class="container">' +
            '<div class="row alert alert-danger alert-dismissable"' +
            'hidden="true"></div>' +
            '<div class="alert alert-warning alert-dismissable" hidden="true"></div>' +
            '<div class="alert alert-info alert-dismissable" hidden="true"></div>' +
            '<div class="alert alert-success alert-dismissable" hidden="true"></div>' +
            '</div>' +
            '</div>' +
            '<div id="footer">' +
            '<div id="footer-container" class="container">' +
            '<p class="text-muted credit">Copyright 2014-2015 <a' +
            'href="http://solinea.com">Solinea, Inc.</a><a class="pull-right" href="' + 'https://www.apache.org/licenses/LICENSE-2.0" target="_blank">License</a></p>' +
            '</div>' +
            '</div>' +
            '');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        // blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";
        goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});

        goldstone.gsRouter = new GoldstoneRouter();

        this.testView = new AddonMenuView({
            el: ".addon-menu-view-container"
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('view is constructed', function() {

        it('does not render menu bar without addons installed', function() {
            localStorage.removeItem('addons');
            this.testView.instanceSpecificInit();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);
            localStorage.removeItem('addons');
        });
        it('does render menu bar with addons installed', function() {
            localStorage.removeItem('addons');
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);
            localStorage.setItem('addons', JSON.stringify([{
                "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
                "url_root": "yourapp",
                "name": "yourapp",
                "notes": "Release notes, configuration tips, or other miscellany.",
                "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
                "version": "0.0",
                "manufacturer": "Your Company, Inc."
            }]));
            this.testView.instanceSpecificInit();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(1);
            localStorage.removeItem('addons');
        });
        it('does render additional drop-downs with addons installed', function() {
            localStorage.removeItem('addons');
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);
            localStorage.setItem('addons', JSON.stringify([{
                "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
                "url_root": "yourapp",
                "name": "yourapp",
                "notes": "Release notes, configuration tips, or other miscellany.",
                "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
                "version": "0.0",
                "manufacturer": "Your Company, Inc."
            }, {
                "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
                "url_root": "hisapp",
                "name": "hisapp",
                "notes": "Release notes, configuration tips, or other miscellany.",
                "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
                "version": "0.1",
                "manufacturer": "Your Company, Inc."
            }]));
            this.testView.instanceSpecificInit();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(2);
            localStorage.removeItem('addons');
        });
        it('does listen for the "installedAppsUpdated" trigger', function() {
            localStorage.removeItem('addons');
            this.testView.instanceSpecificInit();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);
            localStorage.setItem('addons', JSON.stringify([{
                "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
                "url_root": "yourapp",
                "name": "yourapp",
                "notes": "Release notes, configuration tips, or other miscellany.",
                "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
                "version": "0.0",
                "manufacturer": "Your Company, Inc."
            }]));
            this.testView.trigger('installedAppsUpdated');
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(1);

            // should be same effect
            this.testView.instanceSpecificInit();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(1);

            localStorage.removeItem('addons');
            this.testView.trigger('installedAppsUpdated');
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);

            // should be same effect
            this.testView.instanceSpecificInit();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);
            localStorage.removeItem('addons');
        });
        it('does dynamically set new routes', function() {
            localStorage.removeItem('addons');
            localStorage.setItem('addons', JSON.stringify([{
                "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
                "url_root": "yourapp",
                "name": "yourapp",
                "notes": "Release notes, configuration tips, or other miscellany.",
                "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
                "version": "0.0",
                "manufacturer": "Your Company, Inc."
            }]));

            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').length).to.equal(0);

            goldstone.yourapp = {};
            goldstone.yourapp.routes = goldstone.yourapp.routes = [
                ['yourapp/route1', 'route 1', goldstone.yourapp.route1],
                ['yourapp/route2', 'route 2', goldstone.yourapp.route2],
                ['yourapp/route3', 'route 3', goldstone.yourapp.route3]
            ];
            this.testView.instanceSpecificInit();

            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').children().find('li').length).to.equal(3);

            var routes = Backbone.history;
            expect(routes.handlers[0].route.toString()).to.include('yourapp');
            expect(routes.handlers[1].route.toString()).to.include('yourapp');
            expect(routes.handlers[2].route.toString()).to.include('yourapp');
            expect(routes.handlers[3].route.toString()).to.not.include('yourapp');

            goldstone.gsRouter.navigate('route1');

            this.testView.generateDropdownElementsPerAddon();
            expect($('.addon-menu-view-container').length).to.equal(1);
            expect($('.addon-additional-menu-hook').length).to.equal(1);
            expect($('.dropdown-submenu').children().find('li').length).to.equal(3);
        });
    });
});
