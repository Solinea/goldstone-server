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

var NewPasswordView = GoldstoneBaseView.extend({

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

        $('.new-password-form').on('submit', function(e) {
            e.preventDefault();

            var $password = $('#password');
            var $confirm_password = $('#confirm_password');

            if ($password.val() !== $confirm_password.val()) {
                goldstone.raiseWarning("Passwords don't match");
            } else {

                // options.uidToken is passed in when the view is
                // instantiated via goldstoneRouter.js

                self.submitRequest(self.options.uidToken + '&' + $(this).serialize());
            }
        });
    },

    clearFields: function() {
        // clear input fields
        $('#password').val('');
        $('#confirm_password').val('');
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/password/reset/confirm/', input, function() {})
            .done(function(success) {

                // clear input fields
                self.clearFields();

                // and add a success message to the top of the screen
                goldstone.raiseInfo('You have successfully changed your password.');

                Backbone.history.navigate('#login', true);

            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call
                if (fail.non_field_errors) {
                    goldstone.raiseWarning(fail.non_field_errors);
                } else {
                    // clear input fields
                    self.clearFields();
                    goldstone.raiseWarning('Password reset failed');
                }

            });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-4">' +
        '<form class="new-password-form">' +
        '<h3>Enter new password</h3>' +
        '<label for="new_password">New password</label>' +
        '<input name="new_password" type="password" class="form-control" id="password" placeholder="Enter new password" required autofocus><br>' +
        '<label>Password again for confirmation</label>' +
        '<input type="password" class="form-control" id="confirm_password" placeholder="Confirm password" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Reset password</button>' +
        '</form>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
