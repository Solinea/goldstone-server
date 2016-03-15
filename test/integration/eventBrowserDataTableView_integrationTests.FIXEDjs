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

describe('eventsBrowserDataTableView.js', function() {
    beforeEach(function() {
        $('body').html(
            '<div class="events-browser-table"></div>'
        );

        var serverResponse = {
            "count": 1830,
            "next": "http://localhost:8000/core/api-calls/?@timestamp__range={\"gte \":1458055081394,\"lte \":1458058681394}&interval=180s&ordering=-@timestamp&page=2&page_size=10",
            "previous": null,
            "results": [{
                "sort": [1458069753144],
                "_type": "identity.authenticate",
                "_source": {
                    "traits": {
                        "typeURI": "http://schemas.dmtf.org/cloud/audit/1.0/event",
                        "eventTime": "2016-03-15T19:22:33.144113 0000",
                        "initiator_typeURI": "service/security/account/user",
                        "service": "identity.rdo-kilo",
                        "eventType": "activity",
                        "target_id": "openstack:2ca047de-788f-4929-a6a8-47e1e7f41da1",
                        "observer_id": "openstack:cdfb7b89-1535-420c-b12e-83c19674655f",
                        "initiator_id": "6248c2002b1a48bdbbb80550cda9ad99",
                        "target_typeURI": "service/security/account/user",
                        "observer_typeURI": "service/security",
                        "action": "authenticate",
                        "initiator_host_addr": "172.24.4.100",
                        "initiator_host_agent": "python-keystoneclient",
                        "outcome": "success",
                        "id": "openstack:f48f9b15-636d-4803-b481-ec7b4ef1a0d7"
                    },
                    "raw": {},
                    "timestamp": "2016-03-15T19:22:33.144308"
                },
                "_score": null,
                "_index": "events_2016-03-15",
                "_id": "48995cda-f352-42be-9187-83458a2ce492"
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
                        "per_outcome": {
                            "buckets": [],
                            "sum_other_doc_count": 0,
                            "doc_count_error_upper_bound": 0
                        },
                        "key_as_string": "2016-03-15T19:21:45.000Z",
                        "key": 1458069705000,
                        "doc_count": 0
                    }]
                }
            }
        };

        this.clock = sinon.useFakeTimers(900000);

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", '/core/events/?timestamp__range={"gte":0,"lte":900000}&interval=45s&page_size=10&page=1&ordering=timestamp', [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(serverResponse)
        ]);

        // and a reponse for one ms later
        this.server.respondWith("GET", '/core/events/?timestamp__range={"gte":1,"lte":900001}&interval=45s&page_size=10&page=1&ordering=timestamp', [200, {
                "Content-Type": "application/json"
            },
            JSON.stringify(serverResponse)
        ]);

        // instantiated only for access to url generation functions
        this.eventsSearchObserverCollection = new SearchObserverCollection({

            // overwriting to call timestamp instead of "@timestamp"
            addRange: function() {
                return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
            },

            urlBase: '/core/events/',
            skipFetch: true
        });


        this.testView = new EventsBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Events Browser', 'eventsbrowser'),
            collectionMixin: this.eventsSearchObserverCollection,
            el: '.events-browser-table',
            width: $('.events-browser-table').width()
        });


    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.clock.restore();
    });

    describe('testing methods', function() {
        it('serverSideDataPrep', function() {
            this.server.respond();
            // table redraws itself at the end of the event loop
            this.clock.tick(1);
            this.server.respond();

            // another method of kicking an update
            this.testView.update();
            this.clock.tick(1);
            this.server.respond();
        });
    });
});
