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

describe('loginPageView.js spec', function() {
    beforeEach(function() {

        $('body').html('' +

            '<form class="login-form">' +
            '<input type="text" name="username" placeholder="Username" autofocus>' +
            '<input type="password" name="password" placeholder="Password">' +
            '<label class="chkbox" for="chk1">' +
            '<input type="checkbox" value="remember" id="chk1"> <span class="chk-lab"></span> Remember me' +
            '</label>' +
            '<button class="full-width-btn" type="submit">Sign In</button>' +
            '<a class="reset-pw" href="/password/">reset password</a>' +
            '</form>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith(404, '{auth_token: 12345}');
        data = [];

        this.testView = new LoginPageView({});

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('stores auth tokens', function() {
            this.testView.storeAuthToken('hoo_hah');
            expect(localStorage.getItem('userToken')).to.equal('hoo_hah');
        });
        it('triggers login form submit', function() {
            $('input.form-control').val('a');
            $('input.form-control').next().val('a');
            $('form.login-form').submit();
            this.server.respond();
        });
    });
});
