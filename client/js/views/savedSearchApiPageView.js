/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

SavedSearchApiPageView = GoldstoneBasePageView.extend({

    renderCharts: function() {

        $("select#global-lookback-range").hide();

        this.savedSearchLogCollection = new GoldstoneBaseCollection({
            skipFetch: true,
        });
        this.savedSearchLogCollection.urlBase = "/core/saved_search/";
        this.savedSearchLogView = new SavedSearchDataTableView({
            chartTitle: goldstone.translate('Saved Searches: API Browser'),
            collectionMixin: this.savedSearchLogCollection,
            el: "#saved-search-viz",
            form_index_prefix: 'api_stats-*',
            form_doc_type: 'syslog',
            form_timestamp_field: '@timestamp',
            urlRoot: '/core/saved_search/',
            iDisplayLengthOverride: 25,
            infoIcon: 'fa-table',
            width: $('#saved-search-viz').width()
        });

        this.viewToStopListening = [this.savedSearchLogCollection, this.savedSearchLogView];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.savedSearchLogView.trigger('lookbackSelectorChanged');
        }
    },

    onClose: function() {
        // return global lookback/refresh selectors to page
        $("select#global-lookback-range").show();
        $("select#global-refresh-range").show();
        SavedSearchLogPageView.__super__.onClose.apply(this, arguments);
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser/search', 'Saved Search: Log'],
        ['/#reports/eventbrowser/search', 'Saved Search: Event'],
        ['/#reports/apibrowser/search', 'Saved Search: API', 'active'],
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

        '<h3><%=goldstone.translate(\'Saved Search Manager\')%></h3>' +
        '<i class="fa fa-plus-square fa-3x add-button" data-toggle="modal" data-target="#create-modal"></i><br><br>' +
        '<div class="row">' +
        '<div id="saved-search-viz" class="col-md-12"></div>' +
        '</div>' +
        '<div id="create-modal-container"></div>' +
        '<div id="update-modal-container"></div>' +
        '<div id="delete-modal-container"></div>'
    )


});
