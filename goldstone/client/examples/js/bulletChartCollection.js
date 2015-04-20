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

var BulletChartCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        return this.dummyData;
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.url = "/glance/api_perf?start=111&end=112&interval=3600s&render=false";
        this.fetch();
    },

    dummyData: [{
        "title": "Revenue",
        "subtitle": "US$, in thousands",
        "ranges": [150, 225, 300],
        "measures": [220, 270],
        "markers": [250]
    }, {
        "title": "Profit",
        "subtitle": "%",
        "ranges": [20, 25, 30],
        "measures": [21, 23],
        "markers": [26]
    }, {
        "title": "Order Size",
        "subtitle": "US$, average",
        "ranges": [350, 500, 600],
        "measures": [100, 320],
        "markers": [550]
    }, {
        "title": "New Customers",
        "subtitle": "count",
        "ranges": [1400, 2000, 2500],
        "measures": [1000, 1650],
        "markers": [2100]
    }, {
        "title": "Satisfaction",
        "subtitle": "out of 5",
        "ranges": [3.5, 4.25, 5],
        "measures": [3.2, 4.7],
        "markers": [4.4]
    }]

});
