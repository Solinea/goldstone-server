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

/*

instantiated on eventsBrowserPageView as:

this.eventsBrowserTableCollection = new EventsBrowserTableCollection({});

this.eventsBrowserTable = new EventsBrowserDataTableView({
    chartTitle: 'Events Browser',
    collection: this.eventsBrowserTableCollection,
    el: '#events-browser-table',
    infoIcon: 'fa-table',
    width: $('#events-browser-table').width()
});

*/

// define collection and link to model
var EventsBrowserTableCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        this.urlGenerator();
    },

    urlBase: '/core/events/',

    addRange: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addPageSize: function(n) {
        n = n || 1000;
        return '&page_size=' + n;
    },

    preProcessData: function(data) {
        if(data && data.results) {
            return data.results;
        }
    }
});
