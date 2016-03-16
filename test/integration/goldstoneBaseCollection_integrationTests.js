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

describe('goldstoneBaseCollection.js spec', function() {
    beforeEach(function() {
        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);
        this.testCollection = new GoldstoneBaseCollection({
            url: 'test'
        });
        this.protoFetchSpy = sinon.spy(GoldstoneBaseCollection.prototype, "fetch");
    });
    afterEach(function() {
        this.server.respond();
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection).to.be.an('object');
        });
    });
    describe('test collection methods', function() {
        it('should generate urls', function() {
            expect(this.protoFetchSpy.callCount).to.equal(0);
            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(1);
            expect(this.testCollection.url).to.equal('instanceSpecific');

            this.testCollection.addPageSize = function(n) {
                n = n || 1000;
                return '&page_size=' + n;
            };

            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(2);
            expect(this.testCollection.url).to.equal('instanceSpecific&page_size=1000');

            this.testCollection.addPageNumber = function(n) {
                n = n || 1;
                return '&page=' + n;
            };

            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(3);
            expect(this.testCollection.url).to.equal('instanceSpecific&page=1&page_size=1000');

            this.testCollection.addInterval = function(n) {
                n = n || this.interval;
                return '&interval=' + n + 's';
            };

            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(4);
            expect(this.testCollection.url).to.equal("instanceSpecific&interval=37.5s&page=1&page_size=1000");

            this.testCollection.addRange = function() {
                return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
            };

            this.clock = sinon.useFakeTimers();
            this.clock.tick(3600000);

            $('body').append('<option id="global-lookback-range" value=60>');
            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(5);
            expect(this.testCollection.url).to.equal('instanceSpecific?timestamp__range={"gte":0,"lte":3600000}&interval=150s&page=1&page_size=1000');

            this.clock.restore();

        });
        it('returns preProcessData as a noop', function() {
            var test1 = this.testCollection.preProcessData('la dee da');
            expect(test1).to.equal('la dee da');
            test1 = this.testCollection.preProcessData(123);
            expect(test1).to.equal(123);
            test1 = this.testCollection.preProcessData(null);
            expect(test1).to.equal(null);
            test1 = this.testCollection.preProcessData({});
            expect(test1).to.deep.equal({});
            test1 = this.testCollection.preProcessData([]);
            expect(test1).to.deep.equal([]);
            var testDate = new Date();
            test1 = this.testCollection.preProcessData(testDate);
            expect(test1).to.deep.equal(testDate);
            test1 = this.testCollection.preProcessData(undefined);
            expect(test1).to.equal(undefined);
        });
        it('checks for additonal pages', function() {
            // no reason to call fetch
            expect(this.protoFetchSpy.callCount).to.equal(0);
            var data = {};
            var test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = [];
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = '';
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = null;
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = undefined;
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = NaN;
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = 123;
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            data = new Date();
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(0);

            // should call fetch
            data = {
                next: 'instanceSpecific/laDeDaa'
            };
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(1);
            expect(this.protoFetchSpy.args[0][0]).to.deep.equal({
                url: 'instanceSpecific/laDeDaa',
                remove: false
            });

            data = {
                next: 'cruft/instanceSpecific/laDeDaa'
            };
            test1 = this.testCollection.checkForAdditionalPages(data);
            expect(this.protoFetchSpy.callCount).to.equal(2);
            expect(this.protoFetchSpy.args[0][0]).to.deep.equal({
                url: 'instanceSpecific/laDeDaa',
                remove: false
            });
        });
    });

});
