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

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith('{date_joined: "2015-03-16T20:50:24Z", default_tenant_admin: false, email: "", first_name: "", last_login: "2015-03-16T20:50:24Z", last_name: "", tenant_admin: true, username: "test", uuid: "dd25bce27a094a868c9ccbb0a698972f"}');

        this.testView = new UserPrefsView();
    });
    afterEach(function() {
        this.server.restore();
        localStorage.clear();
    });
    describe('individual functions', function() {
        it('initializes defaults', function() {
            expect(this.testView.defaults).to.deep.equal({});
        });
        it('initializes localStorage', function() {
            expect(localStorage.getItem('userPrefs')).to.equal(null);
            this.testView.initLocalStorageUserPrefs();
            expect(localStorage.getItem('userPrefs')).to.equal(JSON.stringify({}));
        });
        it('initializes defaults', function() {
            this.testView.defaults.userPrefs = null;
            this.testView.getUserPrefs();
            expect(this.testView.defaults.userPrefs).to.deep.equal({});
        });
    });
});
