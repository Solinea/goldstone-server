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

var SettingsPageView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.getUserPayload();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        $('.settings-form').on('submit', function(e) {
            e.preventDefault();
            self.trimInputField('[name="username"]');
            self.trimInputField('[name="first_name"]');
            self.trimInputField('[name="last_name"]');

            // ('[name="email"]') seems to have native trim() support
            // based on the type="email"

            self.submitRequest($(this).serialize());
        });
    },

    trimInputField: function(selector) {
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    getUserPayload: function() {
        $.get('/user')
            .done(function(result) {
                console.log('getUserPayload succeeded');
                console.log(result);
                $('[name="username"]').val(result.username);
                $('[name="first_name"]').val(result.first_name);
                $('[name="last_name"]').val(result.last_name);
                $('[name="email"]').val(result.email);
            })
            .fail(function() {
                console.log('getUserPayload failed');
            });
    },

    submitRequest: function(input) {
        console.log('submitting request with ' + input);
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.ajax({
            type: "PUT",
            url: '/user',
            data: input,
        }).done(function(success) {
            goldstone.raiseInfo('Update successful', true);
            console.log('success: ', success);
        })
            .fail(function(fail) {
                try {
                    goldstone.raiseInfo(fail.responseJSON.non_field_errors[0], true);
                } catch (e) {
                    goldstone.raiseInfo(e, true);
                }
            });
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
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
        '<form class="settings-form">' +
        '<h3>Update Personal Settings</h3>' +
        '<label for="inputUsername">Username</label>' +
        '<input name="username" type="text" class="form-control" placeholder="username">' +
        '<label for="inputFirstname">First name</label>' +
        '<input name="first_name" type="text" class="form-control" placeholder="First name" autofocus>' +
        '<label for="inputLastname">Last name</label>' +
        '<input name="last_name" type="text" class="form-control" placeholder="Last name"><br>' +
        '<label for="inputEmail">Email</label>' +
        '<input name="email" type="email" class="form-control" placeholder="Email"><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Update</button>' +
        '</form>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
