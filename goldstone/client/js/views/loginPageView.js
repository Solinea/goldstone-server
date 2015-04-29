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

    defaults: {},

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

        $.post('/accounts/login/', input, function() {
        })
            .done(function(success) {

                // store the auth token
                self.storeAuthToken(success.auth_token);
                self.redirectPostSuccessfulAuth();
            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call

                try {
                    goldstone.raiseInfo(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    goldstone.raiseInfo(fail.responseText);
                    console.log(e);
                }

            });
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
    },

    redirectPostSuccessfulAuth: function() {
        location.href = '#';
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-4">' +
        '<form class="login-form">' +
        '<h3>Please sign in</h3>' +
        '<label for="inputUsername">Username</label>' +
        '<input name="username" type="text" class="form-control" placeholder="Username" required autofocus>' +
        '<label for="inputPassword">Password</label>' +
        '<input name="password" type="password" class="form-control" placeholder="Password" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>' +
        '</form>' +
        '<div id="forgotUsername"><a href="#password">Forgot username or password?</a></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
