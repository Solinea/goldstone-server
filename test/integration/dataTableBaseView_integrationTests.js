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
//integration tests - serviceStatusView.js

describe('dataTableBaseView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="events-browser-table"></div>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new DataTableBaseView({
            el: '.events-browser-table',
            chartTitle: 'Events Browser',
            infoIcon: 'fa-table',
            width: 300
        });

        this.update_spy = sinon.spy(this.testView, "update");
        this.gglr_spy = sinon.spy(this.testView, "getGlobalLookbackRefresh");

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.update_spy.restore();
        this.gglr_spy.restore();
    });

    describe('unit testing flattenObj', function() {
        it('should return a basic object', function() {
            assert.isDefined(this.testView.flattenObj, 'this.testView.flattenObj has been defined');
            expect(this.testView.flattenObj).to.be.a('function');
            var fut = this.testView.flattenObj;
            var testObj = {};
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({});
        });
        it('should handle non-nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: 'c'
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                c: 'c'
            });

        });
        it('should handle nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    d: 'd',
                    e: 'e',
                    f: 'f'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                d: 'd',
                e: 'e',
                f: 'f',
            });

        });
        it('should transfer null values', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: null,
                d: undefined
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                c: null,
                d: undefined
            });

        });
        it('should not unpack nested arrays', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    d: [1, 2, 3, 4],
                    e: [1, 2, 3, 4],
                    f: [{
                        1: 1,
                        2: 2
                    }, 'hi'],
                    g: 'g'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                d: [1, 2, 3, 4],
                e: [1, 2, 3, 4],
                f: [{
                    1: 1,
                    2: 2
                }, 'hi'],
                g: 'g',
            });

        });
        it('should not overwrite keys that are duplicated in the nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    b: 'new b',
                    c: 'new c',
                    d: 'd'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                b_: 'new b',
                c: 'new c',
                d: 'd'
            });

        });
    });
    describe('testing methods', function() {
        it('should preprocess noop', function() {
            var test1 = this.testView.preprocess(123);
            expect(test1).to.equal(123);
        });
        it('pins headings', function() {
            var test1 = this.testView.isPinnedHeading('name');
            expect(test1).to.equal(true);
            test1 = this.testView.isPinnedHeading('namez');
            expect(test1).to.equal(false);
            test1 = this.testView.isPinnedHeading('nmaez');
            expect(test1).to.equal(false);
        });
        it('prunes undefined values', function() {
            var test1 = this.testView.pruneUndefinedValues([]);
            expect(test1).to.deep.equal([]);
            test1 = this.testView.pruneUndefinedValues([1, 2, 3]);
            expect(test1).to.deep.equal([3, 2, 1]);
            test1 = this.testView.pruneUndefinedValues([, , 3]);
            expect(test1).to.deep.equal([3]);
            test1 = this.testView.pruneUndefinedValues([1, , ]);
            expect(test1).to.deep.equal([1]);
            test1 = this.testView.pruneUndefinedValues([, 2, ]);
            expect(test1).to.deep.equal([2]);
            test1 = this.testView.pruneUndefinedValues([1, , 3]);
            expect(test1).to.deep.equal([3, 1]);
            test1 = this.testView.pruneUndefinedValues([1, 2, ]);
            expect(test1).to.deep.equal([2, 1]);
            test1 = this.testView.pruneUndefinedValues([, 2, 3]);
            expect(test1).to.deep.equal([3, 2]);
            test1 = this.testView.pruneUndefinedValues([, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , 99]);
            expect(test1).to.deep.equal([99]);
            test1 = this.testView.pruneUndefinedValues([1, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , 99]);
            expect(test1).to.deep.equal([99, 1]);
            test1 = this.testView.pruneUndefinedValues([1, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , 5, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , 99]);
            expect(test1).to.deep.equal([99, 5, 1]);
        });
        it('sorts arrays', function() {
            var test1 = this.testView.sortRemainingKeys([]);
            expect(test1).to.deep.equal([]);
            test1 = this.testView.sortRemainingKeys([1, 2, 3]);
            expect(test1).to.deep.equal([1, 2, 3]);
            // sorts numbers as well
            test1 = this.testView.sortRemainingKeys([3, 2, 1]);
            expect(test1).to.deep.equal([1, 2, 3]);
            test1 = this.testView.sortRemainingKeys(['apple', 'banana', 'cat']);
            expect(test1).to.deep.equal(['apple', 'banana', 'cat']);
            test1 = this.testView.sortRemainingKeys(['cat', 'banana', 'apple', 'apple']);
            expect(test1).to.deep.equal(['apple', 'apple', 'banana', 'cat']);
            test1 = this.testView.sortRemainingKeys(['apple', '1banana', 'cat']);
            expect(test1).to.deep.equal(['1banana', 'apple', 'cat']);
        });
        it('processes listeners server side', function() {

            expect(this.gglr_spy.callCount).to.equal(0);
            expect(this.update_spy.callCount).to.equal(0);
            this.testView.processListenersForServerSide();
            // update nor getGlobalLookbackRefresh should have been called
            expect(this.gglr_spy.callCount).to.equal(0);
            expect(this.update_spy.callCount).to.equal(0);
            // triggering 'lookbackSelectorChanged' should fire both functions
            this.testView.trigger('lookbackSelectorChanged');
            expect(this.gglr_spy.callCount).to.be.above(0);
            expect(this.update_spy.callCount).to.be.above(0);
        });
        it('draws search table server side', function() {
            // sanity check
            expect($('.reports-info-container').length).to.equal(1);
            this.testView.drawSearchTableServerSide();
            expect($('.reports-info-container').length).to.equal(0);
        });
    });
});
