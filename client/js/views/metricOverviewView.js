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

var MetricOverviewView = GoldstoneBaseView.extend({

    update: function() {
        this.hideSpinner();
    },

    template: _.template('' +
        '<div id = "goldstone-primary-panel" class="panel panel-primary">' +

        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="map panel-body shadow-block" style="height:<%= this.height %>px">' +
        '</div>' +
        '<div class="map-block shadow-block map-data"></div>' +
        '</div>' +
        '<div id="modal-container-<%= this.el.slice(1) %>"></div>'
    ),

});
