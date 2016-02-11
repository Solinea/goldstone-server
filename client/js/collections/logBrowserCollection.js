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

/*
instantiated in logSearchPageView.js as:

        this.logSearchObserverCollection = new LogBrowserCollection({
            urlBase: '/core/logs/',
            skipFetch: true,

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });
*/

var LogBrowserCollection = GoldstoneBaseCollection.extend({

    // "this.filter" is set via logBrowserViz upon instantiation.
    // "this.modifyUrlBase" is used to modify the urlBase when a
    // predefinedSearchDropdown search is triggered

    isZoomed: false,
    zoomedStart: null,
    zoomedEnd: null,

    addRange: function() {

        if (this.isZoomed) {
            return '?@timestamp__range={"gte":' + this.zoomedStart + ',"lte":' + this.zoomedEnd + '}';
        } else {
            return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
        }

    },

    checkForAdditionalPages: function() {

        // additional pages are not relevant, as only the
        // results/aggregations will be used.
        return true;
    },

    modifyUrlBase: function(url) {

        // allows predefinedSearchView to alter the urlBase and set it
        // back to the original value by passing null.

        this.originalUrlBase = this.originalUrlBase || this.urlBase;

        if (url === null) {
            this.urlBase = this.originalUrlBase;
        } else {
            this.urlBase = url;
        }
    },

    addInterval: function() {
        var computedInterval;
        var start;
        var end;

        if (this.isZoomed) {
            start = this.zoomedStart;
            end = this.zoomedEnd;
        } else {
            start = this.gte;
            end = this.epochNow;
        }

        // interval ratio of 1/20th the time span in seconds.
        computedInterval = ((end - start) / 20000);
        // ensure a minimum of 0.5second interval
        computedInterval = Math.max(0.5, computedInterval);
        // round to 3 decimal places
        computedInterval = Math.round(computedInterval * 1000) / 1000;
        return '&interval=' + computedInterval + 's';
    },

    addFilterIfPresent: function() {
        // adds parmaters that matcXh the selected severity filters
        var result = '&syslog_severity__terms=[';

        var levels = this.filter || {};
        for (var k in levels) {
            if (levels[k]) {
                result = result.concat('"', k.toLowerCase(), '",');
            }
        }
        result += "]";

        result = result.slice(0, result.indexOf(',]'));
        result += "]";
        return result;
    },

    addCustom: function(custom) {

        var result = '';

        if (this.hasOwnProperty('filter')) {
            result += this.addFilterIfPresent();
        }

        // specificHost applies to this chart when instantiated
        // on a node report page to scope it to that node
        if (this.specificHost) {
            result += '&host=' + this.specificHost;
        }

        return result;
    },

    triggerDataTableFetch: function() {
        // hook for logBrowserViz to initiate refresh and fetch
        this.linkedDataTable.update();
    }

});
