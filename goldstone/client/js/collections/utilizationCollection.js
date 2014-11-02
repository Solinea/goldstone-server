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

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        } else {
            this.defaults.urlCollectionCount--;
        }

        return data.results;
    },

    model: UtilizationModel,

    comparator: 'timestamp',

    initialize: function(options) {

        var self = this;

        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.fetchInProgress = false;
        console.log('fetchInProgress: ',self.defaults.fetchInProgress);
        this.defaults.nodeName = options.nodeName;
        this.defaults.urlPrefixes = ['sys', 'user', 'wait'];
        this.defaults.urlCollectionCountOrig = this.defaults.urlPrefixes.length;
        this.defaults.urlCollectionCount = this.defaults.urlPrefixes.length;
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            console.log('fetch in progress - quitting');
            return null;
        }

        this.defaults.fetchInProgress = true;
        console.log('fetchInProgress: ',self.defaults.fetchInProgress);

        this.defaults.urlsToFetch = [];

        var dayAgo = +new Date() - (1000 * 60 * 60 * 24);

        _.each(self.defaults.urlPrefixes, function(prefix) {
            self.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.cpu." + prefix + "&node=" +
                self.defaults.nodeName + "&timestamp__gte=" +
                dayAgo + "&page_size=1000");
        });

        console.log('fetching: ', this.defaults.urlsToFetch);

        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: this.defaults.urlsToFetch[0],
            success: function() {

                // upon success: further fetches are carried out with
                // remove: false to build the collection
                _.each(self.defaults.urlsToFetch.slice(1), function(item) {
                    self.fetch({
                        url: item,
                        remove: false
                    });
                });
            }
        });
    },

    dummyGen: function() {
        this.dummy = {
            results: []
        };

        var day = 1412812619263;

        for (var i = 0; i < Math.floor(Math.random() * 20) + 2; i++) {

            var user = Math.floor(Math.random() * 3300) / 100;
            var sys = Math.floor(Math.random() * 3300) / 100;
            var wait = Math.floor(Math.random() * 3300) / 100;

            var result = {
                "date": day,
                "Wait": wait,
                "System": system,
                "User": user,
                "Idle": (100 - user - system - wait)
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
