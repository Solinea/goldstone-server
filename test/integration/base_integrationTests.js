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

describe('base.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');
        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);



        $('body').append('<form class="global-lookback-selector role="form"><div class="form-group"><div class="col-xl-1"><div class="input-group"><select class="form-control" id="global-lookback-range"><option value="20"></select></div></div></div></form>');

        this.testCollection = new GoldstoneBaseCollection({
            url: 'hoo/haw'
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
    });
    describe('alerts are raised', function() {
        it('properly replaces and truncates messages', function() {
            var message = 'hi';
            expect($('.test-container').text()).to.equal('');
            goldstone.raiseAlert('.test-container', message);
            expect($('.test-container').text()).to.include('hi');
            message = 'bye';
            goldstone.raiseAlert('.test-container', message);
            expect($('.test-container').text()).to.include('bye');
            message = 'asdflkjasdflkjsadflkjdsaflkjdsaflkjdsaflkjdsflkjdsflkjdsaflkjdsaflkjdsaflkjdsaflkjsdlakfjfdsasdflkjasdflkjsadflkjdsaflkjdsaflkjdsaflkjdsflkjdsflkjdsaflkjdsaflkjdsaflkjdsaflkjsdlakfjfdslkjdsaflkjdsaflkdjfslklkdsajfldksajflsdakjflkdsafj';
            goldstone.raiseAlert('.test-container', message);
            expect($('.test-container').text().length).to.equal(203);
        });
        it('properly cascades alerts', function() {
            this.raiseError_spy = sinon.spy(goldstone, "raiseError");
            this.raiseDanger_spy = sinon.spy(goldstone, "raiseDanger");
            this.raiseWarning_spy = sinon.spy(goldstone, "raiseWarning");
            this.raiseSuccess_spy = sinon.spy(goldstone, "raiseSuccess");
            this.raiseInfo_spy = sinon.spy(goldstone, "raiseInfo");
            this.raiseAlert_spy = sinon.spy(goldstone, "raiseAlert");

            expect(this.raiseError_spy.callCount).to.equal(0);
            expect(this.raiseDanger_spy.callCount).to.equal(0);
            expect(this.raiseWarning_spy.callCount).to.equal(0);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(0);

            goldstone.raiseError();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(1);
            expect(this.raiseWarning_spy.callCount).to.equal(0);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(1);

            goldstone.raiseDanger();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(0);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(2);

            goldstone.raiseWarning();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(1);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(3);

            goldstone.raiseSuccess();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(1);
            expect(this.raiseSuccess_spy.callCount).to.equal(1);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(4);

            goldstone.raiseInfo();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(1);
            expect(this.raiseSuccess_spy.callCount).to.equal(1);
            expect(this.raiseInfo_spy.callCount).to.equal(1);
            expect(this.raiseAlert_spy.callCount).to.equal(5);

            this.raiseError_spy.restore();
            this.raiseDanger_spy.restore();
            this.raiseWarning_spy.restore();
            this.raiseSuccess_spy.restore();
            this.raiseInfo_spy.restore();
            this.raiseAlert_spy.restore();
        });
    });
    describe('base collection is tested', function() {
        it('returns the proper lookback', function() {
            var test1 = this.testCollection.computeLookbackAndInterval();
            expect(this.testCollection.globalLookback).to.equal(20);
        });
        it('fetches', function() {
            this.testCollection.fetchNoReset();
            this.server.respond();
        });
        it('parses', function() {
            var test1 = this.testCollection.parse([1, 2, 3]);
            expect(test1).to.deep.equal([1, 2, 3]);
        });
    });
});
