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
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        $('.login-form').on('submit', function(e) {
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
    }

});
