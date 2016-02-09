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

var ApiBrowserPageView = GoldstoneBasePageView.extend({

    renderCharts: function() {

        this.apiBrowserVizCollection = new ApiHistogramCollection({});

        this.apiBrowserView = new ApiBrowserView({
            chartTitle: goldstone.contextTranslate('API Call Search', 'apibrowserpage'),
            collection: this.apiBrowserVizCollection,
            el: '#api-histogram-visualization',
            infoIcon: 'fa-tasks',
            width: $('#api-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('API Calls by Range', 'apibrowserpage'),
            marginLeft: 60
        });

        // instantiated only for access to url generation functions
        this.apiBrowserTableCollection = new ApiBrowserTableCollection({
            skipFetch: true
        });

        this.apiBrowserTable = new ApiBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('API Browser', 'apibrowserpage'),
            collectionMixin: this.apiBrowserTableCollection,
            el: '#api-browser-table',
            infoIcon: 'fa-table',
            width: $('#api-browser-table').width()
        });

        // render predefinedSearch Dropdown
        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: new GoldstoneBaseCollection({
                skipFetch: true,
                urlBase: '',
                addRange: function() {
                    return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
                },
                addInterval: function(interval) {
                    return '&interval=' + interval + 's';
                }
            }),
            index_prefix: 'api_stats-*',
            settings_redirect: '/#reports/apibrowser/search'

        });

        this.apiBrowserView.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.apiBrowserVizCollection, this.apiBrowserView, this.apiBrowserTableCollection, this.apiBrowserTable, this.predefinedSearchDropdown];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.apiBrowserView.trigger('lookbackSelectorChanged');
            this.apiBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer'],
        ['/#reports/eventbrowser', 'Event Viewer'],
        ['/#reports/apibrowser', 'API Call Viewer', 'active']
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

        '<div class="row">' +
        '<div id="api-histogram-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="api-browser-table" class="col-md-12"></div>' +
        '</div>'
    )

});
