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

var OpenTrailView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        this.checkForInstalledApp();
    },

    checkForInstalledApp: function() {
        apps = localStorage.getItem('apps');
        if (apps === [] || apps === null) {
            this.instanceSpecificInitFailure();
        }
    },

    instanceSpecificInitSuccess: function() {
        console.log('init with success');
    },

    instanceSpecificInitFailure: function() {
        console.log('init with failure');
        this.render(this.failureMessage);

    },

    failureMessage: _.template('' +
        '<br>' +
        '<h3><div class="text-center">' +
        'Please contact <a href="/#help">Goldstone customer service</a> for assistance with installing OpenTrail.' +
        '</div></h3>'
    ),

    render: function(template) {
        this.$el.html(template());
        return this;
    },

});
