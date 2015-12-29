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

    this.logAnalysisCollection = new LogAnalysisCollection({});

    ** and the view as:

    this.logAnalysisView = new LogAnalysisView({
        collection: this.logAnalysisCollection,
        width: $('.log-analysis-container').width(),
        height: 300,
        el: '.log-analysis-container',
        featureSet: 'logEvents',
        chartTitle: 'Log Analysis',
        urlRoot: "/logging/summarize?",

    });

*/

var LogBrowserCollection = GoldstoneBaseCollection.extend({

    isZoomed: false,
    zoomedStart: null,
    zoomedEnd: null,

    addRange: function() {

        if(this.isZoomed) {
            return '?@timestamp__range={"gte":' + this.zoomedStart + ',"lte":' + this.zoomedEnd + '}';
        } else {
            return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
        }

    },

    addInterval: function(n) {
        n = n || this.interval;
        n = (n * 0.2);
        return '&interval=' + n + 's';
    },

    addCustom: function(custom) {

        var result = '&per_host=False';

        if(this.specificHost) {
            result += '&host=' + this.specificHost;
        }

        return result;
    },

});
