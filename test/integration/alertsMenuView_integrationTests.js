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
describe('alertsMenuView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>' +

            '<div class="sidebar clearfix">' +
            '<ul class="btn-grp">' +
            '<a href="#discover">' +
            '<li class="dashboard-tab" data-toggle="tooltip" data-i18n-tooltip="Dashboard" data-placement="right" title="Dashboard">' +
            '<span class="btn-icon-block"><i class="icon dashboard-icon">&nbsp;</i></span>' +
            '<span data-i18n="Dashboard" class="btn-txt i18n">Dashboard</span>' +
            '</li>' +
            '</a>' +
            '<li class="alerts-tab alert-icon-placeholder" data-toggle="tooltip" data-placement="right" data-i18n-tooltip="Alerts" title="Alerts">' +
            '<span class="btn-icon-block"><i class="icon alerts">&nbsp;</i></span>' +
            '<span data-i18n="Alerts" class="btn-txt i18n">Alerts</span>' +
            '</li>' +
            '<a href="#metrics/api_perf">' +
            '<li class="metrics-tab" data-toggle="tooltip" data-i18n-tooltip="Metrics" data-placement="right" title="Metrics">' +
            '<span class="btn-icon-block"><i class="icon metrics">&nbsp;</i></span>' +
            '<span data-i18n="Metrics" class="btn-txt i18n">Metrics</span>' +
            '</li>' +
            '</a>' +
            '<a href="#reports/logbrowser">' +
            '<li class="reports-tab" data-toggle="tooltip" data-i18n-tooltip="Reports" data-placement="right" title="Reports">' +
            '<span class="btn-icon-block"><i class="icon reports">&nbsp;</i></span>' +
            '<span data-i18n="Reports" class="btn-txt i18n">Reports</span>' +
            '</li>' +
            '</a>' +
            '<a href="#topology">' +
            '<li class="topology-tab" data-toggle="tooltip" data-i18n-tooltip="Topology" data-placement="right" title="Topology">' +
            '<span class="btn-icon-block"><i class="icon topology">&nbsp;</i></span>' +
            '<span data-i18n="Topology" class="btn-txt i18n">Topology</span>' +
            '</li>' +
            '</a>' +
            '<span class="addon-menu-view-container">' +
            '</span>' +
            '<li class="menu-toggle" data-toggle="tooltip" data-placement="right" data-i18n-tooltip="Expand" title="Expand">' +
            '<span class="btn-icon-block"><i class="icon expand">&nbsp;</i></span>' +
            '<span data-i18n="Icons Only" class="btn-txt i18n">Icons Only</span>' +
            '</li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab alert-tab">' +
            '<h4 class="header-block i18n" data-i18n="Alerts">Alerts</h4>' +
            '<div class="subtab">' +
            '<ul class="tab-links">' +
            '<li class="active i18n" data-i18n="Recent">Recent</li>' +
            '<li class="i18n" data-i18n="All">All</li>' +
            '</ul>' +
            '<div class="sub-tab-content">' +
            '<div class="tabs">' +
            '<ul class="list-content alerts-recent">' +
            '</ul>' +
            '</div>' +
            '<div class="tabs"></div>' +
            '</div>' +
            '<div class="all-tab-content">' +
            '<div class="tabs">' +
            '<ul class="list-content alerts-all">' +
            '</ul>' +
            '</div>' +
            '<div class="tabs"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );

        this.now_date = moment();
        this.old_date = moment().subtract(1, 'days');

        this.alert_recent = {
            "uuid": "d22c04ef-72e1-4c3d-ab5c-755dad279480",
            "short_message": "Alert: 'service status DOWN' triggered at " + this.now_date.format('YYYY-MM-DD HH:mm:ssZ'),
            "long_message": "There were 1 instances of 'service status DOWN' from " + this.now_date.format('YYYY-MM-DD HH:mm:ssZ') + " to " + this.now_date.format('YYYY-MM-DD HH:mm:ssZ') + ".\nAlert Definition: 1cd6a68c-48bc-443f-b5ff-887b03f43334",
            "created": this.now_date.format('YYYY-MM-DDTHH:mm:ss') + ".000000Z",
            "created_ts": this.now_date.format("x"),
            "updated": this.now_date.format('YYYY-MM-DDTHH:mm:ss') + ".000000Z",
            "alert_def": "1cd6a68c-48bc-443f-b5ff-887b03f43334"
        };
        this.alert_old = {
            "uuid": "d22c04ef-72e1-4c3d-ab5c-755dad279480",
            "short_message": "Alert: 'service status DOWN' triggered at " + this.old_date.format('YYYY-MM-DD HH:mm:ssZ'),
            "long_message": "There were 1 instances of 'service status DOWN' from " + this.old_date.format('YYYY-MM-DD HH:mm:ssZ') + " to " + this.old_date.format('YYYY-MM-DD HH:mm:ssZ') + ".\nAlert Definition: 1cd6a68c-48bc-443f-b5ff-887b03f43334",
            "created": this.old_date.format('YYYY-MM-DDTHH:mm:ss') + ".000000Z",
            "created_ts": this.old_date.format("x"),
            "updated": this.old_date.format('YYYY-MM-DDTHH:mm:ss') + ".000000Z",
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
        // this.server.respond();
        this.server.restore();
    });
    describe('view tests', function() {
        it('renders alerts accordingly', function() {
            expect($('.alerts-all').html()).to.equal('');
            this.server.respond();
            expect($('.alerts-all').html()).to.equal('<li><div class="msg-block"><span class="msg">Alert: \'service status DOWN\' triggered at ' + this.now_date.format('YYYY-MM-DD HH:mm:ssZ') + '</span></div></li><li><div class="msg-block"><span class="msg">Alert: \'service status DOWN\' triggered at ' + this.old_date.format('YYYY-MM-DD HH:mm:ssZ') + '</span></div></li>');
        });
        it('renders recent alerts accordingly', function() {
            expect($('.alerts-recent').html()).to.equal('');
            this.server.respond();
            expect($('.alerts-recent').html()).to.equal('<li><div class="msg-block"><span class="msg">Alert: \'service status DOWN\' triggered at ' + this.now_date.format('YYYY-MM-DD HH:mm:ssZ') + '</span></div></li>');
        });
        it('sets an empty model to register changes against', function() {
            this.testView.setModel();
            expect(this.testView.model.get('alerts')).to.deep.equal([]);
            this.server.respond();
            expect(this.testView.model.get('alerts')).to.not.deep.equal([]);
        });
        it('highlights the alert icon when the model changes and includes recent alerts', function() {
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);
            this.server.respond();
            //Results includes a recent alert so highlights
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
        });
        it('unhighlights the alert icon based on UI', function() {
            this.server.respond();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
            // clicking the icon unhighlights
            this.testView.$el.click();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);

            //on change renders alerts and there is one recent alert
            this.testView.model.trigger('change');
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
            // clicking the first tab heading unhighlights
            $('.tab-links > li').eq(0).click();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);

            this.testView.model.trigger('change');
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
            // clicking the second tab heading unhighlights
            $('.tab-links > li').eq(1).click();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);

            this.testView.model.trigger('change');
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
            // clicking the alerts heading does not unhighlight
            $('.header-block').click();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
            $('.subtab').click();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);
        });
        it('toggles highlighting based on collection changes and includes or not recent alerts', function() {
            this.server.respond();
            $(this.testView.el).removeClass('alert-active');
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);
            // no change, no highlight
            this.server.respond();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);

            this.testCollection.reset();
            this.testCollection.add({
                results: [this.alert_recent]
            });
            // change with recent alert, then highlight
            this.testView.update();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);

            this.testCollection.reset();
            this.testCollection.add({
                results: [this.alert_old]
            });
            // change with old alert, then no highlight
            this.testView.update();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);

            $(this.testView.el).removeClass('alert-active');
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);
            this.testCollection.reset();
            this.testCollection.add({
                results: [this.alert_recent, this.alert_old]
            });
            // change with recent alert and old alert, then highlight
            this.testView.update();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(true);

            $(this.testView.el).removeClass('alert-active');
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);
            this.testCollection.reset();
            this.testCollection.add({
                results: []
            });
            // change without alerts, then no highlight
            this.testView.update();
            expect($(this.testView.el).hasClass('alert-active')).to.equal(false);
        });
        it('filters alerts older than a day from the "recent" column', function() {
            // less than one day, add it
            this.testCollection.reset();
            this.testCollection.add({
                results: [{
                    short_message: 'test message',
                    created: '2016-03-09T18:22:00.392260Z'
                }]
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
                results: [{
                    short_message: 'test message',
                    created: '2016-03-07T18:22:00.392260Z'
                }]
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
                '<li>' +
                '<div class="msg-block">' +
                '<span class="msg"></span>' +
                '</div>' +
                '</li>';
            var test2 = {
                short_message: 'Your refrigerator is running',
                created: 0,
                cruft: 'You\'d better catch it.'
            };
            var answer2 = '' +
                '<li>' +
                '<div class="msg-block">' +
                '<span class="msg">Your refrigerator is running</span>' +
                '</div>' +
                '</li>';
            expect(this.testView.alertTemplate(test2)).to.equal(answer2);
            expect(this.testView.alertTemplate(test1)).to.equal(answer1);
        });

    });
}); 
