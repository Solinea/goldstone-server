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

        if (data.results.length === 0){
            this.defaults.nullSet = true;
        }

        if (data.next && data.next !== null) {
            var dp = data.next;
            this.defaults.nextUrl = dp.slice(dp.indexOf('/core'));
        }

        return data.results;

    },

    checkForSet: function() {
        var self = this;
        var set = {};

        _.each(this.models, function(item) {
            var serviceName = item.attributes.name;
            if (set [serviceName]) {
                if (set [serviceName] >= 4) {
                    self.defaults.setAchieved = true;
                }
                set [serviceName]++;
            } else {
                set [serviceName] = 1;

            }
        });

        if (!this.defaults.setAchieved) {
            this.fetch({
                url: this.defaults.nextUrl,
                remove: false,
                success: function() {
                    self.checkForSet();
                }
            });
        }

        if (!this.defaults.setAchieved && this.defaults.nextUrl === null) {
            this.defaults.nullSet = true;
        }

        return true;
    },

    model: ServiceStatusModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.nodeName = options.nodeName;
        this.defaults.nextUrl = null;
        this.defaults.setAchieved = false;
        this.defaults.fetchInProgress = false;
        this.defaults.nullSet = false;
        this.retrieveData();
    },

    retrieveData: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;

        var twentyAgo = (+new Date() - (1000 * 60 * 20));

        this.url = "/core/reports?name__prefix=os.service&node__prefix=" +
        this.defaults.nodeName + "&page_size=300" +
        "&timestamp__gte=" + twentyAgo;


        this.fetch({
            success: function() {
                self.checkForSet();
            }
        });
    }
});
