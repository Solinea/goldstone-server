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

// define collection and link to model

var HypervisorVmCpuCollection = Backbone.Collection.extend({

    parse: function(data) {
        return this.dummy.results;
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.url = options.url;
        this.dummy = _.clone(this.dummy);
        this.dummyGen();
        this.fetch();
    },

    dummyGen: function() {
        this.dummy = {
            results: []
        };


        var day = 1412812619263;

        var randomizer = function() {
            var result = Math.floor(Math.random() * 5000) /
                100;
            return result;
        };

        for (var i = 0; i < Math.floor(Math.random() * 20) + 10; i++) {

            var result = {
                date: day,

                user: [{
                    vm1: randomizer(),
                    vm2: randomizer(),
                    vm3: randomizer(),
                    vm4: randomizer(),
                    vm5: randomizer()
                }],
                system: [{
                    vm1: randomizer(),
                    vm2: randomizer(),
                    vm3: randomizer(),
                    vm4: randomizer(),
                    vm5: randomizer()
                }],
                wait: [{
                    vm1: randomizer(),
                    vm2: randomizer(),
                    vm3: randomizer(),
                    vm4: randomizer(),
                    vm5: randomizer()
                }]

            };

            this.dummy.results.push(result);
            day += 360000;

        }
    },

    dummy: {

        results: [

            {
                date: 1412812619263,

                user: [{
                    vm1: 50,
                    vm2: 19,
                    vm3: 11
                }],
                system: [{
                    vm1: 10,
                    vm2: 79,
                    vm3: 31
                }],
                wait: [{
                    vm1: 80,
                    vm2: 39,
                    vm3: 61
                }]

            }, {
                date: 1412912619263,

                user: [{
                    vm1: 80,
                    vm2: 29,
                    vm3: 51
                }],
                system: [{
                    vm1: 80,
                    vm2: 59,
                    vm3: 21
                }],
                wait: [{
                    vm1: 70,
                    vm2: 49,
                    vm3: 71
                }]

            }, {
                date: 1413012619263,

                user: [{
                    vm1: 60,
                    vm2: 29,
                    vm3: 51
                }],
                system: [{
                    vm1: 80,
                    vm2: 39,
                    vm3: 81
                }],
                wait: [{
                    vm1: 30,
                    vm2: 79,
                    vm3: 51
                }]
            }
        ]
    }


});
