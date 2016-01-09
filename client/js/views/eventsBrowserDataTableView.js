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
the jQuery dataTables plugin is documented at
http://datatables.net/reference/api/

instantiated on eventsBrowserPageView as:

    this.eventsBrowserTable = new EventsBrowserDataTableView({
        el: '.events-browser-table',
        chartTitle: 'Events Browser',
        infoIcon: 'fa-table',
        width: $('.events-browser-table').width()
    });

*/

var EventsBrowserDataTableView = DataTableBaseView.extend({

    update: function() {
        this.drawSearchTable('#reports-result-table', this.collection.toJSON());
    },

    preprocess: function(data) {

        /*
        strip object down to things in 'traits'
        and then flatten object before returning it to the dataPrep function
        */

        var self = this;
        var result = [];

        // strip away all but things in traits
        _.each(data, function(item) {
            var tempObj = {};

            // traits contains differing keys per event record
            tempObj.traits = item._source.traits;

            // additional keys outside of traits can be added to tempObj
            // before pushing to result and it will all be flattened below
            result.push(tempObj);

        });

        // replace original data with stripped down dataset
        data = result;

        // reset result array
        result = [];

        // un-nest (flatten) objects
        _.each(data, function(item) {
            result.push(self.flattenObj(item));
        });

        // return flattened/stripped array of objects
        return result;
    },

    // keys will be pinned in ascending value order of key:value pair
    headingsToPin: {
        'eventTime': 0,
        'eventType': 1,
        'id': 2,
        'action': 3,
        'outcome': 4,
    }
});
