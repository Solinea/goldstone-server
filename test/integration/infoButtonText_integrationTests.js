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

describe('infoButtonText.js spec', function() {
    beforeEach(function() {

        this.testView = new InfoButtonText();

    });
    afterEach(function() {});
    describe('returns text', function() {
        it('when functions are called', function() {
            var test = this.testView.defaults.infoText;
            assert.isDefined(test.discoverCloudTopology());
            assert.isDefined(test.eventTimeline());
            assert.isDefined(test.nodeAvailability());
            assert.isDefined(test.serviceStatus());
            assert.isDefined(test.utilization());
            assert.isDefined(test.hypervisor());
            assert.isDefined(test.novaTopologyDiscover());
            assert.isDefined(test.cinderTopologyDiscover());
            assert.isDefined(test.glanceTopologyDiscover());
            assert.isDefined(test.keystoneTopologyDiscover());
            assert.isDefined(test.logBrowser());
            assert.isDefined(test.novaSpawns());
            assert.isDefined(test.novaCpuResources());
            assert.isDefined(test.novaMemResources());
            assert.isDefined(test.novaDiskResources());
            assert.isDefined(test.cloudTopologyResourceList());
        });
    });
});
