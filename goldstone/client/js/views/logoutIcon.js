/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

var LogoutIcon = Backbone.View.extend({

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;

        // if auth token present, hijack all subsequent ajax requests
        // with an auth header containing the locally stored token
        this.setAJAXSendRequestHeaderParams();

        // only render the logout button if an auth token is present
        this.renderIfTokenPresent();

        // clicking logout button > expire token via /accounts/logout
        // then clear token from localStorage and redirect to /login
        this.setLogoutButtonHandler();
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
                localStorage.removeItem('userToken');
                self.redirectToLogin();
            }
        });
    },

    renderIfTokenPresent: function() {

        // only render logout icon if there is a token present
        var authToken = localStorage.getItem('userToken');
        if (authToken) {
            this.render();
        }
    },

    setLogoutButtonHandler: function() {
        var self = this;
        $('div.logout-icon-container .fa-sign-out').on('click', function() {

            // clicking logout button => submit userToken to
            // remove userToken. Upon success, remove token
            // and redirect to /login

            $.post('/accounts/logout')
                .done(function() {})
                .fail(function() {})
                .always(function() {
                    self.clearToken();
                    self.redirectToLogin();
                });
        });
    },

    clearToken: function() {
        localStorage.removeItem('userToken');
    },

    redirectToLogin: function() {
        location.href = "#/login";
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<i class="fa fa-sign-out pull-right"></i>'
    )

});
