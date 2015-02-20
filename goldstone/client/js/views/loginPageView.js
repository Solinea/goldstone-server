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

var LoginPageView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        $('.login-form').on('submit', function(e) {
            e.preventDefault();
            self.submitLogin($(this).serialize());
        });
    },

    submitLogin: function(input) {
        var self = this;

        // console.log('submitLogin received: ', input);
        $.post('/accounts/login', input, function() {})
            .done(function(success) {

                // store the auth token
                self.storeAuthToken(success.auth_token);

                // and add a message to the top of the screen that logs what
                // is returned from the call
                // and clear that message after 2 seconds
                self.displayInfoMessage('Authorization Successful');

                self.redirectPostSuccessfulAuth();

            })
            .fail(function(fail) {

                // and add a message to the top of the screen that logs what
                // is returned from the call
                // and clear that message after 2 seconds
                self.displayInfoMessage(fail.responseJSON.non_field_errors[0]);
            });
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
    },

    displayInfoMessage: function(text) {
        $('.alert-info').show();
        $('.alert-info').text(text);

        setTimeout(function() {
            $('.alert-info').hide();
        }, 2000);
    },

    redirectPostSuccessfulAuth: function() {

        // if there was a previously visited page that
        // had redirected to the login page due to lack
        // of credentials, redirect back to that page
        if (location.hash && location.hash.length > 0) {
            locationhref = '/' + location.hash.slice(1);
        } else {

            // or just redirect to /discover
            locationhref = '/';
        }

        location.href = locationhref;

    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-4">' +
        '<div class="text-center">' +
        '<h1>Goldstone</h1>' +
        '</div>' +
        '<form class="login-form">' +
        '<h3>Please sign in</h3>' +
        '<label for="inputUsername">Username</label>' +
        '<input name="username" type="text" class="form-control" placeholder="Username" required autofocus>' +
        '<label for="inputPassword">Password</label>' +
        '<input name="password" type="password" class="form-control" placeholder="Password" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>' +
        '</form>' +
        '<div><a href="#">forgot username or password?</a></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
