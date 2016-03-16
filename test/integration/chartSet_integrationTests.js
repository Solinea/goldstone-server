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
//integration tests - goldstoneBaseCollection.js

describe('chartSet.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);



        this.testCollection = new GoldstoneBaseCollection({});

        this.testView = new ChartSet({
            el: '.container',
            collection: this.testCollection
        });
        // this.protoFetchSpy = sinon.spy(GoldstoneBaseCollection.prototype, "fetch");
    });
    afterEach(function() {
        this.server.respond();
        this.server.restore();
        // this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
        });
    });
    describe('general methods', function() {
        it('should process options', function() {
            expect(this.testView.options).to.deep.equal({
                el: '.container',
                collection: this.testCollection
            });
        });
        it('should overwrite defaults', function() {
            expect(this.testView.xParam).to.equal(undefined);
            this.testView.resetXParam('hoop');
            expect(this.testView.xParam).to.equal('hoop');
            this.testView.resetXParam();
            expect(this.testView.xParam).to.equal('time');

            expect(this.testView.yParam).to.equal(undefined);
            this.testView.resetYParam('shoop');
            expect(this.testView.yParam).to.equal('shoop');
            this.testView.resetYParam();
            expect(this.testView.yParam).to.equal('count');
        });
        it('should work with collection', function() {
            this.testView.update();
        });
        it('basic method sanity check', function() {
            this.testView.switchShape();
            this.testView.areaSetter();
            this.testView.pathAdder([]);
            this.testView.svgClearer('rect');
        });
    });

});
