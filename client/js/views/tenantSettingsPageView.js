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

var TenantSettingsPageView = GoldstoneBaseView.extend({

    instanceSpecificInit: function(options) {
        this.el = this.options.el;
        this.render();
        this.getTenantAndOSSettings();
        this.addHandlers();
    },

    onClose: function() {
        $('#global-lookback-range').show();
        $('#global-refresh-range').show();
    },

    addHandlers: function() {
        var self = this;

        // add listener to settings form submission button
        $('.tenant-settings-form').on('submit', function(e) {
            // prevens page jump upon pressing submit button
            e.preventDefault();

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="name"]');
            self.trimInputField('[name="owner"]');
            self.trimInputField('[name="owner_contact"]');
            var tenandId = $('#formTenantId').text();

            // email fields seem to have native .trim() support

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/tenants/' + tenandId + '/', $(this).serialize(), goldstone.contextTranslate('Tenant Settings update successful', 'tenantsettings'));
        });

        $('.openstack-settings-form').on('submit', function(e) {
            // prevens page jump upon pressing submit button
            e.preventDefault();

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="os_auth_url"]');
            self.trimInputField('[name="os_name"]');
            self.trimInputField('[name="os_password"]');
            self.trimInputField('[name="os_username"]');

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/user/', $(this).serialize(), goldstone.contextTranslate('OS Settings update successful', 'tenantsettings'));
        });
    },

    getTenantAndOSSettings: function() {
        var self = this;

        $.get('/tenants/')
            .done(function(result) {
                if (result.results) {
                    result = result.results[0];
                    var $form = $('.tenant-settings-form');
                    $form.find('[name="name"]').val(result.name);
                    $form.find('[name="owner"]').val(result.owner);
                    $form.find('[name="os_name"]').val(result.owner_contact);
                    $form.find('#formTenantId').text(result.uuid);

                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo(goldstone.contextTranslate("Could not load tenant settings", "tenantsettings"));
            });

        $.get('/user/')
            .done(function(result) {
                var $form = $('.openstack-settings-form');
                $form.find('[name="username"]').val(result.username);
                $form.find('[name="os_auth_url"]').val(result.os_auth_url);
                $form.find('[name="os_name"]').val(result.os_name);
                $form.find('[name="os_password"]').val(result.os_password);
                $form.find('[name="os_username"]').val(result.os_username);

                // OpenStack settings can not be updated by !tenant_admin
                if (!result.tenant_admin) {

                    // disable all form fields and update button
                    $form.find('input').attr('disabled', 'true');
                    $form.find('button').attr('disabled', true);
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo(goldstone.contextTranslate("Could not load OpenStack settings", "tenantsettings"));
            });
    },

    // abstracted to work for multiple forms, and append the correct
    // message upon successful form submission
    submitRequest: function(type, url, data, message) {
        var self = this;

        // Upon clicking the submit button, the serialized
        // user input is sent via type (POST/PUT/etc).
        // If successful, invoke "done". If not, invoke "fail"

        $.ajax({
            type: type,
            url: url,
            data: data
        })
            .done(function(success) {
                self.dataErrorMessage(message);
            })
            .fail(function(fail) {
                try {
                    self.dataErrorMessage(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    self.dataErrorMessage(fail.responseText + e);
                }
            })
            .always(function() {
                self.getTenantAndOSSettings();
            });
    },

    render: function() {

        $('#global-lookback-range').hide();
        $('#global-refresh-range').hide();

        this.$el.html(this.template());
        return this;
    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +

        // popup message row
        '<div class="row col-md-offset-2">' +
        '<h3><%= goldstone.translate("Tenant Settings") %></h3>' +
        '<div class="col-md-8 col-md-offset-2">' +
        '<div class="alert alert-info popup-message" hidden="true"></div>' +
        '<br></div>' +
        '</div>' +

        '<div class="row">' +

        // update settings form
        '<div class="col-md-4 col-md-offset-2">' +
        '<form class="tenant-settings-form">' +
        '<h3><%=goldstone.contextTranslate(\'Goldstone Tenant Settings\', \'tenantsettings\')%></h3>' +
        '<label for="name"><%=goldstone.contextTranslate(\'Tenant Name\', \'tenantsettings\')%></label>' +
        '<input name="name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Tenant Name\', \'tenantsettings\')%>" required>' +
        '<label for="owner"><%=goldstone.contextTranslate(\'Owner Name\', \'tenantsettings\')%></label>' +
        '<input name="owner" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Owner Name\', \'tenantsettings\')%>" required>' +
        '<label for="owner_contact"><%=goldstone.contextTranslate(\'Owner Email\', \'tenantsettings\')%></label>' +
        '<input name="owner_contact" type="email" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Owner Email\', \'tenantsettings\')%>">' +
        '<br><div><%=goldstone.contextTranslate(\'Tenant ID\', \'tenantsettings\')%>: <span id="formTenantId"><%=goldstone.contextTranslate(\'select from above\', \'tenantsettings\')%></span></div>' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.contextTranslate(\'Update\', \'tenantsettings\')%></button>' +
        '</form>' +
        '</div>' +

        // update openstack settings form
        '<div class="col-md-4">' +
        '<form class="openstack-settings-form">' +
        '<h3><%=goldstone.contextTranslate(\'OpenStack Settings\', \'tenantsettings\')%></h3>' +
        '<label for="os_name"><%=goldstone.contextTranslate(\'OpenStack Tenant Name\', \'tenantsettings\')%></label>' +
        '<input name="os_name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'OpenStack Tenant Name\', \'tenantsettings\')%>">' +
        '<label for="os_username"><%=goldstone.contextTranslate(\'OpenStack Username\', \'tenantsettings\')%></label>' +
        '<input name="os_username" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'OpenStack Username\', \'tenantsettings\')%>">' +
        '<label for="os_password"><%=goldstone.contextTranslate(\'OpenStack Password\', \'tenantsettings\')%></label>' +
        '<input name="os_password" type="password" class="form-control" placeholder="<%=goldstone.contextTranslate(\'OpenStack Password\', \'tenantsettings\')%>">' +
        '<label for="os_auth_url"><%=goldstone.contextTranslate(\'OpenStack Auth URL\', \'tenantsettings\')%></label>' +
        '<input name="os_auth_url" type="text" class="form-control" placeholder="http://...">' +
        // username must be submitted with request, so including as hidden
        '<input name="username" type="hidden" class="form-control" placeholder="">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.contextTranslate(\'Update\', \'tenantsettings\')%></button>' +
        '</form>' +
        '</div>' +

        '</div>' // /row

    )

});
