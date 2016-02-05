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
instantiated in logSearchPageView.js as a mixin, no automatic fetch happens:

    this.logBrowserTableCollection = new LogBrowserTableCollection({
        skipFetch: true,
        specificHost: this.specificHost,
        urlBase: '/core/logs/',
        linkedCollection: this.logBrowserVizCollection
    });    

    this.logBrowserTable = new LogBrowserDataTableView({
        chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
        collectionMixin: this.logBrowserTableCollection,
        el: '#log-viewer-table',
        infoIcon: 'fa-table',
        width: $('#log-viewer-table').width()
    });

*/

var LogBrowserTableCollection = GoldstoneBaseCollection.extend({

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addCustom: function() {
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

        if(this.specificHost) {
            result += '&host=' + this.specificHost;
        }

        return result;
    },

    computeLookbackAndInterval: function() {

        // compute epochNow, globalLookback, globalRefresh
        // this.getGlobalLookbackRefresh();
        if (this.linkedCollection.isZoomed) {
            this.gte = this.linkedCollection.zoomedStart;
            this.epochNow = this.linkedCollection.zoomedEnd;
        } else {
            this.gte = this.linkedCollection.gte;
            this.epochNow = this.linkedCollection.epochNow;
        }

    },

});
