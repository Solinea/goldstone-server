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

var PasswordResetView = GoldstoneBaseView2.extend({

    initialize: function(options) {
        // this.render();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        $('.password-reset-form').on('submit', function(e) {
            e.preventDefault();
            self.submitRequest($(this).serialize());
        });
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/password/reset/', input, function() {})
            .done(function(success) {

                // and add a message to the top of the screen that logs what
                // is returned from the call
                goldstone.raiseInfo('Password reset instructions have been emailed to you<br>Please click the link in your email');
            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call

                // TODO: change this after SMTP handling is set up
                // to reflect the proper error
                goldstone.raiseInfo(fail.responseJSON.detail);
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
        '<form class="password-reset-form">' +
        '<h3><%=goldstone.contextTranslate(\'Reset Password\', \'passwordreset\')%></h3>' +
        '<label for="email"><%=goldstone.contextTranslate(\'Email Address\', \'passwordreset\')%></label>' +
        '<input name="email" type="email" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Enter email associated with your account\', \'passwordreset\')%>" required autofocus><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.contextTranslate(\'Send Reset Email\', \'passwordreset\')%></button>' +
        '</form>' +
        '<div id="cancelReset"><a href="#login"><%=goldstone.translate(\'Cancel and Return to Login\')%></a></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
