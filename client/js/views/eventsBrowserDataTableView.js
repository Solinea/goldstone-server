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

    instanceSpecificInit: function() {
        DataTableBaseView.__super__.instanceSpecificInit.apply(this, arguments);
        this.drawSearchTable('#reports-result-table', this.collection.toJSON());
    },

    update: function() {
        this.drawSearchTable('#reports-result-table', this.collection.toJSON());
    },

    preprocess: function(data) {

        /*
        strip object down to _id, _type, timestamp, and things in 'traits'
        and then flatten object before returning it to the dataPrep function
        */

        var self = this;
        var result = [];

        // strip away all but _id, _type, timestamp, and things in traits
        _.each(data, function(item) {
            var tempObj = {};
            tempObj.id = item.id;
            tempObj.type = item.doc_type;
            tempObj.timestamp = item.timestamp;
            tempObj.traits = item.traits;
            tempObj.user_name = item.user_name;
            tempObj.user_type = item.user_type;
            tempObj.tenant_name = item.tenant_name;
            tempObj.tenant_type = item.tenant_type;
            tempObj.instance_name = item.instance_name;
            tempObj.instance_type = item.instance_type;

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
        'timestamp': 0,
        'type': 1,
        'id': 2,
        'user_name': 3,
        'user_type': 4,
        'tenant_name': 5,
        'tenant_type': 6,
        'instance_name': 7,
        'instance_type': 8
    }
});
