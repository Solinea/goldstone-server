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

 var HypervisorCollection = Backbone.Collection.extend({

    parse: function(data) {
        this.dummyGen();
        return this.dummy.results;
    },

    model: HypervisorModel,

    initialize: function(options) {
        this.url = options.url;
        this.dummy = _.clone(this.dummy);
        this.fetch();
    },

    dummyGen: function() {
        this.dummy = {
            results: []
        };

        var day = +new Date();

            var vm1 = 2<<(Math.floor(Math.random()*3) );
            var vm2 = 2<<(Math.floor(Math.random()*3) );
            var vm3 = 2<<(Math.floor(Math.random()*3) );
            var vm4 = 2<<(Math.floor(Math.random()*3) );
            var vm5 = 2<<(Math.floor(Math.random()*3) );

            var result = {
                "date": day,
                "VM1": vm1,
                "VM2": vm2,
                "VM3": vm3,
                "VM4": vm4,
                "VM5": vm5,
                "available": (192 - vm1 - vm2 - vm3 - vm4 - vm5)
            };

            this.dummy.results.push(result);
    },


    dummy: {
        results: [{
                "date": 1412815619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            }, {
                "date": 1412818619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            }, {
                "date": 1412823619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            }, {
                "date": 1412828619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            },

        ]
    }
});
