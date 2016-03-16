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
            '<div class="datatable-base"></div>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);



        this.testView = new DataTableBaseView({
            el: '.datatable-base',
            chartTitle: 'Events Browser',
            infoIcon: 'fa-table',
            width: 300
        });

        this.update_spy = sinon.spy(this.testView, "update");
        this.gglr_spy = sinon.spy(this.testView, "getGlobalLookbackRefresh");

    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
        this.update_spy.restore();
        this.gglr_spy.restore();
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
        it('extracts values from dataTable generated urls', function() {

            // actual dataTables generated URL
            var testUrl = "http://localhost:8000/?draw=1&columns%5B0%5D%5Bdata%5D=name&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=expiration&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=asc&start=0&length=10&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1455752321100#discover";

            var test1 = this.testView.getPageSize(testUrl);
            var test2 = this.testView.getSearchQuery(testUrl);
            var test3 = this.testView.getPaginationStart(testUrl);
            var test4 = this.testView.getSortByColumnNumber(testUrl);
            var test5 = this.testView.getSortAscDesc(testUrl);

            expect(test1).to.equal('10');
            expect(test2).to.equal('');
            expect(test3).to.equal('0');
            expect(test4).to.equal('1');
            expect(test5).to.equal('asc');

            testUrl = "=0&length=10&search%5Bvalue%5D=blammo&search%5Bregex%5D=false&_=1455752321100#discover";
            var test6 = this.testView.getSearchQuery(testUrl);
            expect(test6).to.equal('blammo');
        });
        it('handles url exceptions', function() {
            var testUrl = "&start=0&length=10&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1455752321100#discover";

            // not present in string
            var test1 = this.testView.getSortByColumnNumber(testUrl);
            // not present in string
            var test2 = this.testView.getSortAscDesc(testUrl);

            // returning fallbacks
            expect(test1).to.equal(0);
            expect(test2).to.equal('desc');
        });
        it('preps data appropriately', function() {

            // passing something other than typeof === object
            var test1 = '';
            var res1 = this.testView.dataPrep(test1);
            expect(res1).to.deep.equal([]);

            // passing something with typeof === object
            var test2 = [{
                'name': 'zippy',
                'face': 'confused'
            }];
            var res2 = this.testView.dataPrep(test2);
            expect(res2).to.deep.equal([
                ['zippy', 'confused']
            ]);
        });
        it('returns table headings sorted appropriately', function() {
            this.testView.headingsToPin = {
                'name': 0,
                'face': 1,
                'beard': 2
            };

            var test1 = [{
                'name': 'zippy',
                'face': 'confused',
                'beard': 'stubble',
                'in-pocket': 'waffle'
            }];
            var res1 = this.testView.dataPrep(test1);
            expect(res1).to.deep.equal([
                ['zippy', 'confused', 'stubble', 'waffle']
            ]);

            this.testView.headingsToPin = {
                'name': 2,
                'in-pocket': 1,
                'face': 0
            };

            var test2 = [{
                'name': 'zippy',
                'face': 'confused',
                'beard': 'stubble',
                'in-pocket': 'waffle'
            }];
            var res2 = this.testView.dataPrep(test2);
            expect(res2).to.deep.equal([
                ['confused', 'waffle', 'zippy', 'stubble']
            ]);
        });
        it('performs a drawSearchTable sanity check', function() {
            this.testView.render();
            this.testView.drawSearchTable('.table', null);
        });
        it('sets the proper top boundary of a refreshed table', function() {

            // lots of html fluff to allow for a scrollTop > 0
            for (var i = 0; i < 100; i++) {
                $('body').prepend('<div><br></div>');
            }
            expect($('body').scrollTop()).equals(0);
            this.testView.render();
            this.testView.drawSearchTable('.table', null);
            expect($('body').scrollTop()).equals(0);

            $('body').scrollTop(20);
            this.testView.drawSearchTable('.table', null);
            expect($('body').scrollTop()).equals(20);

        });
    });
});
