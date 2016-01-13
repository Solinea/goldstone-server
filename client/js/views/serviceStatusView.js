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

// this chart provides the base methods that
// are extended into almost all other Views

var ServiceStatusView = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        // processes the hash of options passed in when object is instantiated
        this.processOptions();
        this.processListeners();
        this.render();
        this.appendChartHeading();
        this.addModalAndHeadingIcons();
        this.setSpinner();
    },

    checkReturnedDataSet: function(data) {
        // a method to insert in the callback that is invoked
        // when the collection is done fetching api data. If an empty set
        // is returned, creates an error message, otherwise clears
        // any existing alert or error messages.

        if (data.length === 0) {
            this.dataErrorMessage('No Data Returned');
            return false;
        } else {
            this.clearDataErrorMessage();
        }
    },

    // template: _.template('' +
    //     '<div id = "goldstone-primary-panel" class="panel panel-primary">' +

    //     '<div class="alert alert-danger popup-message" hidden="true"></div>' +
    //     '<div class="panel-body shadow-block" style="height:<%= this.height %>px">' +
    //     '</div>' +
    //     '</div>' +
    //     '<div id="modal-container-<%= this.el.slice(1) %>"></div>'
    // ),

});
