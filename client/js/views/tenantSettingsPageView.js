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

var TenantSettingsPageView = GoldstoneBaseView2.extend({

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

            // if there is no selected tenant, prevent ability to submit form
            if ($('#formTenantId').text() === '') {
                self.dataErrorMessage('Must select tenant from list above');
                return;
            }

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="name"]');
            self.trimInputField('[name="owner"]');
            self.trimInputField('[name="owner_contact"]');
            var tenandId = $('#formTenantId').text();

            // email fields seem to have native .trim() support

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/tenants/' + tenandId + '/', $(this).serialize(), 'Tenant settings', $('.tenant-settings-form'));
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
            self.submitRequest('PUT', '/user/', $(this).serialize(), 'OS settings', $('.openstack-settings-form'));
        });
    },

    drawDataTable: function(json) {

        var self = this;

        // make a dataTable
        var location = '#tenants-single-rsrc-table';
        var oTable;
        var keys = Object.keys(json);
        var data = _.map(keys, function(k) {
            var item = json[k];
            return [item.name, item.owner, item.owner_contact, item.uuid];
        });

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "autoWidth": true,
                "info": false,
                "paging": true,
                "searching": true,
                "columns": [{
                    "title": "Tenant"
                }, {
                    "title": "Owner's Username"
                }, {
                    "title": "Owner Contact"
                }, {
                    "title": "Tenant Id"
                }]
            };
            oTable = $(location).DataTable(oTableParams);
        }

        // IMPORTANT: failure to remove click listeners before appending new ones
        // will continue to create additional listeners and memory leaks.
        $("#tenants-single-rsrc-table tbody").off();

        // add click listeners to pass data values to Update Tenant Settings form.
        $("#tenants-single-rsrc-table tbody").on('click', 'tr', function() {
            var row = oTable.row(this).data();

            $(self.el).find('[name="name"]').val(row[0]);
            $(self.el).find('[name="owner"]').val(row[1]);
            $(self.el).find('[name="owner_contact"]').val(row[2]);
            $(self.el).find('#formTenantId').text(row[3]);

            self.clearDataErrorMessage();
        });
    },

    getTenantAndOSSettings: function() {
        var self = this;

        $.get('/tenants/')
            .done(function(result) {

                if (result.results) {
                    self.drawDataTable(result.results);
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo('Could not load tenant settings');
            });

        $.get('/user/')
            .done(function(result) {
                var $form = $('.openstack-settings-form');
                $form.find('[name="username"]').val(result.username);
                $form.find('[name="os_auth_url"]').val(result.os_auth_url);
                $form.find('[name="os_name"]').val(result.os_name);
                $form.find('[name="os_password"]').val(result.os_password);
                $form.find('[name="os_username"]').val(result.os_username);

                // in case of landing on this page via is_superuser === true,
                // OpenStack settings are not a valid target for updating.
                // Check for this via presence of the OpenStack tenant name
                if(result.os_name === undefined) {

                    // disable all form fields and update button
                    $form.find('input').attr('disabled', 'true');
                    $form.find('button').attr('disabled', true);
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo('could not load OpenStack settings');
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
                self.dataErrorMessage(message + ' update successful');
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
        this.dataErrorMessage('Click row above to edit');
        return this;
    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +

        // dataTable
        '<div class="panel panel-primary tenant_results_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Tenants' +
        '</h3>' +
        '</div>' +
        '</div>' +

        '<div class="panel-body">' +
        '<table id="tenants-single-rsrc-table" class="table"></table>' +
        '</div>' +
        // end data table


        '<div class="container">' +

        // popup message row
        '<div class="row">' +
        '<div class="col-md-8 col-md-offset-2">' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<br></div>' +
        '</div>' +

        '<div class="row">' +

        // update settings form
        '<div class="col-md-4 col-md-offset-2">' +
        '<form class="tenant-settings-form">' +
        '<h3>Goldstone Tenant Settings</h3>' +
        '<label for="name">Tenant Name</label>' +
        '<input name="name" type="text" class="form-control" placeholder="Tenant Name" required>' +
        '<label for="owner">Owner Name</label>' +
        '<input name="owner" type="text" class="form-control" placeholder="Username of Owner" required>' +
        '<label for="owner_contact">Owner Email</label>' +
        '<input name="owner_contact" type="email" class="form-control" placeholder="Owner Email Address">' +
        '<br><div>Tenant Id: <span id="formTenantId">select from above</span></div>' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Update</button>' +
        '</form>' +
        '</div>' +

        // update openstack settings form
        '<div class="col-md-4">' +
        '<form class="openstack-settings-form">' +
        '<h3>OpenStack Settings</h3>' +
        '<label for="os_name">OpenStack Tenant Name</label>' +
        '<input name="os_name" type="text" class="form-control" placeholder="OpenStack Tenant Name">' +
        '<label for="os_username">OpenStack Username</label>' +
        '<input name="os_username" type="text" class="form-control" placeholder="OpenStack Username">' +
        '<label for="os_password">OpenStack Password</label>' +
        '<input name="os_password" type="text" class="form-control" placeholder="OpenStack Password">' +
        '<label for="os_auth_url">OpenStack Auth URL</label>' +
        '<input name="os_auth_url" type="text" class="form-control" placeholder="http://...">' +
        // username must be submitted with request, so including as hidden
        '<input name="username" type="hidden" class="form-control" placeholder="">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Update</button>' +
        '</form>' +
        '</div>' +

        // close divs for row/container
        '</div>' +
        '</div>'

    )

});
