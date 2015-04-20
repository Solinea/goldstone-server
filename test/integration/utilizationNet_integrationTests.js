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

describe('UtilizationNet.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.protoFetchSpy = sinon.spy(UtilizationNetCollection.prototype, "fetch");

        this.testCollection = new UtilizationNetCollection({
            url: '/something/fancy'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new UtilizationNetView({
            collection: this.testCollection,
            el: '.testContainer',
            width: $('.testContainer').width(),
            featureSet: 'netUsage'
        });

        this.testCollection.reset();
        this.testCollection.add([
              {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.tx.em1",
            "metric_type": "gauge",
            "value": 28.2,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.tx.br-int",
            "metric_type": "gauge",
            "value": 26.4,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.tx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qvoeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qvbeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.tx.em1",
            "metric_type": "gauge",
            "value": 25.2,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198876979,
            "name": "os.net.tx.tapeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198876979,
            "name": "os.net.tx.qbreed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qvoeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.em1",
            "metric_type": "gauge",
            "value": 33,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qbreed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636984,
            "name": "os.net.tx.qvoeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636984,
            "name": "os.net.tx.qvbeed08419-b2",
            "metric_type": "gauge",
            "value": 0.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.br-int",
            "metric_type": "gauge",
            "value": 38.4,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.tx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516977,
            "name": "os.net.tx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516977,
            "name": "os.net.tx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516977,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516977,
            "name": "os.net.tx.em1",
            "metric_type": "gauge",
            "value": 19.2,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.em1",
            "metric_type": "gauge",
            "value": 21,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.br-int",
            "metric_type": "gauge",
            "value": 19.2,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.tx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216976,
            "name": "os.net.tx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216976,
            "name": "os.net.tx.br-int",
            "metric_type": "gauge",
            "value": 16.8,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.tx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.tx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096976,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096976,
            "name": "os.net.tx.em1",
            "metric_type": "gauge",
            "value": 17.4,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096976,
            "name": "os.net.tx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096976,
            "name": "os.net.tx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.tx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.tx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
         {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 34.8,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.rx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.rx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.rx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056979,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.rx.br-int",
            "metric_type": "gauge",
            "value": 114.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.rx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415199056978,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 115.8,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qvoeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.br-int",
            "metric_type": "gauge",
            "value": 45.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 46.2,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198936993,
            "name": "os.net.rx.qvbeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198876979,
            "name": "os.net.rx.tapeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198876979,
            "name": "os.net.rx.qbreed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.rx.tapeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.rx.qvoeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198756985,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636984,
            "name": "os.net.rx.qvoeed08419-b2",
            "metric_type": "gauge",
            "value": 0.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636984,
            "name": "os.net.rx.qvbeed08419-b2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 87.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198636983,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.rx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.rx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516978,
            "name": "os.net.rx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198516977,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 58.8,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 66,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.br-int",
            "metric_type": "gauge",
            "value": 65.4,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198456978,
            "name": "os.net.rx.qvod5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.virbr0-nic",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198336983,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.rx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216977,
            "name": "os.net.rx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216976,
            "name": "os.net.rx.ovs-system",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216976,
            "name": "os.net.rx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216976,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198216976,
            "name": "os.net.rx.br-int",
            "metric_type": "gauge",
            "value": 58.8,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.rx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096977,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415198096976,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.br-int",
            "metric_type": "gauge",
            "value": 69.6,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.lo",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.br-tun",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.qvoce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 70.8,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.qvbd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.qbrd5568107-b0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197916977,
            "name": "os.net.rx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197856985,
            "name": "os.net.rx.em2",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        },
        {
            "@timestamp": 1415197856985,
            "name": "os.net.rx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
        }

        ]);

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            var dataTest = JSON.stringify('hello');
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(200);
            this.testCollection.parse(dataTest);
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse appropriately', function() {
            this.testCollection.defaults.urlCollectionCount = 10;
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(10);
            var test = 'monkeys';
            this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(9);
            test = {
                monkeys: 'apples',
                next: null
            };
            this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(8);
            test = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(8);
            expect(test1).to.deep.equal([1, 2, 3]);
            test = {
                monkeys: 'bananas',
                next: null,
                results: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(7);
            expect(test2).to.deep.equal([1, 2, 3]);
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal([
            {rx: 0, tx: null, date: '1415197856985'},{rx: 140.39999999999998, tx: 0, date: '1415197916977'},{rx: 0, tx: 17.4, date: '1415198096976'},{rx: 0, tx: 0, date: '1415198096977'},{rx: 58.8, tx: 16.8, date: '1415198216976'},{rx: 0, tx: 0, date: '1415198216977'},{rx: 0, tx: 0, date: '1415198336983'},{rx: 131.4, tx: 40.2, date: '1415198456978'},{rx: 58.8, tx: 19.2, date: '1415198516977'},{rx: 0, tx: 0, date: '1415198516978'},{rx: 88.19999999999999, tx: 39, date: '1415198636983'},{rx: 0.6, tx: 0.6, date: '1415198636984'},{rx: 0, tx: 33, date: '1415198756985'},{rx: 0, tx: 0, date: '1415198876979'},{rx: 92.4, tx: 25.8, date: '1415198936993'},{rx: 230.39999999999998, tx: 54.599999999999994, date: '1415199056978'},{rx: 0, tx: 0, date: '1415199056979'},{rx: 34.8, tx: 0, date: '1415199176978'}
                ]);
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.x axis').find('text').text()).to.equal('');
            expect($('.y axis').text().trim()).to.equal('');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            this.testView.update();
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.add([
            {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qbrce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
            },
            {
            "@timestamp": 1415199176978,
            "name": "os.net.tx.qvbce2008c5-ab",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
            },
            {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.em1",
            "metric_type": "gauge",
            "value": 34.8,
            "unit": "kBytes",
            "node": "compute-02"
            },
            {
            "@timestamp": 1415199176978,
            "name": "os.net.rx.virbr0",
            "metric_type": "gauge",
            "value": 0,
            "unit": "kBytes",
            "node": "compute-02"
            }
            ]);
            this.testCollection.defaults.urlCollectionCount = 0;
            this.testView.update();
            this.testCollection.trigger('sync');
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(4);
            expect($('g').find('text').text()).to.equal('rx (kB)tx (kB).978051015202530');
            this.update_spy.restore();
        });
    });
});
