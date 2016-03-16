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
//integration tests

describe('serviceStatusView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "*", [200, {
            'Content-Type': 'application/json'
        }, '{"auth_token":12345}']);

        this.testCollection = new ServiceStatusCollection({
            urlBase: '/core/saved_search/'
        });

        this.testView = new ServiceStatusView({
            chartTitle: 'test',
            collection: this.testCollection,
            el: '.test-container',
            width: $('.test-container').width()
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
    });
    describe('view tests', function() {
        it('renders view', function() {
            this.testView.render();
        });
        it('should render charts', function() {
            this.testCollection.reset();
            this.testCollection.add({
                "count": 5,
                "next": null,
                "previous": null,
                "results": [{
                    "uuid": "59ee1623-9b48-4ce1-9cad-153c75cab784",
                    "name": "cinder",
                    "host": "rdo-kilo",
                    "state": "DOWN",
                    "created": "2016-03-09T18:46:00.336399Z",
                    "updated": "2016-03-09T18:47:00.347864Z"
                }, {
                    "uuid": "009c85cc-cdb7-4784-b21d-94461062e838",
                    "name": "glance",
                    "host": "rdo-kilo",
                    "state": "UP",
                    "created": "2016-03-09T18:41:01.307914Z",
                    "updated": "2016-03-09T18:41:01.307931Z"
                }, {
                    "uuid": "f2885769-40f9-41b7-a250-b7f3bf05df91",
                    "name": "nova",
                    "host": "rdo-kilo",
                    "state": "UP",
                    "created": "2016-03-09T18:41:01.305143Z",
                    "updated": "2016-03-09T18:41:01.305170Z"
                }, {
                    "uuid": "73b2cf8e-30bb-4d41-b526-0a679f21df6f",
                    "name": "neutron",
                    "host": "rdo-kilo",
                    "state": "UP",
                    "created": "2016-03-09T18:41:01.300031Z",
                    "updated": "2016-03-09T18:41:01.300063Z"
                }, {
                    "uuid": "8fd9a230-0af2-49c3-904c-ef7601008274",
                    "name": "keystone",
                    "host": "rdo-kilo",
                    "state": "UP",
                    "created": "2016-03-09T18:41:01.280487Z",
                    "updated": "2016-03-09T18:41:01.280519Z"
                }]
            });
            this.testView.update();
            expect($('.test-container').length).to.be.above(0);
        });
        it('should map statuses', function() {
            var test1 = this.testView.convertStatus('');
            expect(test1).to.equal('unknown');
            var test2 = this.testView.convertStatus(0);
            expect(test2).to.equal('unknown');
            var test3 = this.testView.convertStatus(0.000000000001);
            expect(test3).to.equal('unknown');
            var test4 = this.testView.convertStatus(-1);
            expect(test4).to.equal('unknown');
            var test5 = this.testView.convertStatus('abc');
            expect(test5).to.equal('unknown');
            var test6 = this.testView.convertStatus('unknown');
            expect(test6).to.equal('unknown');
            var test7 = this.testView.convertStatus('1');
            expect(test7).to.equal('unknown');
            var test8 = this.testView.convertStatus('UP');
            expect(test8).to.equal('online');
            var test9 = this.testView.convertStatus('DOWN');
            expect(test9).to.equal('offline');
        });
        it('should render charts', function() {
            expect($('.test-container').length).to.be.above(0);
        });
        it('should properly capitilize service names', function() {
            expect(this.testView.properCap('')).to.equal('');
            expect(this.testView.properCap('zoot')).to.equal('Zoot');
            expect(this.testView.properCap('puppy bagel')).to.equal('Puppy bagel');
            expect(this.testView.properCap('-hi')).to.equal('-hi');
        });
    });
});
