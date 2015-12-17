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

describe('newPasswordView.js spec', function() {
    beforeEach(function() {

        $('body').html('' +
            '<form class="login-form">' +
            '<input name="new_password" type="password" id="password" placeholder="Enter new password" required autofocus>' +
            '<input type="password" id="confirm_password" placeholder="Confirm password" required>' +
            '<button class="full-width-btn" type="submit">Set new password</button>' +
            '<a class="reset-pw" href="/login/">cancel and return to login</a>' +
            '</form>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "accounts/login/", [200, {
            "Content-Type": "application/json"
        }, '[]']);
        data = [];

        var testNewPasswordView = NewPasswordView.extend({
            getUidToken: function() {
                return 'abc123';
            },
            submitRequest: function(input) {
                return true;
            }
        });

        this.testView = new testNewPasswordView({});

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('submits request', function() {
            this.testView.submitRequest();
        });
    });
    describe('basic view functionality', function() {
        it('resets fields', function() {
            $('#password').val('123');
            $('#confirm_password').val('123');
            expect($('#password').val()).to.equal('123');
            expect($('#confirm_password').val()).to.equal('123');
            this.testView.clearFields();
            expect($('#password').val()).to.equal('');
            expect($('#confirm_password').val()).to.equal('');

        });
    });
});
