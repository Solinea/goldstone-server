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

describe('logBrowserDataTableView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="log-browser-table"></div>'
        );

        var serverResponse = {
            "count": 7326,
            "next": "http://localhost:8000/core/logs/?%40timestamp__range=%7B%22gte%22%3A1458066868882%2C%22lte%22%3A1458067768882%7D&interval=45s&ordering=-%40timestamp&page=2&page_size=10&syslog_severity__terms=%5B%22emergency%22%2C%22alert%22%2C%22critical%22%2C%22error%22%2C%22warning%22%2C%22notice%22%2C%22info%22%2C%22debug%22%5D",
            "previous": null,
            "results": [{
                "sort": [1458067763045],
                "_type": "syslog",
                "_source": {
                    "syslog_severity_code": 6,
                    "syslog5424_host": "rdo-kilo",
                    "tags": ["filter_16_fail", "filter_20_pass", "filter_34_fail"],
                    "@version": "1",
                    "@timestamp": "2016-03-15T18:49:23.045Z",
                    "syslog5424_pri": "150",
                    "syslog_facility": "local2",
                    "syslog_severity": "INFO",
                    "host": "rdo-kilo",
                    "syslog_ts": "2016-03-15T18:49:23.045796+00:00",
                    "received_at": "2016-03-15T18:49:21.357Z",
                    "log_message": "object-server: Begin object audit \"forever\" mode (ZBF)",
                    "message": "<150>2016-03-15T18:49:23.045796+00:00 rdo-kilo object-server: Begin object audit \"forever\" mode (ZBF)",
                    "type": "syslog",
                    "port": 52751,
                    "syslog_facility_code": 18
                },
                "_score": null,
                "_index": "logstash-2016.03.15",
                "_id": "AVN7nGjnIVQbsjUd7DeS"
            }],
            "aggregations": {
                "all_levels": {
                    "buckets": [{
                        "key": "INFO",
                        "doc_count": 6677
                    }, {
                        "key": "NOTICE",
                        "doc_count": 478
                    }, {
                        "key": "WARNING",
                        "doc_count": 157
                    }, {
                        "key": "ERROR",
                        "doc_count": 14
                    }, {
                        "key": "DEBUG",
                        "doc_count": 0
                    }],
                    "sum_other_doc_count": 0,
                    "doc_count_error_upper_bound": 0
                },
                "per_interval": {
                    "buckets": [{
                        "per_level": {
                            "buckets": [{
                                "key": "NOTICE",
                                "doc_count": 1
                            }, {
                                "key": "DEBUG",
                                "doc_count": 0
                            }, {
                                "key": "ERROR",
                                "doc_count": 0
                            }, {
                                "key": "INFO",
                                "doc_count": 0
                            }, {
                                "key": "WARNING",
                                "doc_count": 0
                            }],
                            "sum_other_doc_count": 0,
                            "doc_count_error_upper_bound": 0
                        },
                        "key_as_string": "2016-03-15T18:33:45.000Z",
                        "key": 1458066825000,
                        "doc_count": 1
                    }]
                }
            }
        };

        this.clock = sinon.useFakeTimers(900000);

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/core/logs/search/&page_size=10&page=1&ordering=-@timestamp", [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(serverResponse)
        ]);
        this.server.respondWith("GET", "/core/logs/?@timestamp__range={\"gte\":0,\"lte\":900000}&interval=45s&page_size=10&page=1&ordering=-@timestamp", [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(serverResponse)
        ]);

        // instantiated only for access to url generation functions
        this.logSearchObserverCollection = new SearchObserverCollection({
            skipFetch: true,
            urlBase: "/core/logs/",
            specificHost: undefined
        });

        this.testView = new LogBrowserDataTableView({
            chartTitle: goldstone.translate('Log Browser'),
            collectionMixin: this.logSearchObserverCollection,
            el: '.log-browser-table',
            width: 300
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });

    describe('testing methods', function() {
        it('serverSideDataPrep', function() {
            this.server.respond();
            var test1 = this.testView.serverSideDataPrep({
                count: 42,
                results: [{
                    "sort": [1458067763045],
                    "_type": "syslog",
                    "_source": {
                        "syslog_severity_code": 6,
                        "syslog5424_host": "rdo-kilo",
                        "tags": ["filter_16_fail", "filter_20_pass", "filter_34_fail"],
                        "@version": "1",
                        "@timestamp": "2016-03-15T18:49:23.045Z",
                        "syslog5424_pri": "150",
                        "syslog_facility": "local2",
                        "syslog_severity": "INFO",
                        "host": "rdo-kilo",
                        "syslog_ts": "2016-03-15T18:49:23.045796+00:00",
                        "received_at": "2016-03-15T18:49:21.357Z",
                        "log_message": "object-server: Begin object audit \"forever\" mode (ZBF)",
                        "message": "<150>2016-03-15T18:49:23.045796+00:00 rdo-kilo object-server: Begin object audit \"forever\" mode (ZBF)",
                        "type": "syslog",
                        "port": 52751,
                        "syslog_facility_code": 18
                    },
                    "_score": null,
                    "_index": "logstash-2016.03.15",
                    "_id": "AVN7nGjnIVQbsjUd7DeS"
                }]
            });

            expect(test1).to.equal(
                JSON.stringify({
                    results: [{
                        "sort": [1458067763045],
                        "_type": "syslog",
                        "_source": {
                            "syslog_severity_code": 6,
                            "syslog5424_host": "rdo-kilo",
                            "tags": ["filter_16_fail", "filter_20_pass", "filter_34_fail"],
                            "@version": "1",
                            "@timestamp": "2016-03-15T18:49:23.045Z",
                            "syslog5424_pri": "150",
                            "syslog_facility": "local2",
                            "syslog_severity": "INFO",
                            "host": "rdo-kilo",
                            "syslog_ts": "2016-03-15T18:49:23.045796+00:00",
                            "received_at": "2016-03-15T18:49:21.357Z",
                            "log_message": "object-server: Begin object audit \"forever\" mode (ZBF)",
                            "message": "<150>2016-03-15T18:49:23.045796+00:00 rdo-kilo object-server: Begin object audit \"forever\" mode (ZBF)",
                            "type": "syslog",
                            "port": 52751,
                            "syslog_facility_code": 18
                        },
                        "_score": null,
                        "_index": "logstash-2016.03.15",
                        "_id": "AVN7nGjnIVQbsjUd7DeS",
                        "@timestamp": "2016-03-15T18:49:23.045Z",
                        "syslog_severity": "INFO",
                        "component": '',
                        "log_message": "object-server: Begin object audit \"forever\" mode (ZBF)",
                        "host": "rdo-kilo"
                    }],
                    "recordsTotal": 42,
                    "recordsFiltered": 42
                }));
            // sanity check
            this.testView.update();
        });
    });
});
