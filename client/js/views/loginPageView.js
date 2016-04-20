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

var LoginPageView = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        this.checkForRememberedUsername();
        this.addHandlers();
    },

    checkForRememberedUsername: function() {

        // if user last logged in without box checked, this will be null
        var rememberedUsername = localStorage.getItem('rem');

        // if value exists
        if (rememberedUsername !== null && rememberedUsername !== undefined) {

            // pre-check remember me checkbox
            document.getElementById('chk1').checked = true;

            // and fill in decrypted username
            var username = atob(rememberedUsername);
            document.getElementsByName('username')[0].value = username;
        }

    },

    checkForInstalledApps: function() {
        var self = this;

        // deferred object that will resolve after all intermediate
        // deferred objects have resolved, success or failure
        $.whenAll = function(deferreds) {
            var lastResolved = 0;

            var wrappedDeferreds = [];

            for (var i = 0; i < deferreds.length; i++) {
                wrappedDeferreds.push($.Deferred());

                deferreds[i].always(function() { //jshint ignore:line
                    wrappedDeferreds[lastResolved++].resolve(arguments);
                });
            }

            return $.when.apply($, wrappedDeferreds).promise();
        };

        // determine whether the compliance and topology modules are installed
        $.whenAll([$.get('/compliance/'), $.get('/topology/topology/')])
            .done(
                function(result1, result2) {

                    // localStorage keys for compliance and topology
                    // will be as follows, or null if call fails.
                    localStorage.setItem('compliance', result1[1] === 'success' ? JSON.stringify([{
                        url_root: 'compliance'
                    }]) : null);
                    localStorage.setItem('topology', result2[1] === 'success' ? JSON.stringify([{
                        url_root: 'topology'
                    }]) : null);

                    self.redirectPostSuccessfulAuth();
                });
    },

    addHandlers: function() {
        var self = this;

        // sets auth token with each xhr request.
        // necessary for checking submodules

        var $doc = $(document);
        $doc.ajaxSend(function(event, xhr) {
            var authToken = localStorage.getItem('userToken');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Token " +
                    authToken);
            }
        });

        $('.login-form').on('submit', function(e) {
            e.preventDefault();
            self.trimInputField('[name="username"]');
            self.submitRequest($(this).serialize());
        });
    },

    trimInputField: function(selector) {
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/login/', input, function() {})
            .done(function(success) {

                // store the auth token
                self.storeUsernameIfChecked();
                self.storeAuthToken(success.auth_token);

                // after a successful login, check for installed apps BEFORE
                // redirecting to dashboard. Chrome can handle the async
                // request to /addons/ but firefox/safari fail.

                // must follow storing token otherwise call will fail with 401
                self.checkForInstalledApps();
            })
            .fail(function(fail) {
                // and add a failure message to the top of the screen
                goldstone.raiseInfo("Username / Password combo failed. Please try again");
            });
    },

    storeUsernameIfChecked: function() {

        // is the 'remember me' checkbox checked?
        var rememberMeChecked = document.getElementById('chk1').checked;

        if (rememberMeChecked) {

            // grab and escape the username from the form
            var username = _.escape(document.getElementsByName('username')[0].value);

            // encrypt to base-64 (not secure, obsurred to casual glance)
            var hashedUsername = btoa(username);
            localStorage.setItem('rem', hashedUsername);
        } else {
            // otherwise remove the stored hash
            localStorage.removeItem('rem');
        }
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
    },

    redirectPostSuccessfulAuth: function() {
        location.href = '/';
    }

});
