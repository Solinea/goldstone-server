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

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('settingsPageView.js spec', function() {
    beforeEach(function() {

        $('body').html('' +

            /// for testing language switch:
            '<div class="col-md-2">' +
            '<h5><%= goldstone.translate("Language") %></h5>' +
            '<form class="language-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-5">' +
            '<div class="input-group">' +
            '<select class="form-control" id="language-name">' +
            '<option value="English" selected>dark</option>' +
            '<option value="Japanese">dark</option>' +
            '</select>' +

            // for testing theme switch
            '<form class="theme-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-5">' +
            '<div class="input-group">' +
            '<select class="form-control" id="theme-name">' +
            '<option value="dark" selected>dark</option>' +
            '<option value="light">light</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith('{date_joined: "2015-03-16T20:50:24Z", default_tenant_admin: false, email: "", first_name: "", last_login: "2015-03-16T20:50:24Z", last_name: "", tenant_admin: true, username: "test", uuid: "dd25bce27a094a868c9ccbb0a698972f"}');

        goldstone.userPrefsView = new UserPrefsView();

        this.protoSetLanguage = sinon.spy(I18nModel.prototype, "setCurrentLanguage");

        this.testView = new SettingsPageView({
            el: '.test-container'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoSetLanguage.restore();
        localStorage.clear();
    });
    describe('basic test for chart triggering', function() {
        it('renders view', function() {
            this.testView.render();
            this.testView.submitRequest();
            this.server.respond();
            this.testView.getUserSettings();
            this.server.respond();
            this.testView.renderTenantSettingsPageLink();
            this.testView.addHandlers();
            $('.settings-form').submit();
            $('.password-reset-form').submit();
        });
    });
    describe('individual functions', function() {
        it('trims input', function() {
            // append input field
            $('body').append('<input name="test1" type="text">');
            // set input field to 'hello'
            $('[name="test1"]').val('hello');
            expect($('[name="test1"]').val()).to.equal('hello');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
            // set input field to ' hello'
            $('[name="test1"]').val(' hello');
            expect($('[name="test1"]').val()).to.equal(' hello');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
            // set input field to 'hello '
            $('[name="test1"]').val('hello ');
            expect($('[name="test1"]').val()).to.equal('hello ');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
        });
    });
});
