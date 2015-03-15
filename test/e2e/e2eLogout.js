// e2e auth

// increase Default timeout for wait* family functions:
// default = 5000
casper.options.waitTimeout = 20000;

// default viewportSize inherited from PhantomJS: 400wx300h
casper.options.viewportSize = {
    width: 1430,
    height: 779
};

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

/*
print delimiting text between tests
*/

casper.test.setUp(function() {
    casper.echo('beginning of test', "WARNING");
});

casper.test.tearDown(function() {
    casper.echo('end of test', "WARNING");
});

/*
begin tests
*/

/*
Casper can log out and redirect to homepage
*/

// in the case of the logout tests, don't count any passing tests if this fails:
casper.options.exitOnError = true;

casper.test.begin('Logging out removes the auth token and redirects to the login screen', 2, function suite(test) {


    casper.start('http://localhost:8000/keystone/report', function() {
        this.echo('loading keystone/report page from which to logout');
    });

    casper.then(function() {
        test.assertTitle("goldstone", "title is goldstone");
        this.echo('WARNING!!! LOOK BELOW!!!! Lack of logout button means', 'WARN_BAR');
        this.echo('the user was not logged in and this test is dubious', 'WARN_BAR');
        test.assertExists('.fa-sign-out', "Logout button is present");

        // logout
        this.click('.logout-icon-container i');
        this.echo('clicked logout', 'GREEN_BAR');
    });

    casper.waitForResource(function testResource(resource) {
        return resource.url.indexOf("login") > -1;
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


    casper.start('http://localhost:8000/keystone/report', function() {
        this.echo('loading keystone/report in an unauthorized state');
    });

    casper.then(function() {
        test.assertTitle("goldstone", "title is goldstone");
        this.echo('WARNING!!! LOOK BELOW!!!! Lack of logout button is expected', 'WARN_BAR');
        this.echo('the user is not logged in and there should be no logout button', 'WARN_BAR');
        test.assertDoesntExist('.fa-sign-out', "Logout button is NOT present (expected)");

        this.echo('redirect to login page is expected and imminent', 'GREEN_BAR');
    });

    casper.waitForResource(function testResource(resource) {
        return resource.url.indexOf("login") > -1;
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

/*
continue on with e2eTests.js
*/
