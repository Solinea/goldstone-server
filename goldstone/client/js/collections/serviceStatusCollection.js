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
 * Author: John Stanford
 */

 var ServiceStatusCollection = Backbone.Collection.extend({

    parse: function(data) {
        return this.dummy.results;
    },

    model: ServiceStatusModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    },

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
