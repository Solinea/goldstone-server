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

describe('LogoutIcon.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("/ho/hum", [401, {
            "Content-Type": "application/json"
        }, 'test unauthorized']);

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new LogoutIcon({
            el: '.test-container'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('renders view', function() {
            this.testView.render();
        });
        it('logout icon remains hidden when no auth token present', function() {
            localStorage.clear();
            expect($('.fa-sign-out').css('visibility')).to.equal('hidden');
        });
        it('renders view with auth token', function() {
            localStorage.setItem('userToken', 'here_i_am!');
            this.testView.viewSwitchTriggered();
            expect($('.fa-sign-out').css('visibility')).to.equal('visible');
        });
        it('clears a token', function() {
            localStorage.setItem('userToken', 'fun1with2tokens3');
            expect(localStorage.getItem('userToken')).to.equal('fun1with2tokens3');
            this.testView.clearToken();
            expect(localStorage.getItem('userToken')).to.equal(null);
        });
        it('sets up request header params', function() {
            localStorage.setItem('userToken', 'now1i2can3haz4tokens5');
            this.testView.setAJAXSendRequestHeaderParams();
        });
        it('redirects to login', function() {
            this.testView.redirectToLogin();
        });

    });
});
