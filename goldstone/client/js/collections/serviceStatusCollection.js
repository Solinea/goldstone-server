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

    defaults: {},

    parse: function(data) {
        console.log('servStatusCollection data: ', data.results);

        if (data.next && data.next !== null) {
            var dp = data.next;
            this.defaults.nextUrl = dp.slice(dp.indexOf('/core'));
        }

        return data.results;

    },

    checkForSet: function() {
        var self = this;
        console.log('checkForSet models:', this.models);

        var set = {};

        _.each(this.models, function(item) {
            var serviceName = item.attributes.name;
            if (set [serviceName]) {
                console.log('it\'s already in there', item.attributes.name);
                self.defaults.setAchieved = true;
            }
            set [serviceName] = true;
        });

        console.log('setAchieved?', this.defaults.setAchieved);

        if (!this.defaults.setAchieved) {
            this.fetch({
                url: this.defaults.nextUrl,
                remove: false,
                success: function(){
                    self.checkForSet();
                }
            });
        }

        return true;
    },

    model: ServiceStatusModel,

    initialize: function(options) {
        var self = this;

        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.nodeName = options.nodeName;
        this.defaults.nextUrl = null;
        this.defaults.setAchieved = false;
        this.defaults.fetchInProgress = false;
        this.retrieveData();
    },

    retrieveData: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            console.log('fetchInProgress - quitting');
            return null;
        }

        this.defaults.fetchInProgress = true;
        console.log('fetchInProgress: ', self.defaults.fetchInProgress);

        this.url = ("/core/reports?name__prefix=os.service&node__prefix=" + this.defaults.nodeName + "&page_size=100");

        console.log('fetching: ', this.url);

        this.fetch({
            success: function() {
                self.checkForSet();
            }
        });

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
