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

describe('MultiRscsView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        assert.lengthOf($('#multi-rsrc-panel'), 0);

        this.testView = new MultiRscsView({
            el: '.test-container'
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('triggers MultiRscsView', function() {
            assert.isDefined($('.test-container'));
            assert.isDefined($('#multi-rsrc-panel'));
            assert.lengthOf($('#multi-rsrc-panel'), 1);
        });
        it('errorTrigger appends an error message', function() {
            this.testView.trigger('errorTrigger', []);
            expect($(this.testView.el).text()).to.not.contain('happy flowers');
            this.testView.trigger('errorTrigger', [{
                responseText: 'happy flowers'
            }]);
            expect($(this.testView.el).text()).to.contain('happy flowers');
        });
        it('clicking info button brings up info text', function() {
            expect($(this.testView.el).text()).to.not.contain('additional resource info');
            $(this.testView.el).find('#info-button').click();
            expect($(this.testView.el).text()).to.contain('additional resource info');
            $(this.testView.el).find('#info-button').mouseout();
        });
    });
});
