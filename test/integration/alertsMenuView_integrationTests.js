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
//integration tests
describe('alertsMenuView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>' +

            '<nav id="top-bar">' +
            '<ul>' +
            '<li class="g-o-l-d-s-t-o-n-e"><a href="/#discover"><span class="i18n" data-i18n="GOLDSTONE">GOLDSTONE</span></a></li>' +
            '<li class="navigate-line"></li>' +
            '<li class="d-a-s-h-b-o-a-r-d"><a href="/#discover"><span class="i18n" data-i18n="DASHBOARD">DASHBOARD</span></a></li>' +
            '<li class="m-e-t-r-i-c-s"><span class="i18n" data-i18n="METRICS">METRICS</span>' +
            '<ul>' +
            '<li class="metrics-log"><a href="/#reports/logbrowser"><span class="i18n" data-i18n="Logs">Logs</span></a></li>' +
            '<li class="metrics-event"><a href="#/reports/eventbrowser"><span class="i18n" data-i18n="Events">Events</span></a></li>' +
            '<li class="metrics-api"><a href="#/reports/apibrowser"><span class="i18n" data-i18n="Api">Api</span></a></li>' +
            '</ul>' +
            '</li>' +
            '<div class="topology-icon-container"></div>' +
            '<div class="compliance-icon-container"></div>' +
            '<li class="active-user"><span class="user-b-g"></span>' +
            '<ul>' +
            '<li class="active-username"></li>' +
            '<li class="user-settings"><a href="/#settings"><span class="i18n" data-i18n="Settings">Settings</span></a></li>' +
            '<li class="user-help"><a href="https://solinea.freshdesk.com/support/home"><span class="i18n" data-i18n="Help">Help</span></a></li>' +
            '<li class="user-logout logout-btn"><a href="#"><span class="i18n" data-i18n="Sign Out">Sign Out</span></a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="u-p-g-r-a-d-e">' +
            '<span class="i18n" data-i18n="UPGRADE">UPGRADE</span>' +
            '<span class="upgrade-b-g"></span>' +
            '<ul>' +
            '<li class="banner">UPGRADE</li>' +
            '<li class="initial">Upgrade your plan to unlock<br>new features</li>' +
            '<li class="action"><a href="#">UPGRADE NOW!</a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="alert-container">' +
            '<span class="badge" id="badge-count"></span>' +
            '<span class="icon-alerts"></span>' +
            '<ul class="alert-content-parent">' +
            '</ul>' +
            '</li>' +
            '</ul>' +
            '</nav>'
        );

        this.now_date = moment();
        // have the old alert fall outside of the 1 day cut off
        this.old_date = moment().subtract(25, 'hours');

        this.alert_recent = {
            "uuid": "d22c04ef-72e1-4c3d-ab5c-755dad279480",
            "short_message": "Alert: 'service status DOWN' triggered at " + this.now_date.format(),
            "long_message": "There were 1 instances of 'service status DOWN' from " + this.now_date.format() + " to " + this.now_date.format() + ".\nAlert Definition: 1cd6a68c-48bc-443f-b5ff-887b03f43334",
            "created": this.now_date.format(),
            "created_ts": this.now_date.format(),
            "updated": this.now_date.format(),
            "alert_def": "1cd6a68c-48bc-443f-b5ff-887b03f43334"
        };
        this.alert_old = {
            "uuid": "d22c04ef-72e1-4c3d-ab5c-755dad279480",
            "short_message": "Alert: 'service status DOWN' triggered at " + this.old_date.format(),
            "long_message": "There were 1 instances of 'service status DOWN' from " + this.old_date.format() + " to " + this.old_date.format() + ".\nAlert Definition: 1cd6a68c-48bc-443f-b5ff-887b03f43334",
            "created": this.old_date.format(),
            "created_ts": this.old_date.format(),
            "updated": this.old_date.format(),
            "alert_def": "1cd6a68c-48bc-443f-b5ff-887b03f43334"
        };
        var serverResult = {
            "count": 2,
            "next": null,
            "previous": null,
            "results": [this.alert_recent, this.alert_old]
        };

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/core/alert/?page_size=1000", [200, {
                'Content-Type': 'application/json'
            },
            JSON.stringify(serverResult)
        ]);

        this.testCollection = new AlertsMenuCollection({
            urlBase: '/core/alert/'
        });

        this.testView = new AlertsMenuView({
            collection: this.testCollection,
            el: '.alert-icon-placeholder'
        });

    });
    afterEach(function() {
        $('body').html('');
        this.testCollection.reset();
        this.testView.clearInterval();
        this.server.restore();
    });
    describe('view tests', function() {
        it('renders recent alerts accordingly', function() {
            // initially render no new alert message
            expect($('.alert-content-parent').html()).to.equal('' +
                '<li class="banner">ALERTS AND NOTIFICATIONS</li><li class="alert-content initial">You don\'t have any new alerts</li><li class="action"><a href="#">View All <span class="notification-count">(0)</span></a></li>'
            );
            this.server.respond();
            expect($('.alert-content-parent').html()).to.equal('<li class="banner">ALERTS AND NOTIFICATIONS</li><li class="individual-alert"><span class="alert-title">Alert: \'service status DOWN\' <br></span>' + this.now_date.format("MMM D, YYYY") + ' at ' + this.now_date.format("hh:mm:ssa") + '</li><li class="action"><a href="#">View All <span class="notification-count">(2)</span></a></li>');
        });
        it('sets an empty model to register changes against', function() {
            this.testView.setModel();
            expect(this.testView.model.get('alerts')).to.deep.equal([]);
            this.server.respond();
            expect(this.testView.model.get('alerts')).to.not.deep.equal([]);
        });
        it('adds no recent messages notification when appropriate', function() {
            // initially render no new alert message
            expect($('.alert-content-parent').html()).to.equal('' +
                '<li class="banner">ALERTS AND NOTIFICATIONS</li><li class="alert-content initial">You don\'t have any new alerts</li><li class="action"><a href="#">View All <span class="notification-count">(0)</span></a></li>'
            );
            this.server.respond();
            expect($('.alert-content-parent').html()).to.not.equal('' +
                '<li class="banner">ALERTS AND NOTIFICATIONS</li><li class="alert-content initial">You don\'t have any new alerts</li><li class="action"><a href="#">View All <span class="notification-count">(0)</span></a></li>'
            );
        });
        it('properly formats alert badge', function() {
            this.server.respond();
            expect($('#badge-count').text()).to.equal("1");
        });
        it('properly formats total alert count', function() {
            this.server.respond();
            expect($('.notification-count').text()).to.equal("(2)");
        });
        it('filters alerts older than a day from the "recent" column', function() {
            // less than one day, add it
            this.testCollection.reset();
            this.testCollection.add({
                short_message: 'test message',
                created: '2016-03-09T18:22:00.392260Z'
            });
            this.testView.update();
            var test1 = this.testView.extractRecentAlerts(this.testView.model.get('alerts'), 1457548107731);
            expect(test1).to.deep.equal([{
                short_message: 'test message',
                created: '2016-03-09T18:22:00.392260Z'
            }]);

            // greater than one day, don't add it
            this.testCollection.reset();
            this.testCollection.add({
                short_message: 'test message',
                created: '2016-03-07T18:22:00.392260Z'
            });
            this.testView.update();
            var test2 = this.testView.extractRecentAlerts(this.testView.model.get('alerts'), 1457548107731);
            expect(test2).to.deep.equal([]);
        });
        it('properly formats an alert', function() {
            var test1 = {
                short_message: '',
                created: 0,
                cruft: 'crust'
            };
            var answer1 = '' +
                '<li class="individual-alert"><span class="alert-title"><br></span>' +
                moment(test1.created).format("MMM D, YYYY") +
                ' at ' + moment(test1.created).format("hh:mm:ssa") + '</li>';
            var test2 = {
                short_message: 'Your refrigerator is running',
                created: 0,
                cruft: 'You\'d better catch it.'
            };
            var answer2 = '' +
                '<li class="individual-alert"><span class="alert-title">Your refrigerator is running<br></span>' +
                moment(test1.created).format("MMM D, YYYY") +
                ' at ' + moment(test1.created).format("hh:mm:ssa") + '</li>';
            expect(this.testView.recentAlertTemplate(test1)).to.equal(answer1);
            expect(this.testView.recentAlertTemplate(test2)).to.equal(answer2);
        });
    });
});
