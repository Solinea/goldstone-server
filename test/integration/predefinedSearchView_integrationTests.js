/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('predefinedSearchView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="predefined-search-container"></div>'
        );

        var dData = {
            "count": 2,
            "next": null,
            "previous": null,
            "results": []
        };

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondImmediately = true;
        this.server.respondWith("GET", "*", [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(dData)
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new SearchObserverCollection({
            urlBase: '/blah/de/blah/',
            skipFetch: true
        });

        this.testView = new PredefinedSearchView({
            className: 'compliance-predefined-search nav nav-pills',
            tagName: 'ul',
            collection: this.testCollection
        });

        $('.predefined-search-container').append(this.testView.el);

        this.testDataTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.testCollection,
            el: '#log-viewer-table',
            width: $('#log-viewer-table').width()
        });

        this.testCollection.linkedDataTable = this.testDataTable;


    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });

    describe('testing methods', function() {
        it('tests methods', function() {
            this.testView.instanceSpecificInit();
            this.server.respond();
            this.testView.render();
            this.testView.processListeners();
        });
        it('creates a list of predefined searches', function() {
            var testArr = [{
                uuid: 1234,
                name: 'test'
            }];
            var test1 = this.testView.populatePredefinedSearches(testArr);
            expect(test1).to.include('<li data-uuid=1234>test</li>');
            testArr = [{
                uuid: 1234,
                name: 'test'
            }, {
                uuid: null,
                name: ''
            }];
            var test2 = this.testView.populatePredefinedSearches(testArr);
            expect(test2).to.include('<li data-uuid=1234>test</li>' +
                '<li data-uuid=null></li>');
        });
        it('places "None" at the top of the list', function() {
            this.testView.populatePredefinedSearches();
            this.testView.renderUpdatedResultList();
            expect($('.predefined-search-container').text()).to.include('Predefined Searches None (reset to default)');
        });
        it('appends the search name to the dropdown title', function() {
            var testArr = [{
                uuid: 1234,
                name: 'test'
            }];
            this.testView.predefinedSearches = testArr;
            this.testView.renderUpdatedResultList();
            expect($('.predefined-search-container').text()).to.match(/Predefined Searches/);
            $('[data-uuid="1234"]').click();

            // it also restores the original name after clicking on "none"
            expect($('.predefined-search-container').text()).to.match(/test/);
            $('[data-uuid="null"]').click();
            expect($('.predefined-search-container').text()).to.match(/Predefined Searches/);
        });
    });
});
