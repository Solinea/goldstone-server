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

var OpenTrailPageView = GoldstoneBasePageView2.extend({

    instanceSpecificInit: function() {
        this.render();
        this.renderCharts();
    },

    renderCharts: function() {

        this.openTrailView = new OpenTrailView({
            chartTitle: 'OpenTrail',
            el: '#installed-apps-table',
            infoIcon: 'fa-table',
            width: $('#installed-apps-table').width()
        });

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.openTrailView];
    },

    template: _.template('' +
        '<table id="installed-apps-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header data-table-header-container">' +

        // necessary <th> is appended here by jQuery in this.dataPrep()
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>'
    )

});
