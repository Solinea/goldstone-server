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

var SettingsPageView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.el = this.options.el;
        this.render();
        this.getUserSettings();
        this.addHandlers();
    },

    onClose: function() {
        $('#global-lookback-range').show();
        $('#global-refresh-range').show();
    },

    renderTenantSettingsPageLink: function() {
        $('#tenant-settings-button').append('' +
            '<h3>' + goldstone.translate("Additional Actions") + '</h3>' +
            '<button class="btn btn-lg btn-primary btn-block modify">' + goldstone.translate("Modify Tenant Settings") + '</button>');

        $('button.modify').on('click', function() {
            window.location.href = "#settings/tenants";
        });
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
            data: data
        }).done(function(success) {
            self.dataErrorMessage(message);
        })
            .fail(function(fail) {
                try {
                    self.dataErrorMessage(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    self.dataErrorMessage(fail.responseText + e);
                }
            });
    },

    render: function() {

        $('#global-lookback-range').hide();
        $('#global-refresh-range').hide();

        this.$el.html(this.template());

        // iterate through goldstone.i18nJSON and render a dropdown
        // selector item for each of the languages present
        this.renderLanguageChoices();

        return this;
    },

    renderLanguageChoices: function() {

        // defined on router.html
        _.each(goldstone.i18nJSON, function(item, key) {
            $('#language-name').append('<option value="' + key + '">' + key + '</option>');
        });
    },

    getUserSettings: function() {
        var self = this;

        $.get('/user/')
            .done(function(result) {
                $(self.el).find('[name="username"]').val(result.username);
                $(self.el).find('[name="first_name"]').val(result.first_name);
                $(self.el).find('[name="last_name"]').val(result.last_name);
                $(self.el).find('[name="email"]').val(result.email);

                // result object contains tenant_admin field (true|false)
                if (result.tenant_admin || result.is_superuser) {

                    // if true, render link to tenant admin settings page
                    if (result.tenant_admin === true || result.is_superuser === true) {
                        self.renderTenantSettingsPageLink();
                    }
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo(goldstone.contextTranslate('Could not load user settings.', 'settingspage'));
            });

        // get current user prefs
        var userTheme = JSON.parse(localStorage.getItem('userPrefs'));

        // set dropdown for theme selection to current theme preference
        if (userTheme && userTheme.theme) {
            $('#theme-name').val(userTheme.theme);
        }

        // set dropdown for topology tree style selection
        // to current style preference
        if (userTheme && userTheme.topoTreeStyle) {
            $('#topo-tree-name').val(userTheme.topoTreeStyle);
        }

        // set dropdown for language selection to
        // current language preference
        if (userTheme && userTheme.i18n) {
            $('#language-name').val(userTheme.i18n);
        }

    },


    addHandlers: function() {
        var self = this;

        // add listener to settings form submission button
        $('.settings-form').on('submit', function(e) {
            e.preventDefault();

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="username"]');
            self.trimInputField('[name="first_name"]');
            self.trimInputField('[name="last_name"]');

            // ('[name="email"]') seems to have native .trim()
            // support based on the type="email"

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/user/', $(this).serialize(), goldstone.contextTranslate('Settings update successful', 'settingspage'));
        });

        // add listener to password form submission button
        $('.password-reset-form').on('submit', function(e) {
            e.preventDefault();
            self.submitRequest('POST', '/accounts/password/', $(this).serialize(), goldstone.contextTranslate('Password update successful', 'settingspage'));

            // clear password form after submission, success or not
            $('.password-reset-form').find('[name="current_password"]').val('');
            $('.password-reset-form').find('[name="new_password"]').val('');
        });

        // add listener to theme selection drop-down
        // userPrefsView is instantiated in router.html
        $('#theme-name').on('change', function() {
            var theme = $('#theme-name').val();
            if (theme === 'dark') {
                goldstone.userPrefsView.trigger('darkThemeSelected');
            }
            if (theme === 'light') {
                goldstone.userPrefsView.trigger('lightThemeSelected');
            }
        });

        // add listener to theme selection drop-down
        // userPrefsView is instantiated in router.html
        $('#topo-tree-name').on('change', function() {
            var topoStyle = $('#topo-tree-name').val();
            if (topoStyle === 'collapse') {
                goldstone.userPrefsView.trigger('collapseTreeSelected');
            }
            if (topoStyle === 'zoom') {
                goldstone.userPrefsView.trigger('zoomTreeSelected');
            }
        });

        // add listener to language selection drop-down
        // userPrefsView is instantiated in router.html
        $('#language-name').on('change', function() {
            var language = $('#language-name').val();
            goldstone.userPrefsView.trigger('i18nLanguageSelected', language);

            // for this page only, re-render content upon language page
            // to reflect translatable fields immediately
            self.render();
            self.getUserSettings();
            self.addHandlers();
        });

    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +
        '<div class="container">' +

        // theme switcher
        '<div class="row col-md-offset-2">' +

        '<h3><%= goldstone.translate("User Settings") %></h3>' +

        // dark/light theme selector
        '<div class="col-md-2">' +
        '<h5><%=goldstone.translate("Theme Settings")%></h5>' +
        '<form class="theme-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="theme-name">' +
        '<option value="light"><%=goldstone.contextTranslate(\'Light\', \'settingspage\')%></option>' +
        '<option value="dark"><%=goldstone.contextTranslate(\'Dark\', \'settingspage\')%></option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +


        // topology tree style
        '<div class="col-md-2">' +
        '<h5><%=goldstone.translate("Topology Tree Style")%></h5>' +
        '<form class="topo-tree-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="topo-tree-name">' +
        '<option value="collapse"><%=goldstone.contextTranslate(\'Collapse\', \'settingspage\')%></option>' +
        '<option value="zoom"><%=goldstone.contextTranslate(\'Zoom\', \'settingspage\')%></option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +

        // language preference
        '<div class="col-md-2">' +
        '<h5><%= goldstone.translate("Language") %></h5>' +
        '<form class="language-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="language-name">' +
        // dynamically filled in via renderLanguageChoices()
        // '<option value="English">English</option>' +
        // '<option value="Japanese">Japanese</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +

        // closes row
        '</div>' +

        '<hr>' +

        // popup message row
        '<div class="row">' +
        '<div class="col-md-8 col-md-offset-2">' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<br></div>' +
        '</div>' +

        // personal settings form
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-2">' +
        '<form class="settings-form">' +
        '<h3><%=goldstone.translate("Update Personal Settings")%></h3>' +
        '<label for="inputUsername"><%=goldstone.translate("Username")%></label>' +
        '<input id="inputUsername" name="username" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Username\', \'settingspage\')%>" required>' +
        '<label for="inputFirstname"><%=goldstone.contextTranslate(\'First Name\', \'settingspage\')%></label>' +
        '<input id="inputFirstname" name="first_name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'First Name\', \'settingspage\')%>" autofocus>' +
        '<label for="inputLastname"><%=goldstone.contextTranslate(\'Last Name\', \'settingspage\')%></label>' +
        '<input id="inputLastname" name="last_name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Last Name\', \'settingspage\')%>">' +
        '<label for="inputEmail"><%=goldstone.contextTranslate(\'Email\', \'settingspage\')%></label>' +
        '<input id="inputEmail" name="email" type="email" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Email\', \'settingspage\')%>">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.translate("Update")%></button>' +
        '</form>' +
        '</div>' +

        // password reset form
        '<div class="col-md-4">' +
        '<form class="password-reset-form">' +
        '<h3><%=goldstone.translate("Change Password")%></h3>' +
        '<label for="inputCurrentPassword"><%=goldstone.contextTranslate(\'Current Password\', \'settingspage\')%></label>' +
        '<input id="inputCurrentPassword" name="current_password" type="password" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Current Password\', \'settingspage\')%>" required>' +
        '<label for="inputNewPassword"><%=goldstone.contextTranslate(\'New Password\', \'settingspage\')%></label>' +
        '<input id="inputNewPassword" name="new_password" type="password" class="form-control" placeholder="<%=goldstone.contextTranslate(\'New Password\', \'settingspage\')%>" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.translate("Change Password")%></button>' +
        '</form>' +
        '</div>' +

        // close divs for row/container
        '</div>' +
        '</div>' +

        // tenant settings link
        '<div class="container">' +
        '<div class="row"><hr>' +
        '<div class="col-md-4 col-md-offset-2" id="tenant-settings-button">' +
        '</div>' +
        '</div>' +
        '</div>'


    )

});
