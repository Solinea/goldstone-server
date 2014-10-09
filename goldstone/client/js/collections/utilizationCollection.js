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

 var UtilizationCollection = Backbone.Collection.extend({

    parse: function(data) {
        return this.dummy.results;
    },

    model: UtilizationModel,

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

        for (var i = 0; i < Math.floor(Math.random() * 20) + 2; i++) {

            var user = Math.floor(Math.random()*3300) / 100;
            var system = Math.floor(Math.random()*3300) / 100;
            var idle = Math.floor(Math.random()*3300) / 100;


            var result = {
                "date": day,
                "User": user,
                "System": system,
                "Idle": idle,
                "Wait": (100 - user - system - idle)
            };

            this.dummy.results.push(result);
            day += 3600000;

        }
    },


    dummy: {
        results: [{
                "date": "11-Oct-13",
                "User": 41.62,
                "System": 22.36,
                "Idle": 25.58,
                "Wait": 9.13,
            }, {
                "date": "12-Oct-13",
                "User": 41.95,
                "System": 22.15,
                "Idle": 25.78,
                "Wait": 8.79,
            }, {
                "date": "13-Oct-13",
                "User": 37.64,
                "System": 24.77,
                "Idle": 25.96,
                "Wait": 10.16,
            }, {
                "date": "14-Oct-13",
                "User": 37.27,
                "System": 24.65,
                "Idle": 25.98,
                "Wait": 10.59,
            },

        ]
    }
});
