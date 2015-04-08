// e2e auth

// increase Default timeout for wait* family functions:
// default = 5000
casper.options.waitTimeout = 15000;

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
Must authorize prior to continuing to test:
*/

casper.test.begin('Login Page loads and I can use reset password link', 5, function suite(test) {

    casper.start('http://localhost:8000/#/login', function() {
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
        test.assertExists('form.password-reset-form');
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

        // what does the form say after submission?
        this.echo('password form email value post-submit: ', "GREEN_BAR");
        this.echo('email: ' + this.getFormValues('form').email, "GREEN_BAR");
    });

    casper.then(function() {
        // after submitting password reset, wait for success popup
        casper.waitForSelectorTextChange('.alert.alert-info', function then() {
            this.echo('Text in .alert-info has changed', "GREEN_BAR");
            this.echo('Text in .alert-info says: ' + this.evaluate(function() {
                return document.getElementsByClassName('alert-info')[0].innerText;
            }));
        }, function timeout() {
            this.echo(".alert.alert-info didn't change within 1000ms", "WARN_BAR");
        }, 1000);
    });

    casper.run(function() {
        test.done();
    });


});


casper.test.begin('Back to login page to login', 5, function suite(test) {

    casper.start('http://localhost:8000/#/login', function() {
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
/*
continue on with e2eTests.js
*/
