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
        this.server.restore();
    });
    describe('view tests', function() {
        it('renders view', function() {
            this.testView.render();
        });
        it('should render charts', function() {
            this.testCollection.reset();
            this.testCollection.add([{
                aggregations: {
                    per_component: {
                        buckets: [{
                            doc_count: 5,
                            key: 'nova'
                        }]
                    }
                }
            }]);
            this.testView.update();
            expect($('.test-container').length).to.be.above(0);
        });
        it('should map statuses', function() {
            var test1 = this.testView.convertStatus('');
            expect(test1).to.equal('unknown');
            var test2 = this.testView.convertStatus(0);
            expect(test2).to.equal('offline');
            var test3 = this.testView.convertStatus(0.000000000001);
            expect(test3).to.equal('online');
            var test4 = this.testView.convertStatus(-1);
            expect(test4).to.equal('offline');
            var test5 = this.testView.convertStatus('abc');
            expect(test5).to.equal('unknown');
            var test6 = this.testView.convertStatus('unknown');
            expect(test6).to.equal('unknown');
            var test7 = this.testView.convertStatus('1');
            expect(test7).to.equal('unknown');
        });

    });
    describe('collection tests', function() {
        it('constructs an aggregated url', function() {
            var test1 = this.testCollection.constructAggregationUrl(1234);
            expect(test1).to.equal('/core/saved_search/1234/results/');
            var test2 = this.testCollection.constructAggregationUrl();
            expect(test2).to.equal('/core/saved_search/undefined/results/');
            var test3 = this.testCollection.constructAggregationUrl('abcd');
            expect(test3).to.equal('/core/saved_search/abcd/results/');
        });
        it('should render charts', function() {
            expect($('.test-container').length).to.be.above(0);
        });
    });
});
