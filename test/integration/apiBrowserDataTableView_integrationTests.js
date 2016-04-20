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

describe('apiBrowserDataTableView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="events-browser-table"></div>'
        );

        var serverResponse = {
            "count": 1830,
            "next": "http://localhost:8000/core/api-calls/?@timestamp__range={\"gte\":1458055081394,\"lte\":1458058681394}&interval=180s&ordering=-@timestamp&page=2&page_size=10",
            "previous": null,
            "results": [{
                "sort": [1458058654928],
                "_type": "api_stats",
                "_source": {
                    "creation_time": "2016-03-15T16:17:34.928Z",
                    "client_ip": "172.24.4.100",
                    "protocol": "1.1",
                    "@version": "1",
                    "@timestamp": "2016-03-15T16:17:34.928Z",
                    "component": "neutron",
                    "uri": "/v2.0/fw/firewall_policies.json",
                    "method": "GET",
                    "host": "rdo-kilo",
                    "response_status": 404,
                    "received_at": "2016-03-15T16:17:33.926Z",
                    "response_length": 266,
                    "type": "api_stats",
                    "port": 52751,
                    "response_time": 0.060748
                },
                "_score": null,
                "_index": "api_stats-2016.03.15",
                "_id": "AVN7EXExIVQbsjUd6tto"
            }],
            "aggregations": {
                "all_status": {
                    "buckets": [{
                        "key": 200,
                        "doc_count": 1555
                    }],
                    "sum_other_doc_count": 0,
                    "doc_count_error_upper_bound": 0
                },
                "per_interval": {
                    "buckets": [{
                        "response_ranges": {
                            "buckets": {
                                "500.0-599.0": {
                                    "to": 599.0,
                                    "from_as_string": "500.0",
                                    "from": 500.0,
                                    "to_as_string": "599.0",
                                    "doc_count": 0
                                },
                                "400.0-499.0": {
                                    "to": 499.0,
                                    "from_as_string": "400.0",
                                    "from": 400.0,
                                    "to_as_string": "499.0",
                                    "doc_count": 0
                                },
                                "300.0-399.0": {
                                    "to": 399.0,
                                    "from_as_string": "300.0",
                                    "from": 300.0,
                                    "to_as_string": "399.0",
                                    "doc_count": 0
                                },
                                "200.0-299.0": {
                                    "to": 299.0,
                                    "from_as_string": "200.0",
                                    "from": 200.0,
                                    "to_as_string": "299.0",
                                    "doc_count": 0
                                }
                            }
                        },
                        "statistics": {
                            "count": 0,
                            "max": null,
                            "sum": null,
                            "avg": null,
                            "min": null
                        },
                        "key_as_string": "2016-03-15T15:18:00.000Z",
                        "key": 1458055080000,
                        "doc_count": 0
                    }]
                }
            }
        };

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/core/apiperf/search/&page_size=10&page=1&ordering=-@timestamp", [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(serverResponse)
        ]);

        // instantiated only for access to url generation functions
        this.apiBrowserTableCollection = new GoldstoneBaseCollection({
            skipFetch: true,
            urlBase: "/core/apiperf/search/"
        });

        this.testView = new ApiBrowserDataTableView({
            chartTitle: 'Events Browser',
            collectionMixin: this.apiBrowserTableCollection,
            el: '.events-browser-table',
            width: 300
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });

    describe('testing methods', function() {
        it('serverSideDataPrep', function() {
            // this.server.respond();
            var test1 = this.testView.serverSideDataPrep({
                results: [1, 2, 3],
                count: 42,
            });

            expect(test1).to.equal(
                JSON.stringify({
                    results: [1, 2, 3],
                    recordsTotal: 42,
                    recordsFiltered: 42
                })
            );
            // sanity check
            this.testView.update();
            this.server.respond();
        });
    });
});
