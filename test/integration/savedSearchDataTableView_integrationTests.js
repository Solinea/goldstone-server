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

describe('savedSearchDataTableView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<h3><%=goldstone.translate(\'Saved Search Manager\')%></h3>' +
            '<i class="fa fa-plus-square fa-3x add-button" data-toggle="modal" data-target="#create-modal"></i><br><br>' +
            '<div class="row">' +
            '<div id="saved-search-viz" class="col-md-12"></div>' +
            '</div>' +
            '<div id="create-modal-container"></div>' +
            '<div id="update-modal-container"></div>' +
            '<div id="delete-modal-container"></div>'
        );

        var dData = {
            "count": 2,
            "next": null,
            "previous": null,
            "results": [{
                "uuid": "7906893c-16dc-4ab3-96e0-8f0054bd4cc1",
                "name": "event query",
                "owner": "core",
                "description": "",
                "query": "{ \"query\": { \"match_all\": {} }, \"aggs\": { \"all_types\": { \"terms\": { \"field\": \"_type\", \"min_doc_count\": 0, \"size\": 0 } }, \"field_names\": { \"terms\": { \"field\": \"_field_names\", \"size\": 0 } }, \"per_interval\": { \"date_histogram\": { \"field\": \"timestamp\", \"interval\": \"1d\", \"min_doc_count\": 0 }, \"aggs\": { \"per_outcome\": { \"terms\": { \"field\": \"outcome\", \"size\": 0 } } } } } }",
                "protected": true,
                "index_prefix": "events_*",
                "doc_type": "",
                "timestamp_field": "timestamp",
                "last_start": null,
                "last_end": null,
                "target_interval": 0,
                "created": null,
                "updated": null
            }, {
                "uuid": "5b2ff2fc-b774-49be-ad7e-d1f914ebe32c",
                "name": "ss event",
                "owner": "c1cd0cc0-9cb4-4c94-9412-a357998cb4ba",
                "description": "ev",
                "query": "lkjklj",
                "protected": false,
                "index_prefix": "events_*",
                "doc_type": "syslog",
                "timestamp_field": "timestamp",
                "last_start": null,
                "last_end": null,
                "target_interval": 0,
                "created": "2016-02-02T19:48:08.349958Z",
                "updated": "2016-02-02T19:48:08.349973Z"
            }]
        };

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", '/core/saved_search/?page_size=25&page=1&ordering=name&index_prefix=test-prefix*', [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(dData)
        ]);

        this.server.respondWith("GET", '/user/', [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify({
                uuid: '3.14159',
                name: 'stayFresh'
            })
        ]);

        this.server.respondWith("PATCH", '/core/saved_search/', [200, {
                "Content-Type": "application/json"
            },
            '[]'
        ]);

        this.server.respondWith("DELETE", '/core/saved_search/*', [200, {
                "Content-Type": "application/json"
            },
            '[]'
        ]);

        this.testCollection = new GoldstoneBaseCollection({
            skipFetch: true,
        });
        this.testCollection.urlBase = '/core/saved_search/';
        this.testView = new SavedSearchDataTableView({
            chartTitle: goldstone.translate('testTitle'),
            collectionMixin: this.testCollection,
            el: "#saved-search-viz",
            form_index_prefix: 'test-prefix*',
            form_doc_type: 'syslog',
            form_timestamp_field: '@timestamp',
            urlRoot: '/core/saved_search',
            iDisplayLengthOverride: 25,
            width: $('#saved-search-viz').width()
        });

    });
    afterEach(function() {
        $('body').html('');
        // this.server.respond();
        this.server.restore();
    });

    describe('testing methods', function() {
        it('triggers modal handlers', function() {
            this.testView.createModalHandlers();
            $('.add-button').click();
            $('.create-form').submit();
            $('#cancel-create-button').click();
            this.server.respond();

            this.testView.updateModalHandlers();
            $('#cancel-submit-update-search').click();
            $('.update-form').submit();
            this.testView.deleteModalHandlers();
            $('#cancel-delete-search').click();
            $('.fa-trash-o').click();
            $('#confirm-delete').click();
            this.server.respond();
        });
        it('triggers dataTableRowGenerationHooks', function() {

            var testData = {
                IsLogging: true
            };

            this.testView.dataTableRowGenerationHooks([], testData);
            $('.fa-gear').click();
        });
        it('tests server side data prep', function() {
            this.testView.render();
            this.server.respond();
            this.testView.serverSideDataPrep(JSON.stringify([]));
        });
        it('adds otable params', function() {
            var test1 = this.testView.addOTableParams({});
            var self = this.testView;
            expect(test1.createdRow).to.be.a('function');
        });
        it('createsNewTrailAjax', function() {
            this.server.respondWith("POST", '/core/saved_search', [200, {
                    "Content-Type": "application/json"
                },
                '[]'
            ]);
            this.testView.createNewSearchAjax([]);
            this.server.respond();
            this.testView.update();
            this.server.respond();
        });
        it('pretty prints', function() {
            var test1 = JSON.stringify({
                a: 'abrac',
                b: [1, 2, 3],
                c: 'dabara'
            });

            var res1 = this.testView.prettyPrint(test1);
            expect(res1).to.equal(JSON.stringify(JSON.parse(test1), null, 2));

            // returns original input if not JSON encoded originally
            var test2 = {
                a: 'abrac',
                b: [1, 2, 3],
                c: 'dabara'
            };

            var res2 = this.testView.prettyPrint(test2);
            expect(res2).to.deep.equal(test2);

        });
    });
});
