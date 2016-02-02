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

        this.logBrowserVizCollection = new LogBrowserCollection({
            urlBase: '/core/logs/',

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.logBrowserVizCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'logBrowser',
            marginLeft: 60,
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });
*/

var LogBrowserCollection = GoldstoneBaseCollection.extend({

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

    // overwrite this, as the aggregation for this chart is idential on
    // the additional pages. The additional pages are only relevant to the
    // server-side paginated fetching for the log browser below the viz
    checkForAdditionalPages: function() {
        return true;
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

    addCustom: function(custom) {
        
        // specificHost applies to this chart when instantiated
        // on a node report page to scope it to that node
        return this.specificHost ? '&host=' + this.specificHost : '';
    },

});
