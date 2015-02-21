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
            var locationhref = "/login";
            var currentPage = location.pathname.slice(1);
            location.href = locationhref + '#' + currentPage;
        };

        var $doc = $(document);
        $doc.ajaxSend(function(event, xhr) {
            var authToken = localStorage.getItem('userToken');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Token " +
                    authToken);
            }
        });

        $doc.ajaxError(function(event, xhr) {
            if (xhr.status === 401) {
                localStorage.removeItem('userToken');
                redirectToLogin();
            }
        });
    },

    checkForToken: function() {
        var authToken = localStorage.getItem('userToken');
        if (authToken) {
            this.render();
        }
    },

    addHandlers: function() {
        var self = this;
        $('div.logout-icon-container .fa-sign-out').on('click', function() {
            // e.preventDefault();
            console.log('clicked');
            localStorage.removeItem('userToken');
            location.href = "/login";
        });
    },

    redirectPostLogout: function() {
        location.href = locationhref;
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<i class="fa fa-sign-out pull-right"></i>'
    )

});
