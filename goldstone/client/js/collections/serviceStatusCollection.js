/**
 * Copyright 2014 Solinea, Inc.
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
 *
 * Author: Alex Jacobs
 */

var ServiceStatusCollection = Backbone.Collection.extend({

    parse: function(data) {
        this.dummyGen();
        return this.dummy.results;
    },

    model: ServiceStatusModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    },

    dummyGen: function() {
        this.dummy.results = [];

        // simulate approx 15% of the nodes being down
        var trueFalse = function() {
            var pick = Math.random();
            if (pick < 0.85) {
                return true;
            } else {
                return false;
            }
        };

        var nodeChoices = {
            0: "nova-compute",
            1: "ovs-agent",
            2: "neutron-agent",
        };

        for (var i = 0; i < 48; i++) {

            var result = nodeChoices[Math.floor(Math.random() * 3)];

            result += Math.floor(Math.random() * 100);

            resultObject = {};
            resultObject[result] = trueFalse();
            this.dummy.results.push(resultObject);

        }

    },

    // for reference
    // actual data generated randomly on each pass

    dummy: {
        results: [{
            "nova-compute1": true
        }, {
            "ovs-agent1": false,
        }, {
            "neutron-agent1": true
        }, {
            "nova-compute2": false
        }, {
            "ovs-agent2": true,
        }, {
            "neutron-agent2": true
        }, {
            "nova-compute3": true
        }, {
            "ovs-agent3": true,
        }, {
            "neutron-agent3": false
        }, {
            "nova-compute1": true
        }, {
            "ovs-agent1": false,
        }, {
            "neutron-agent1": true
        }, {
            "nova-compute2": false
        }, {
            "ovs-agent2": true,
        }, {
            "neutron-agent2": true
        }, {
            "nova-compute3": true
        }, {
            "ovs-agent3": true,
        }, {
            "neutron-agent3": false
        }]
    }
});
