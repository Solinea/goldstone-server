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
        this.addAJAXSendRequestHeaderParams();
        this.checkForToken();
        this.addHandlers();
    },

    addAJAXSendRequestHeaderParams: function() {
        var redirectToLogin = function() {

            // this sets a hash (#) to the url that will be used post-auth to
            // return the user to the page they were previously redirected from
            var locationhref = "/login";
            var currentPage = location.pathname.slice(1);
            location.href = locationhref + '#' + currentPage;
        };

        // if there is no userToken present in localStorage, don't append the
        // request header to api calls or it will append null.
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
                redirectToLogin();
            }
        });
    },

    checkForToken: function() {

        // only render logout icon if there is a token present
        var authToken = localStorage.getItem('userToken');
        if (authToken) {
            this.render();
        }
    },

    addHandlers: function() {
        var self = this;
        $('div.logout-icon-container .fa-sign-out').on('click', function() {

            // clicking logout button => remove userToken and redirect to /login
            localStorage.removeItem('userToken');
            location.href = "/login";
        });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<i class="fa fa-sign-out pull-right"></i>'
    )

});
