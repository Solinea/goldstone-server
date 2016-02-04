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

/*
    called via goldstoneRouter.js as one of three 'flavors'
    via `this.featureSet` = (api|event|log)
*/

SavedSearchPageView = GoldstoneBasePageView.extend({

    featureSetAttributes: {
        'api': {
            chartTitle: 'Saved Searches: API Browser',
            form_index_prefix: 'api_stats-*',
            form_timestamp_field: '@timestamp',
            templateButtonSelectors: [
                ['/#reports/logbrowser/search', 'Saved Search: Log'],
                ['/#reports/eventbrowser/search', 'Saved Search: Event'],
                ['/#reports/apibrowser/search', 'Saved Search: API', 'active']
            ]
        },
        'event': {
            chartTitle: 'Saved Searches: Event Browser',
            form_index_prefix: 'events_*',
            form_timestamp_field: 'timestamp',
            templateButtonSelectors: [
                ['/#reports/logbrowser/search', 'Saved Search: Log'],
                ['/#reports/eventbrowser/search', 'Saved Search: Event', 'active'],
                ['/#reports/apibrowser/search', 'Saved Search: API']
            ]
        },
        'log': {
            chartTitle: 'Saved Searches: Log Browser',
            form_index_prefix: 'logstash-*',
            form_timestamp_field: '@timestamp',
            templateButtonSelectors: [
                ['/#reports/logbrowser/search', 'Saved Search: Log', 'active'],
                ['/#reports/eventbrowser/search', 'Saved Search: Event'],
                ['/#reports/apibrowser/search', 'Saved Search: API']
            ]
        }
    },

    renderCharts: function() {

        var fsa = this.featureSetAttributes;
        var fs = this.featureSet;
        var urlBase = '/core/saved_search/';

        $("select#global-lookback-range").hide();

        this.savedSearchLogCollection = new GoldstoneBaseCollection({
            skipFetch: true,
        });
        this.savedSearchLogCollection.urlBase = urlBase;
        this.savedSearchLogView = new SavedSearchDataTableView({
            chartTitle: goldstone.translate(fsa[fs].chartTitle),
            collectionMixin: this.savedSearchLogCollection,
            el: "#saved-search-viz",
            form_index_prefix: fsa[fs].form_index_prefix,
            form_doc_type: 'syslog',
            form_timestamp_field: fsa[fs].form_timestamp_field,
            urlRoot: urlBase,
            iDisplayLengthOverride: 25,
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
        SavedSearchPageView.__super__.onClose.apply(this, arguments);
    },

    templateButtonSelectors: function() {

        // this.processOptions hasn't happened yet
        // on base class, so "this.options" is required
        // prior to selecting 'featureSet' as
        // an attribute when invoked in 'template'.
        return this.featureSetAttributes[this.options.featureSet].templateButtonSelectors;
    },

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors()) %>' +
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
