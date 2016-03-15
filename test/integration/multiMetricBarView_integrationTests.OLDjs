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

describe('multiMetricBarView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        

        this.testCollection = new MultiMetricComboCollection({
            metricNames: ['os.cpu.sys', 'os.cpu.user', 'os.cpu.wait'],
        });

        this.testView = new MultiMetricBarView({
            chartTitle: "VM Spawns",
            collection: this.testCollection,
            featureSet: 'mem',
            height: 300,
            infoCustom: 'novaSpawns',
            el: '.testContainer',
            width: $('.testContainer').width(),
            yAxisLabel: 'mult met bar view'
        });


    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('tests methods', function() {
        it('inits properly', function() {
            this.testCollection.trigger('sync');
            // this.testCollection.defaults.urlCollectionCountOrig = 3;
            // this.testCollection.defaults.urlCollectionCount = 0;
            // this.testCollection.trigger('sync');
        });
    });
});
