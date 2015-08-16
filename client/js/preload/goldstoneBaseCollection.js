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

var GoldstoneBaseCollection = Backbone.Collection.extend({

    model: GoldstoneBaseModel.extend(),


    initialize: function(options) {
        options = options || {};
        this.options = _.clone(options);
        this.url = this.options.url || null;
        this.instanceSpecificInit();
    },

    instanceSpecificInit: function() {},

    parse: function(data) {
        this.checkForAdditionalPages(data);
        var result = this.preProcessData(data);
        return result;
    },

    checkForAdditionalPages: function(data) {
        var nextUrl;

        // in the case that there are additional paged server responses
        if (data && data.next && data.next !== null) {
            var dN = data.next;

            // if url params change, be sure to update this:
            nextUrl = dN.slice(dN.indexOf(this.urlBase));
            // fetch and add to collection without deleting existing data
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }
    },

    preProcessData: function(data) {
        return data;
    },

    // set per instance
    urlBase: 'instanceSpecific',

    urlGenerator: function() {
        this.computeLookbackAndInterval();
        this.url = this.urlBase;
        if (this.addRange) {
            this.url += this.addRange();
        }
        if (this.addInterval) {
            this.url += this.addInterval(this.interval);
        }
        if (this.addPageNumber) {
            this.url += this.addPageNumber(this.pageNumber);
        }
        if (this.addPageSize) {
            this.url += this.addPageSize(this.pageSize);
        }

        // a gate to make sure this doesn't fire if
        // this collection is being used as a mixin
        if (this.options.skipFetch === undefined) {
            this.fetch();
        }
    },

    // add the following to instances to add to url genration scheme
    // addRange: function() {
    //     return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    // },

    // addInterval: function(n) {
    //     n = n || this.interval;
    //     return '&interval=' + n + 's';
    // },

    // addPageNumber: function(n) {
    //     n = n || 1;
    //     return '&page=' + n;
    // },

    // addPageSize: function(n) {
    //     n = n || 1000;
    //     return '&page_size=' + n;
    // },

    computeLookbackAndInterval: function() {
        this.getGlobalLookbackRefresh();
        this.gte = (this.epochNow - (this.globalLookback * 60 * 1000));

        // set interval equal to 1/24th of time range
        this.interval = ((this.epochNow - this.gte) / 1000) / 24;
    },

    getGlobalLookbackRefresh: function() {
        this.epochNow = +new Date();
        this.globalLookback = parseInt($('#global-lookback-range').val(), 10);
        this.globalRefresh = parseInt($('#global-refresh-range').val(), 10);
    },

    fetchWithReset: function() {
        // used when you want to delete existing data in collection
        // such as changing the global-lookback period
        this.fetch({
            remove: true
        });
    },

    fetchNoReset: function() {

        // used when you want to retain existing data in collection
        // such as a global-refresh-triggered update to the Event Timeline viz
        this.fetch({
            remove: false
        });
    }
});

GoldstoneBaseCollection.prototype.flattenObj = GoldstoneBaseView2.prototype.flattenObj;
