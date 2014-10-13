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
        return this.dummy.results;
    },

    model: HypervisorVmCpuModel,

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

        for (var i = 0; i < Math.floor(Math.random() * 20) + 10; i++) {

            // var user = Math.floor(Math.random() * 3300) / 100;
            // var system = Math.floor(Math.random() * 3300) / 100;
            var close = Math.floor(Math.random() * 3300) / 100;


            var result = {
                "date": day,
                "close": close
                // "System": system,
                // "User": user,
                // "Idle": (100 - user - system - wait)
            };

            this.dummy.results.push(result);
            day += 3600000;

        }

    },

    dummy: {
        "name": "os.cpu.system",
        "units": "percent",
        results: [{
            "timestamp": 1000000000,
            "value": 25
        }, {
            "timestamp": 1000360000,
            "value": 20
        }, {
            "timestamp": 1000720000,
            "value": 23
        }, {
            "timestamp": 1001080000,
            "value": 35
        }, {
            "timestamp": 1001440000,
            "value": 30
        }, {
            "timestamp": 1001800000,
            "value": 15
        }, {
            "timestamp": 1002160000,
            "value": 15
        }, {
            "timestamp": 1002540000,
            "value": 20
        }]
    }

});
