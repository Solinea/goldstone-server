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

/*
This view will be re-invoked upon every page refresh or redirect, as it is
baked into base.html.

After ajaxSend Listener is bound to $(document), it will be triggered on all
subsequent $.ajaxSend calls.

Uses xhr.setRequestHeader to append the Auth token on all subsequent api calls.
It also serves to handle 401 auth
errors, removing any existing token, and redirecting to the login page.

The logout icon will only be rendered in the top-right corner of the page if
there is a truthy value present in localStorage.userToken
*/

var LogoutIcon = GoldstoneBaseView.extend({

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();

        // prune old unused localStorage keys
        this.pruneLocalStorage();

        // if auth token present, hijack all subsequent ajax requests
        // with an auth header containing the locally stored token
        this.setAJAXSendRequestHeaderParams();

        // only render the logout button if an auth token is present
        this.makeVisibleIfTokenPresent();

        // clicking logout button > expire token via /accounts/logout
        // then clear token from localStorage and redirect to /login
        this.setLogoutButtonHandler();
    },

    pruneLocalStorage: function() {
        var temp = {};

        if(app === undefined || app.localStorageKeys === undefined) {
            return;
        }

        _.each(app.localStorageKeys, function(item) {
            temp[item] = localStorage.getItem(item);
        });
        localStorage.clear();
        _.each(app.localStorageKeys, function(item) {
            if(temp[item] !== null) {
                localStorage.setItem(item, temp[item]);
            }
        });
    },

    // subscribed to gsRouter 'switching view' in router.html
    viewSwitchTriggered: function() {
        this.makeVisibleIfTokenPresent();
    },

    setAJAXSendRequestHeaderParams: function() {
        var self = this;

        // if there is no userToken present in localStorage, don't append the
        // request header to api calls or it will append null
        // which will create a server error

        var $doc = $(document);
        $doc.ajaxSend(function(event, xhr) {
            var authToken = localStorage.getItem('userToken');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Token " +
                    authToken);
            }
        });

        // all 401 errors will cause a deletion of existing userToken and
        // redirect to /login with the hash appened to the url
        $doc.ajaxError(function(event, xhr) {
            if (xhr.status === 401) {
                self.clearToken();
                self.redirectToLogin();
            }
        });
    },

    makeVisibleIfTokenPresent: function() {

        // only render logout icon if there is a token present
        var authToken = localStorage.getItem('userToken');
        if (authToken) {
            $('.fa-sign-out').css('visibility', 'visible');
        } else {
            $('.fa-sign-out').css('visibility', 'hidden');
        }
    },

    setLogoutButtonHandler: function() {
        var self = this;
        $('div.logout-icon-container .fa-sign-out').on('click', function() {

            // clicking logout button => submit userToken to
            // remove userToken. Upon success, remove token
            // and redirect to /login
            // if failed, raise alert and don't redirect

            $.post('/accounts/logout/')
                .done(function() {
                    goldstone.raiseSuccess('Logout Successful');
                    self.clearToken();
                    self.makeVisibleIfTokenPresent();
                    self.redirectToLogin();
                })
                .fail(function() {
                    goldstone.raiseWarning('Logout Failed');
                    self.makeVisibleIfTokenPresent();
                });
        });
    },

    clearToken: function() {
        localStorage.removeItem('userToken');
    },

    redirectToLogin: function() {
        location.href = "#login";
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<i class="fa fa-sign-out pull-right"></i>'
    )

});
