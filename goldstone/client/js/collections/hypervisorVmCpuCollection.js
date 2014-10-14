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

var HypervisorVmCpuCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(this.dummy.results);
        return this.dummy.results;
    },

    model: HypervisorVmCpuModel,

    initialize: function(options) {
        this.url = options.url;
        this.dummy = _.clone(this.dummy);
        // this.dummyGen();
        this.fetch();
    },

    dummyGen: function() {
        this.dummy = {
            results: []
        };


        var day = 1412812619263;

        for (var i = 0; i < Math.floor(Math.random() * 20) + 10; i++) {

            var user = Math.floor(Math.random() * 5000) /
                100;
            var system = Math.floor(Math.random() * 5000) / 100;

            var result = {
                "date": day,
                "user": user,
                "system": system,
                "wait": (100 - user - system)
            };

            this.dummy.results.push(result);
            day += 3600000;

        }
        console.log(this.dummy.results);

    },

    dummy: {
        results: [{
            date: 1412812619263,
            vmList: [{
                vmName: "vm1",
                user: 3.7,
                system: 6.7,
                wait: 75
            }, {
                vmName: "vm2",
                user: 63.7,
                system: 26.7,
                wait: 25
            }, {
                vmName: "vm3",
                user: 3.7,
                system: 76.7,
                wait: 45
            }, {
                vmName: "vm4",
                user: 3.7,
                system: 16.7,
                wait: 85
            }, {
                vmName: "vm5",
                user: 3.7,
                system: 66.7,
                wait: 65
            }]
        },
        {
            date: 1412817619263,
            vmList: [{
                vmName: "vm1",
                user: 73.7,
                system: 36.7,
                wait: 25
            }, {
                vmName: "vm2",
                user: 53.7,
                system: 96.7,
                wait: 70
            }, {
                vmName: "vm3",
                user: 33.7,
                system: 86.7,
                wait: 35
            }, {
                vmName: "vm4",
                user: 77.7,
                system: 46.7,
                wait: 35
            }, {
                vmName: "vm5",
                user: 37.7,
                system: 36.7,
                wait: 75
            }]
        }



        ]
    }


});
