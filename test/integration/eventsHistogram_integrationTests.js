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

describe('eventsHistogramCollection.js spec', function() {
    beforeEach(function() {
        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);
        this.testCollection = new EventsHistogramCollection({});
        this.protoFetchSpy = sinon.spy(EventsHistogramCollection.prototype, "fetch");
    });
    afterEach(function() {
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

            this.clock = sinon.useFakeTimers();
            this.clock.tick(3600000);

            $('body').append('<option id="global-lookback-range" value=60>');
            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(1);
            expect(this.testCollection.url).to.equal('/core/events/summarize/?timestamp__range={"gte":0,"lte":3600000}&interval=150s');

            this.clock.restore();

        });
        it('returns preProcessData', function() {
            var test1 = this.testCollection.preProcessData({
                data: [{
                    14344732500: [{
                        "blah.dee.da": 12
                    }]
                }]
            });
            expect(test1).to.deep.equal([{
                "blah.dee.da": 12,
                "time": 14344732500,
                "count": 12
            }]);

            test1 = this.testCollection.preProcessData({
                data: [{
                    14344732500: [{
                        "blah.dee.da": 12
                    }, {
                        "blah.dee.da": 14
                    }]
                }]
            });

            // overwrites key if duplicated in bucket
            expect(test1).to.deep.equal([{
                "blah.dee.da": 14,
                "time": 14344732500,
                "count": 14
            }]);

            test1 = this.testCollection.preProcessData({
                data: [{
                    14344732500: [{
                        "blah.dee.da": 12
                    }, {
                        "blah.dee.daa": 14
                    }]
                }]
            });
            expect(test1).to.deep.equal([{
                "blah.dee.da": 12,
                "blah.dee.daa": 14,
                "time": 14344732500,
                "count": 26
            }]);

            test1 = this.testCollection.preProcessData({
                data: [{
                    14344732500: [{
                        "blah.dee.da": 12
                    }, {
                        "blah.dee.daa": 14
                    }]
                }, {
                    14344732600: [{
                        "blah.dee.da": 0
                    }, {
                        "blah.dee.daa": 1
                    }]
                }]
            });
            expect(test1).to.deep.equal([{
                "blah.dee.da": 12,
                "blah.dee.daa": 14,
                "time": 14344732500,
                "count": 26
            }, {
                "blah.dee.da": 0,
                "blah.dee.daa": 1,
                "time": 14344732600,
                "count": 1
            }]);

        });
    });

});
