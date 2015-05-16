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

// e2eTests.js

/*
Colors available via 2nd param of casper.echo:
ERROR: white text on red background
INFO: green text
TRACE: green text
PARAMETER: cyan text
COMMENT: yellow text
WARNING: red text
GREEN_BAR: white text on green background
RED_BAR: white text on red background
INFO_BAR: cyan text
WARN_BAR: white text on orange background
*/

// default viewportSize inherited from PhantomJS: 400wx300h
casper.options.viewportSize = {
    width: 1430,
    height: 779
};

// 15 second timeout limit on individual tests
casper.options.waitTimeout = 30000;

/*
print delimiting text between tests
*/

casper.test.setUp(function() {
    casper.echo('beginning of test', "WARNING");
});

casper.test.tearDown(function() {
    casper.echo('end of test', "WARNING");
    casper.echo(' ');
    casper.echo(' ');
});

/*
begin tests
*/

casper.test.begin('Login Page loads and I can use reset password link', 5, function suite(test) {

    casper.start('http://localhost:8000/#login', function() {
        test.assertTitle("goldstone", "title is goldstone");
    });

    casper.then(function() {
        test.assertExists('#forgotUsername', "Forgot username or password text is present");

        // redirect to forgotten password page
        this.click('#forgotUsername a');
    });


    casper.waitForResource(function testResource() {
        return casper.getCurrentUrl().indexOf("password") > -1;
    }, function onReceived() {
        this.echo('redirect to /password successful!', "GREEN_BAR");
        test.assertExists('form.password-reset-form', 'password reset form present');
        this.echo('page url after redirect: ' + this.evaluate(function() {
            return document.location.href;
        }), "GREEN_BAR");

    }, function timeout(resourced) {
        this.echo('timed out on redirect to password');
    }, 5000);

    casper.then(function() {
        // alert-info bar should be empty
        test.assertExists('.alert.alert-info', 'alert info exists');
        test.assertSelectorHasText('.alert.alert-info', '', 'alert-info selector is empty');
        // submit password reset request
        this.fill('form.password-reset-form', {
            'email': "wizard@oz.org",
        }, true);

        // after submitting password reset, wait for success popup
        casper.waitForSelectorTextChange('.alert.alert-info', function then() {
            this.echo('Text in .alert-info has changed', "GREEN_BAR");
            this.echo('Text in .alert-info says: ' + this.evaluate(function() {
                return document.getElementsByClassName('alert-info')[0].innerText;
            }));
        }, function timeout() {
            this.echo(".alert.alert-info didn't change within 1000ms", "WARN_BAR");
        }, 500);

        // what does the form say after submission?
        this.echo('password form email value post-submit: ', "GREEN_BAR");
        this.echo('email: ' + this.getFormValues('form.password-reset-form').email, "GREEN_BAR");
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Back to login page to login', 5, function suite(test) {

    casper.start('http://localhost:8000/#login', function() {
        test.assertTitle("goldstone", "title is goldstone");
        test.assertExists('form.login-form');
        this.echo('page url after redirect: ' + this.evaluate(function() {
            return document.location.href;
        }), "GREEN_BAR");
    });

    casper.then(function() {

        test.assertExists('form [name="username"]', "username login field is found");
        test.assertExists('form [name="password"]', "password field on login form is found");

        // fill in form to initiate auth
        this.echo('login form values pre-fill: ' + this.evaluate(function() {
            return $('form [name="username"]').val() +
                ' ' +
                $('form [name="password"]').val();
        }), "GREEN_BAR");

        // fills in form with "field: value"
        // 'true/false' is whether to submit form
        this.fill('form.login-form', {
            'username': "gsadmin",
            'password': "changeme"
        }, true);

        // what does the form say after submission?
        this.echo('login form values post-submit: ', "GREEN_BAR");
        this.echo('username: ' + this.getFormValues('form').username, "GREEN_BAR");
        this.echo('password: ' + this.getFormValues('form').password, "GREEN_BAR");

    });

    // wait for redirect to 'discover' to signify
    // successful login:
    casper.waitForResource(function testResource(resource) {
        return casper.getCurrentUrl().indexOf("discover") > -1;
    }, function onReceived() {
        this.echo('login and redirect to /discover successful!', "GREEN_BAR");
        this.echo('page url after redirect: ' + this.evaluate(function() {
            return document.location.href;
        }), "GREEN_BAR");

        this.echo('localStorage?: ' + this.evaluate(function() {
            var a = localStorage.getItem('userToken');
            return a;
        }), "WARN_BAR");

        test.assertUrlMatch(/discover/, "Redirected to discover page post-login");
    }, function onTimeout() {
        this.echo('timed out on redirect to /discover', "WARN_BAR");
    });

    casper.run(function() {
        test.done();
    });

});


casper.test.begin('/settings page updates user personal settings / password', 10, function suite(test) {

    casper.start('http://localhost:8000/#settings', function() {
        casper.wait(1000, function() {
            this.echo('one second pause');
        });
    });

    casper.then(function() {
        this.echo('token in actual tests?: ' + this.evaluate(function() {
            var a = localStorage.getItem('userToken');
            return a;
        }), "WARN_BAR");


        this.echo("Update Personal Settings form", "GREEN_BAR");
        test.assertExists("form.settings-form");
        test.assertSelectorHasText("form.settings-form h3", "Update Personal Settings");

        // what does the Update Personal Settings form say?
        this.echo('update personal settings form values: ', "GREEN_BAR");
        this.echo('username: ' + this.getFormValues('form.settings-form').username, "INFO");
        this.echo('first name: ' + this.getFormValues('form.settings-form').first_name, "INFO");
        this.echo('last name: ' + this.getFormValues('form.settings-form').last_name, "INFO");
        this.echo('email: ' + this.getFormValues('form.settings-form').email, "INFO");

        // fill out new personal settings
        var randomDetails = ['Marvin', 'Martian', 'Bond', 'Calvin', 'Hobbes', 'Bill', 'Watterson'];
        var randomEmails = ['a@a.com', 'b@b.com', 'c@c.com', 'd@d.com', 'e@e.com', 'f@f.com'];

        var returnRandomItem = function(list) {
            var i = Math.floor(Math.random() * list.length);
            return list[i];
        };

        // submit out new personal settings
        this.fill('form.settings-form', {
            'first_name': returnRandomItem(randomDetails),
            'last_name': returnRandomItem(randomDetails),
            'email': returnRandomItem(randomEmails)
        }, true);

        // what does the Update Personal Settings form say now?
        this.echo('personal settings submitted with: ', "GREEN_BAR");
        this.echo('username: ' + this.getFormValues('form.settings-form').username, "INFO");
        this.echo('first name: ' + this.getFormValues('form.settings-form').first_name, "INFO");
        this.echo('last name: ' + this.getFormValues('form.settings-form').last_name, "INFO");
        this.echo('email: ' + this.getFormValues('form.settings-form').email, "INFO");
    });

    casper.waitForSelectorTextChange('.alert.alert-info', function() {
        this.echo('Text in .alert-info has changed', "GREEN_BAR");
    });

    casper.then(function() {
        // alert-info bar should not empty
        test.assertExists('.alert.alert-info', 'alert info exists');
        test.assertSelectorHasText('.alert.alert-info', 'Settings update successful');
    });

    casper.then(function() {
        test.assertExists('form.password-reset-form');
        test.assertSelectorHasText("form.password-reset-form h3", "Change Password");

        // what does the Change Password form say?
        this.echo('update personal settings form values: ', "GREEN_BAR");
        this.echo('current password: ' + this.getFormValues('form.password-reset-form').current_password, "INFO");
        this.echo('new password: ' + this.getFormValues('form.password-reset-form').new_password, "INFO");

        // submit new password (use same one, tho)
        this.fill('form.password-reset-form', {
            'current_password': 'changeme',
            'new_password': 'changeme'
        }, true);

        // what does the Change Password form say post-submit?
        this.echo('update personal settings form values: ', "GREEN_BAR");
        this.echo('current password: ' + this.getFormValues('form.password-reset-form').current_password, "INFO");
        this.echo('new password: ' + this.getFormValues('form.password-reset-form').new_password, "INFO");

        // wait for successful update message
        casper.waitForSelectorTextChange('.alert.alert-info', function() {
            this.echo('Text in .alert-info has changed', "GREEN_BAR");
        });
    });

    casper.then(function() {
        // alert-info bar should not empty
        test.assertExists('.alert.alert-info', 'alert info exists');
        test.assertSelectorHasText('.alert.alert-info', 'Password update successful');
    });

    casper.then(function() {
        // there should be an additional actions section for tenant_admins
        test.assertSelectorHasText('div#tenant-settings-button', 'Additional actions');
        test.assertSelectorHasText('button.modify', 'Modify tenant settings');
    });

    casper.run(function() {
        test.done();
    });

    // end of settings page e2e tests
});

casper.test.begin('/settings/tenants page updates user personal settings / password', 5, function suite(test) {

    casper.start('http://localhost:8000/#settings/tenants', function() {
        this.echo("Update Tenant Settings", "GREEN_BAR");
        test.assertExists("form.tenant-settings-form");
        test.assertSelectorHasText("form.tenant-settings-form h3", "Update Tenant Settings");

        // what does the Update Tenant Settings form say?
        this.echo('update tenant settings form values: ', "GREEN_BAR");
        this.echo('Tenant name: ' + this.getFormValues('form.tenant-settings-form').name, "INFO");
        this.echo('Owner name: ' + this.getFormValues('form.tenant-settings-form').owner, "INFO");
        this.echo('Owner contact: ' + this.getFormValues('form.tenant-settings-form').owner_contact, "INFO");
        test.assertExists('#formTenantId');
        this.echo('Text in #formTenantId: ' + this.evaluate(function() {
            return $('#formTenantId').text();
        }));
    });

    casper.waitForSelector('#tenants-single-rsrc-table td.sorting_1', function() {
        // don't actually submit new settings
        this.click('#tenants-single-rsrc-table td.sorting_1');

        // what does the Update tenant Settings form say now?
        this.echo('update tenant settings form values: ', "GREEN_BAR");
        this.echo('Tenant name: ' + this.getFormValues('form.tenant-settings-form').name, "INFO");
        this.echo('Owner name: ' + this.getFormValues('form.tenant-settings-form').owner, "INFO");
        this.echo('Owner contact: ' + this.getFormValues('form.tenant-settings-form').owner_contact, "INFO");
        test.assertExists('#formTenantId');
        this.echo('Text in #formTenantId: ' + this.evaluate(function() {
            return $('#formTenantId').text();
        }));

        // fill out new personal settings
        var randomDetails = ['Marvin', 'Martian', 'Bond', 'Calvin', 'Hobbes', 'Bill', 'Watterson'];
        var randomEmails = ['a@a.com', 'b@b.com', 'c@c.com', 'd@d.com', 'e@e.com', 'f@f.com'];

        var returnRandomItem = function(list) {
            var i = Math.floor(Math.random() * list.length);
            return list[i];
        };

        // fill out new personal settings
        // don't actually submit new settings
        this.fill('form.tenant-settings-form', {
            'name': returnRandomItem(randomDetails),
            'owner': returnRandomItem(randomDetails),
            'owner_contact': returnRandomItem(randomEmails)
        }, false);

        // what does the Update Personal Settings form say now?
        this.echo('tenant settings filled but not submitted with: ', "GREEN_BAR");
        this.echo('Tenant name: ' + this.getFormValues('form.tenant-settings-form').name, "INFO");
        this.echo('Owner name: ' + this.getFormValues('form.tenant-settings-form').owner, "INFO");
        this.echo('Owner contact: ' + this.getFormValues('form.tenant-settings-form').owner_contact, "INFO");
        test.assertExists('#formTenantId');
        this.echo('Text in #formTenantId: ' + this.evaluate(function() {
            return $('#formTenantId').text();
        }));
    });

    casper.run(function() {
        test.done();
    });

    // end of settings page e2e tests
});

casper.test.begin('Node Report Page is loading properly', 67, function suite(test) {
    casper.start('http://localhost:8000/#report/node/ctrl-01', function() {

        this.echo('token in actual tests?: ' + this.evaluate(function() {
            var a = localStorage.getItem('userToken');
            return a;
        }), "WARN_BAR");

        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('.navbar-brand > img', 'Favicon should load');
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // page h1
        test.assertSelectorHasText('div#node-report-r1-c1 h1', 'ctrl-01');

        // Service Status graph loads
        test.assertSelectorHasText('div #service-status-title-bar', 'Service Status Report');
        test.assertExists('div#node-report-r2', 'Service Status Section should load');

    });

    casper.waitForSelector('.toRemove.alert-success', function() {
        this.echo('service status graph loaded');

        // service status nodes appear -or- 'no data returned'
        test.assertEval(function() {
            return $('div#node-report-r2.row .toRemove.alert-success').length > 0 || $('div#node-report-r2.row div.alert.alert-danger.popup-message').text() === 'No Data Returned';
        }, "Service Status Report renders statuses or 'No Data Returned'");

    });

    casper.waitForSelector('div#node-report-r3-c1 #cpu-usage svg', function() {
        this.echo('cpu usage chart loaded');

        // Utilization graphs load
        test.assertSelectorHasText('div #utilization-title-bar', 'Utilization');
        test.assertExists('div#node-report-r3', 'Usage Charts should load');

        // CPU Usage Chart
        test.assertExists('div#node-report-r3-c1 #cpu-usage svg', 'CPU Usage Section svg chart should load');
    });

    casper.waitForSelector('div#node-report-r3-c1 #memory-usage svg', function() {
        this.echo('memory usage chart loaded');

        // Memory Usage Chart
        test.assertExists('div#node-report-r3-c1 #memory-usage svg', 'Memory Usage Section svg chart should load');
    });

    casper.waitForSelector('div#node-report-r3-c1 #network-usage svg', function() {
        this.echo('memory usage chart loaded');

        // Network Usage Chart
        test.assertExists('div#node-report-r3-c1 #network-usage svg', 'Network Usage Section svg chart should load');
    });

    // TESTS REMOVED PENDING RETURN OF THESE CHARTS:
    // casper.waitForSelector('div#node-report-r4-c1 #cores-usage svg g text', function() {
    //     this.echo('cores usage chart loaded');
    //     test.assertSelectorHasText('div #hypervisor-title-bar', 'Hypervisor');
    //     test.assertExists('div#node-report-r4', 'Hypervisor Charts should load');
    //     test.assertExists('div#node-report-r4-c1 #cores-usage svg', 'Cores Usage Section svg chart should load');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', 'Cores');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', 'Total Cores');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #cores-usage', '0');

    // });

    // casper.waitForSelector('div#node-report-r4-c1 #memory-usage svg g text', function() {
    //     this.echo('memory usage chart loaded');
    //     test.assertExists('div#node-report-r4-c1 #memory-usage svg', 'Memory Usage Section svg chart should load');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage', 'Memory');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage svg g g text', 'Total GB');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #memory-usage', '0');
    // });

    // casper.waitForSelector('div#node-report-r4-c1 #vm-cpu-usage svg g g text', function() {
    //     this.echo('per vm cpu usage chart loaded');
    //     test.assertExists('div#node-report-r4-c1 #vm-cpu-usage svg', 'Per VM CPU Usage Section svg chart should load');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'Per VM CPU Usage');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'utilization');
    //     test.assertSelectorHasText('div #node-report-r4-c1 #vm-cpu-usage', 'UserSystemWait');
    //     test.assertElementCount('#data-filterer .btn-group button', 3, 'per vm cpu usage chart has 3 buttons');
    // });

    casper.then(function() {
        // Service Status info button brings up popover
        test.assertNotVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should not be visible');
        this.click('#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.click('#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should not be visible');
        this.click('#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#service-status-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#service-status-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Utilization info button brings up popover
        test.assertNotVisible('#utilization-title-bar div.popover.fade.bottom.in', 'utilization info popover should not be visible');
        this.click('#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#utilization-title-bar div.popover.fade.bottom.in', 'utilization info popover should now be visible');
        this.click('#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#utilization-title-bar div.popover.fade.bottom.in', 'utilization info popover should not be visible');
        this.click('#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#utilization-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#utilization-title-bar .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#utilization-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible'
            );

        // PENDING RETURN OF HYPERVISOR CHARTS:
        // Hypervisor info button brings up popover
        // test.assertNotVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'hypervisor info popover should not be visible');
        // this.click('#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        // test.assertVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'hypervisor info popover should now be visible');
        // this.click('#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        // test.assertNotVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'hypervisor info popover should not be visible');
        // this.click('#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        // test.assertVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
        // this.mouseEvent('mouseout', '#Hypervisor-title-bar .pull-right.fa.fa-info-circle.panel-info');
        // test.assertNotVisible('#Hypervisor-title-bar div.popover.fade.bottom.in', 'service status info popover should now be visible');
    });

    // from services to reports tab
    casper.then(function() {
        // tabs should open and close as expected
        test.assertVisible('div#servicesReport', 'Services tab should start out visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should start out hidden');
        test.assertNotVisible('div#eventsReport', 'Events tab should start out hidden');
        test.assertNotVisible('div#detailsReport', 'Details tab should start out hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should start out hidden');

        this.click('.reportsButton');
        test.assertNotVisible('div#servicesReport', 'Services tab should not be visible');
        test.assertVisible('div#reportsReport', 'Reports tab should now be visible');
        test.assertNotVisible('div#eventsReport', 'Events tab should still be hidden');
        test.assertNotVisible('div#detailsReport', 'Details tab should still be hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should still be hidden');
    });

    casper.waitForSelector('#reportsReport li#report-result', function() {
        this.echo('reports dropdown loaded');
        this.click('#reportsReport li#report-result');
    });

    casper.waitForSelector('#reports-result-table tr td.sorting_1', function() {
        this.echo('report results load');
    });

    // from reports to events tab
    casper.then(function() {
        // tabs should open and close as expected
        test.assertNotVisible('div#servicesReport', 'Services tab should start out hidden');
        test.assertVisible('div#reportsReport', 'Reports tab should start out visible');
        test.assertNotVisible('div#eventsReport', 'Events tab should start out hidden');
        test.assertNotVisible('div#detailsReport', 'Details tab should start out hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should start out hidden');

        this.click('.eventsButton');
        test.assertNotVisible('div#servicesReport', 'Services tab should not be visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should now be hidden');
        test.assertVisible('div#eventsReport', 'Events tab should now be visible');
        test.assertNotVisible('div#detailsReport', 'Details tab should still be hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should still be hidden');
    });

    casper.waitWhileVisible('div#events-report-table_processing.dataTables_processing', function() {
        // events report
        test.assertEval(function() {
            return __utils__.findAll('td').length > 1 || $('td').text() === 'No data available in table';
        }, "Event report renders report results or 'No data available in table'");
    });

    // from events to details tab
    casper.then(function() {
        // tabs should open and close as expected
        test.assertNotVisible('div#servicesReport', 'Services tab should start out visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should start out hidden');
        test.assertVisible('div#eventsReport', 'Events tab should start out hidden');
        test.assertNotVisible('div#detailsReport', 'Details tab should start out hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should start out hidden');

        this.click('.detailsButton');
        test.assertNotVisible('div#servicesReport', 'Services tab should not be visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should not be visible');
        test.assertNotVisible('div#eventsReport', 'Events tab should be hidden');
        test.assertVisible('div#detailsReport', 'Details tab should not be hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should still be hidden');
    });

    casper.then(function() {
        test.assertEval(function() {
            return $('#details-single-rsrc-table td.sorting_1').first().text() === '@timestamp' || $('table#details-single-rsrc-table.table').text() === 'No additional details available';
        }, "Details tab renders details or 'No additional details available'");
    });

    // from events to details tab
    casper.then(function() {
        // tabs should open and close as expected
        test.assertNotVisible('div#servicesReport', 'Services tab should start out visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should start out hidden');
        test.assertNotVisible('div#eventsReport', 'Events tab should not be hidden');
        test.assertVisible('div#detailsReport', 'Details tab should start out hidden');
        test.assertNotVisible('div#logsReport', 'Logs tab should be hidden');

        this.click('.logsButton');
        test.assertNotVisible('div#servicesReport', 'Services tab should not be visible');
        test.assertNotVisible('div#reportsReport', 'Reports tab should not be visible');
        test.assertNotVisible('div#eventsReport', 'Events tab should be hidden');
        test.assertNotVisible('div#detailsReport', 'Details tab should be hidden');
        test.assertVisible('div#logsReport', 'Logs tab should not be hidden');
    });

    casper.waitForSelector('div.log-analysis-container svg', function() {
        this.echo('log analysis svg loaded');
    });

    casper.waitForSelector('#log-search-table tbody tr td', function() {
        this.echo('logs tab search results loaded');
    });

    casper.then(function() {
        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Homepage is loading properly', 59, function suite(test) {
    casper.start('http://localhost:8000', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');
    });

    casper.waitForSelector('#goldstone-event-panel div.panel-body svg', function() {
        this.echo('event svg loaded');
    });
    casper.waitForSelector('#goldstone-node-panel div.panel-body svg g text', function() {
        this.echo('node avail svg loaded');
    });
    casper.waitForSelector('div#goldstone-discover-r2-c1.col-md-6 div.chart svg g', function() {
        this.echo('cloud topology svg loaded');
    });

    casper.then(function() {
        // checks for a timestamp of any sort which means data is received
        // or checks for 'No Data Returned' otherwise
        /*
        EVENT TIMELINE E2E TESTS
        */

        // Event timeline graph loads
        test.assertExists('div#goldstone-discover-r1-c1', 'Event Timeline Section should load');
        test.assertExists('div#goldstone-discover-r1-c1 svg', 'Event Timeline Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c1', 'Event Timeline');
        test.assertEval(function() {
            return __utils__.findAll('div #goldstone-discover-r1-c1 g.tick').length > 0 || $('div #goldstone-discover-r1-c1').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders axis or 'No Data Returned'");
    });

    casper.then(function() {
        /*
        NODE AVAILABILITY E2E TESTS
        */

        // Node Availability graph loads
        test.assertExists('div#goldstone-discover-r1-c2', 'Node Availability Section should load');
        test.assertExists('div#goldstone-discover-r1-c2 svg', 'Node Availability svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r1-c2', 'Node Availability');

        // checks for an axis which means data is received
        // or checks for 'No Data Returned' otherwise

        casper.echo("need either a time delimeter (:) or 'No Data Returned'", "PARAMETER");

        casper.echo("$('div #goldstone-discover-r1-c2').text() " + casper.evaluate(function() {
            return $('div #goldstone-discover-r1-c2').text();
        }));

        test.assertEval(function() {
            return $('div #goldstone-discover-r1-c2').text().indexOf(':') >= 0 || $('div #goldstone-discover-r1-c2').text().indexOf('No Data Returned') >= 0;
        }, "Node Availability report renders either a time delimter (:) or 'No Data Returned'");
    });

    casper.then(function() {
        /*
        CLOUD TOPOLOGY E2E TESTS
        */

        // Cloud Topology graph loads
        test.assertExists('div#goldstone-discover-r2-c1', 'Cloud Topology Section should load');
        test.assertExists('div#goldstone-discover-r2-c1 svg', 'Cloud Topology Section svg chart should load');
        test.assertSelectorHasText('div #goldstone-discover-r2-c1', 'Cloud Topology');

        // Cloud Topology resource list loads
        test.assertExists('div#goldstone-discover-r2-c2', 'Resource List section should load');
        test.assertSelectorHasText('div #goldstone-discover-r2-c2', 'Resource List');

        // Cloud Topology viz has the expected branches and leaves
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'RegionOne');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'nova');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'cinder');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'keystone');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'glance');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'internal');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'flavors');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'hypervisors');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'volume');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'snapshots');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'transfers');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'endpoints');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'roles');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'services');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'tenants');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'users');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'images');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'aggregates');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'hosts');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'instances');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'volumes');
        test.assertSelectorHasText('#goldstone-discover-r2-c1', 'backups');
    });

    casper.then(function() {
        // Event Timeline info button brings up popover
        test.assertNotVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should not be visible');
        this.click('#goldstone-event-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should now be visible');
        this.click('#goldstone-event-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should not be visible');
        this.click('#goldstone-event-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-event-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-event-panel div.popover.fade.bottom.in', 'event timeline info popover should now be visible');

        // Node Availability info button brings up popover
        test.assertNotVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should not be visible');
        this.click('#goldstone-node-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should now be visible');
        this.click('#goldstone-node-info.pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should not be visible');
        this.click('#goldstone-node-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-node-panel .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-node-panel div.popover.fade.bottom.in', 'node availability info popover should now be visible');

        // Cloud Topology info button brings up popover
        test.assertNotVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should now be visible');
        this.click('#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should not be visible');
        this.click('#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-discover-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r2-c1 div.popover.fade.bottom.in', 'cloud topology info popover should now be visible');

        // Resource List info button brings up popover
        test.assertNotVisible('#goldstone-discover-r2-c2 div.popover.fade.bottom.in', 'resource list info popover should not be visible');
        this.click('#goldstone-discover-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r2-c2 div.popover.fade.bottom.in', 'resource list info popover should now be visible');
        this.click('#goldstone-discover-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r2-c2 div.popover.fade.bottom.in', 'resource list info popover should not be visible');
        this.click('#goldstone-discover-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#goldstone-discover-r2-c2 div.popover.fade.bottom.in', 'resource list info popover should now be visible');
        this.mouseEvent('mouseout', '#goldstone-discover-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#goldstone-discover-r2-c2 div.popover.fade.bottom.in', 'resource list info popover should now be visible');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('API Perf Page is loading properly', 65, function suite(test) {

    casper.start('http://localhost:8000/#api_perf/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');
    });

    // svg charts load
    casper.waitForSelector('div#api-perf-report-r1-c1.col-md-6 svg g.chart g.legend', function() {
        this.echo('nova api svg loads');
    });
    casper.waitForSelector('div#api-perf-report-r1-c2.col-md-6 svg g.chart g.legend', function() {
        this.echo('neutron api svg loads');
    });
    casper.waitForSelector('div#api-perf-report-r2-c1.col-md-6 svg g.chart g.legend', function() {
        this.echo('keystone api svg loads');
    });
    casper.waitForSelector('div#api-perf-report-r2-c2.col-md-6 svg g.chart g.legend', function() {
        this.echo('glance api svg loads');
    });
    casper.waitForSelector('div#api-perf-report-r3-c1.col-md-6 svg g.chart g.legend', function() {
        this.echo('cinder api svg loads');
    });

    casper.then(function() {

        // Nova API Perf graph loads
        test.assertExists('div#api-perf-report-r1-c1', 'Nova API Perf Section should load');
        test.assertExists('div#api-perf-report-r1-c1 svg', 'Nova svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Nova API Performance');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r1-c1', 'No Data Returned');

        // Nova API info button brings up popover
        test.assertNotVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should now be visible');
        this.click('#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Neutron API Perf graph loads
        test.assertExists('div#api-perf-report-r1-c2', 'Neutron API Perf Section should load');
        test.assertExists('div#api-perf-report-r1-c2 svg', 'Neutron svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Neutron API Performance');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r1-c2', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r1-c2', 'No Data Returned');

        // Neutron API info button brings up popover
        test.assertNotVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'neutron api info popover should not be visible');
        this.click('#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'neutron api info popover should now be visible');
        this.click('#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'neutron api info popover should not be visible');
        this.click('#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Keystone API Perf graph loads
        test.assertExists('div#api-perf-report-r2-c1', 'Keystone API Perf Section should load');
        test.assertExists('div#api-perf-report-r2-c1 svg', 'Keystone svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Keystone API Performance');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r2-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r2-c1', 'No Data Returned');

        // Keystone API info button brings up popover
        test.assertNotVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'keystone api info popover should not be visible');
        this.click('#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'keystone api info popover should now be visible');
        this.click('#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'keystone api info popover should not be visible');
        this.click('#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Glance API Perf graph loads
        test.assertExists('div#api-perf-report-r2-c2', 'Glance API Perf Section should load');
        test.assertExists('div#api-perf-report-r2-c2 svg', 'Glance svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Glance API Performance');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r2-c2', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r2-c2', 'No Data Returned');

        // Glance API info button brings up popover
        test.assertNotVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'glance api info popover should not be visible');
        this.click('#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'glance api info popover should now be visible');
        this.click('#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'glance api info popover should not be visible');
        this.click('#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Cinder API Perf graph loads
        test.assertExists('div#api-perf-report-r3-c1', 'Cinder API Perf Section should load');
        test.assertExists('div#api-perf-report-r3-c1 svg', 'Cinder svg chart should load');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Cinder API Performance');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Max');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Avg');
        test.assertSelectorHasText('div#api-perf-report-r3-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#api-perf-report-r3-c1', 'No Data Returned');

        // Cinder API info button brings up popover
        test.assertNotVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'cinder api info popover should not be visible');
        this.click('#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'cinder api info popover should now be visible');
        this.click('#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'cinder api info popover should not be visible');
        this.click('#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-report-r3-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Nova (compute) Page is loading properly', 53, function suite(test) {
    casper.start('http://localhost:8000/#nova/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');
    });

    casper.waitForSelector('div#nova-report-r1-c1.col-md-6 svg g.chart g.legend', function() {
        this.echo('nova api perf loads');
    });
    casper.waitForSelector('div#nova-report-r1-c2.col-md-6 svg g.chart g.legend', function() {
        this.echo('vm spawns loads');

    });
    casper.waitForSelector('div#nova-report-r2-c1.col-md-6 svg g.chart g.legend', function() {
        this.echo('cpu resources loads');
    });
    casper.waitForSelector('div#nova-report-r2-c2.col-md-6 svg g.chart g.legend', function() {
        this.echo('memory resources loads');
    });
    casper.waitForSelector('div#nova-report-r3-c1.col-md-6 svg g.chart g.legend', function() {
        this.echo('disk resources loads');
    });

    casper.then(function() {
        // Nova API Perf graph loads
        test.assertExists('div#nova-report-r1-c1', 'Nova API Perf Section should load');
        test.assertExists('div#nova-report-r1-c1 svg', 'Nova svg should load');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Nova API Performance');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#nova-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#nova-report-r1-c1', 'No Data Returned');

        // Nova API info button brings up popover
        test.assertNotVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should now be visible');
        this.click('div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'nova api info popover should not be visible');
        this.click('div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r1-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // VM Spawns graph loads
        test.assertExists('div#nova-report-r1-c2', 'VM Spawns chart section should load');
        test.assertExists('div#nova-report-r1-c2 svg', 'VM Spawns chart should load');
        test.assertSelectorHasText('div#nova-report-r1-c2', 'VM Spawns');

        // checks for 'fail' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r1-c2').text().indexOf('Fail') >= 0 || $('div #nova-report-r1-c2').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");

        // VM Spawns info button brings up popover
        test.assertNotVisible('div#nova-report-r1-c2     div.popover.fade.bottom.in', 'VM Spawns info popover should not be visible');
        this.click('div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'VM Spawns info popover should now be visible');
        this.click('div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'VM Spawns info popover should not be visible');
        this.click('div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r1-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r1-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // CPU Resources graph loads
        test.assertExists('div#nova-report-r2-c1', 'CPU Resources chart section should load');
        test.assertExists('div#nova-report-r2-c1 svg', 'CPU Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c1', 'CPU Resources');

        // checks for 'Physical' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r2-c1').text().indexOf('Physical') >= 0 || $('div #nova-report-r2-c1').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");


        // CPU Resources info button brings up popover
        test.assertNotVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'CPU Resources info popover should not be visible');
        this.click('div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'CPU Resources info popover should now be visible');
        this.click('div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'CPU Resources info popover should not be visible');
        this.click('div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r2-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Memory Resources graph loads
        test.assertExists('div#nova-report-r2-c2', 'Memory Resources chart section should load');
        test.assertExists('div#nova-report-r2-c2 svg', 'Memory Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r2-c2', 'Memory Resources');

        // checks for 'Physical' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r2-c2').text().indexOf('Physical') >= 0 || $('div #nova-report-r2-c2').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");

        // Memory Resources info button brings up popover
        test.assertNotVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'Memory Resources info popover should not be visible');
        this.click('div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'Memory Resources info popover should now be visible');
        this.click('div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'Memory Resources info popover should not be visible');
        this.click('div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r2-c2 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r2-c2 div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // Disk Resources graph loads
        test.assertExists('div#nova-report-r3-c1', 'Disk Resources section should load');
        test.assertExists('div#nova-report-r3-c1 svg', 'Disk Resources svg should load');
        test.assertSelectorHasText('div#nova-report-r3-c1', 'Disk Resources');

        // checks for 'Physical' in the chart legend which means data is received
        // or checks for 'No Data Returned' otherwise

        test.assertEval(function() {
            return $('div #nova-report-r3-c1').text().indexOf('Total') >= 0 || $('div #nova-report-r3-c1').text().indexOf('No Data Returned') >= 0;
        }, "Event report renders report results or 'No Data Returned'");

        // Disk Resources info button brings up popover
        test.assertNotVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('div#nova-report-r3-c1 div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', 'div#nova-report-r3-c1 .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#nova-disk-chart-title div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Neutron (network) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/#neutron/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Neutron API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.waitForSelector('div#neutron-report-r1-c1 svg g.chart g.legend', function() {
        // Neutron API Perf graph loads
        test.assertExists('div#neutron-report-r1-c1', 'Neutron API Perf Section should load');
        test.assertExists('div#neutron-report-r1-c1 svg', 'Neutron svg should load');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Neutron API Performance');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#neutron-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#neutron-report-r1-c1', 'No Data Returned');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Block Storage (cinder) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/#cinder/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Cinder API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.waitForSelector('div#cinder-report-r1-c1 svg g.chart g.legend', function() {
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#cinder-report-r1-c1', 'No Data Returned');

        // Cinder API Perf graph loads
        test.assertExists('div#cinder-report-r1-c1', 'Cinder API Perf Section should load');
        test.assertExists('div#cinder-report-r1-c1 svg', 'Cinder svg should load');
        test.assertSelectorHasText('div#cinder-report-r1-c1', 'Cinder API Performance');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Image (glance) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/#glance/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Glance API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.waitForSelector('div#glance-report-r1-c1 svg g.chart g.legend', function() {
        // Glance API Perf graph loads
        test.assertExists('div#glance-report-r1-c1', 'Glance API Perf Section should load');
        test.assertExists('div#glance-report-r1-c1 svg', 'Glance svg should load');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Glance API Performance');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#glance-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#glance-report-r1-c1', 'No Data Returned');
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Identity (keystone) Page is loading properly', 17, function suite(test) {
    casper.start('http://localhost:8000/#keystone/report', function() {
        //title
        test.assertTitle("goldstone", "Page title is 'goldstone'");

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');

        // Keystone API info button brings up popover
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should now be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'Disk Resources info popover should not be visible');
        this.click('#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '#api-perf-panel-header .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('#api-perf-panel-header div.popover.fade.bottom.in', 'service status info popover should now be visible');

        //footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.waitForSelector('div#keystone-report-r1-c1 svg g.chart g.legend', function() {
        // Keystone API Perf graph loads
        test.assertExists('div#keystone-report-r1-c1', 'Keystone API Perf Section should load');
        test.assertExists('div#keystone-report-r1-c1 svg', 'Keystone svg should load');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Keystone API Performance');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Max');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Avg');
        test.assertSelectorHasText('div#keystone-report-r1-c1', 'Min');
        test.assertSelectorDoesntHaveText('div#keystone-report-r1-c1', 'No Data Returned');
    });


    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Logging page is loading properly', 27, function suite(test) {
    casper.start('http://localhost:8000/#intelligence/search', function() {
        //title
        test.assertTitle('goldstone', 'Page title is "goldstone"');

        // navbar
        test.assertExists('div.navbar', 'Navbar should load');
        test.assertSelectorHasText('div.navbar', 'Report');
        test.assertSelectorHasText('div.navbar', 'Logging');
    });

    casper.waitForSelector('div.log-analysis-container svg g.chart path.area', function() {
        this.echo('log analysis svg loads');
    });

    casper.waitForSelector('#intel-search-data-table #log-search-table tbody tr td', function() {
        this.echo('search results load');
    });

    casper.then(function() {
        // Log Analysis graph loads
        test.assertExists('div.log-analysis-container', 'Log Analysis Section should load');
        test.assertExists('div.log-analysis-container svg', 'Log Analysis Section svg chart should load');
        test.assertSelectorHasText('div.log-analysis-container', 'Log Analysis');
        test.assertSelectorHasText('div.log-analysis-container', 'Log Events');
        test.assertSelectorHasText('div.log-analysis-container', '0');
        test.assertSelectorDoesntHaveText('div.log-analysis-container', 'No Data Returned');

        // Search Results section loads
        test.assertExists('div.log_table_panel', 'Search Results Section should load');
        test.assertExists('div#intel-search-data-table', 'Search Results should load');
        test.assertSelectorHasText('div.log_table_panel', 'Search Results');
        test.assertSelectorHasText('div.log_table_panel', 'Previous');
        test.assertSelectorHasText('div.log_table_panel', 'Next');
        test.assertSelectorDoesntHaveText('div.log_table_panel', 'No Data Returned');
        test.assertEval(function() {
            return __utils__.findAll('td.sorting_1').length === 10;
        }, "Search Resuts defaults 10 results");

        // zoom buttons
        test.assertExists('.fa-backward', 'more zoom out button exists');
        test.assertExists('.fa-forward', 'more zoom in button exists');
        test.assertExists('.fa-search-plus', 'zoom in button exists');
        test.assertExists('.fa-search-minus', 'zoom out button exists');

        // Log Analysis info button brings up popover
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'Info popover should not be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('.panel-heading div.popover.fade.bottom.in', 'Info popover should now be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'Info popover should not be visible');
        this.click('.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertVisible('.panel-heading div.popover.fade.bottom.in', 'service status info popover should now be visible');
        this.mouseEvent('mouseout', '.panel-heading .pull-right.fa.fa-info-circle.panel-info');
        test.assertNotVisible('.panel-heading div.popover.fade.bottom.in', 'service status info popover should now be visible');

        // footer loads and is visible
        test.assertVisible('div#footer', 'Footer showing');
    });

    casper.run(function() {
        test.done();
    });
});

// logout

casper.options.exitOnError = true;

casper.test.begin('Logging out removes the auth token and redirects to the login screen', 2, function suite(test) {


    casper.start('http://localhost:8000/#keystone/report', function() {
        this.echo('loading keystone/report page from which to logout');
    });

    casper.then(function() {
        test.assertTitle("goldstone", "title is goldstone");
        this.echo('WARNING!!! LOOK BELOW!!!! Lack of logout button means', 'WARN_BAR');
        this.echo('the user was not logged in and this test is dubious', 'WARN_BAR');
        test.assertVisible('.fa-sign-out', "Logout button is present");

        // logout
        this.click('.logout-icon-container i');
        this.echo('clicked logout', 'GREEN_BAR');
    });

    casper.waitForResource(function testResource(resource) {
        return casper.getCurrentUrl().indexOf("login") > -1;
    }, function onReceived() {
        this.echo('redirect to /login successful!', "GREEN_BAR");
        this.echo('page url after redirect: ' + this.evaluate(function() {
            return document.location.href;
        }), "GREEN_BAR");

    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Now that user is logged out, checking that unauthorized api calls will redirect to the /login page', 2, function suite(test) {


    casper.start('http://localhost:8000/#keystone/report', function() {
        this.echo('loading keystone/report in an unauthorized state');
    });

    casper.then(function() {
        test.assertTitle("goldstone", "title is goldstone");
        this.echo('WARNING!!! LOOK BELOW!!!! Lack of logout button is expected', 'WARN_BAR');
        this.echo('the user is not logged in and there should be no logout button', 'WARN_BAR');
        test.assertNotVisible('.fa-sign-out', "Logout button is NOT present (expected)");

        this.echo('redirect to login page is expected and imminent', 'GREEN_BAR');
    });

    casper.waitForResource(function testResource(resource) {
        return casper.getCurrentUrl().indexOf("login") > -1;
    }, function onReceived() {
        this.echo('redirect to /login successful!', "GREEN_BAR");
        this.echo('page url after redirect: ' + this.evaluate(function() {
            return document.location.href;
        }), "GREEN_BAR");

    });

    casper.run(function() {
        test.done();
    });
});
