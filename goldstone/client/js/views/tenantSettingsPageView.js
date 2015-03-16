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

var TenantSettingsPageView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.getTenantSettings();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        // add listener to settings form submission button
        $('.tenant-settings-form').on('submit', function(e) {
            e.preventDefault();

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="name"]');
            self.trimInputField('[name="owner"]');
            self.trimInputField('[name="owner_contact"]');

            // ('[name="email"]') seems to have native .trim()
            // support based on the type="email"

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('POST', '/tenants', $(this).serialize(), 'Tenant settings');
        });
    },

    getTenantSettings: function() {
        var self = this;

        $.get('/tenants')
            .done(function(result) {
                result = result.results[0];
                $('[name="name"]').val(result.name);
                $('[name="owner"]').val(result.owner);
                $('[name="owner_contact"]').val(result.owner_contact);
            })
            .fail(function(fail) {
                goldstone.raiseInfo('Could not load user settings', true);
            });
    },

    checkIfTenantAdmin: function(result) {
        // if true, render link to tenant admin settings page
        if (result === true) {
            this.renderTenantSettingsPageLink();
        } else {
            return null;
        }
    },

    renderTenantSettingsPageLink: function() {
        $('#tenant-settings-button').append('' +
            '<a href="/tenant"><button class="btn btn-lg btn-danger btn-block">Modify tenant settings</button></a>');
    },

    // abstracted to work for both forms, and append the correct
    // message upon successful form submission
    submitRequest: function(type, url, data, message) {
        var self = this;

        // Upon clicking the submit button, the serialized
        // user input is sent via type (POST/PUT/etc).
        // If successful, invoke "done". If not, invoke "fail"

        $.ajax({
            type: type,
            url: url,
            data: data,
        }).done(function(success) {
            goldstone.raiseInfo(message + ' update successful', true);
        })
            .fail(function(fail) {
                try {
                    goldstone.raiseInfo(fail.responseJSON.non_field_errors[0], true);
                } catch (e) {
                    goldstone.raiseInfo(fail.responseText + e, true);
                }
            });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +

        // personal settings form
        '<div class="col-md-4 col-md-offset-0">' +
        '<form class="tenant-settings-form">' +
        '<h3>Update Tenant Settings</h3>' +
        '<label for="name">Tenant name</label>' +
        '<input name="name" type="text" class="form-control" placeholder="Tenant name">' +
        '<label for="owner">Owner name</label>' +
        '<input name="owner" type="text" class="form-control" placeholder="Owner name" autofocus>' +
        '<label for="owner_contact">Owner contact</label>' +
        '<input name="owner_contact" type="email" class="form-control" placeholder="Owner email address">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Update</button>' +
        '</form>' +
        '</div>' +

        // close divs for row/container
        '</div>' +
        '</div>'

    )

});
