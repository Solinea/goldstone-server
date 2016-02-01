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
compliance/defined_search/ results structure:

{
    "uuid": "4ed7499e-d0c6-4d0b-be67-0418cd4b5d60",
    "name": "failed authorization",
    "owner": "compliance",
    "description": "Defined Search",
    "query": "{ \"query\": { \"bool\": { \"must\": [ { \"match\": { \"component\": \"keystone\" } }, { \"match_phrase\": { \"openstack_message\": \"authorization failed\" } } ] } } }",
    "protected": true,
    "index_prefix": "logstash-*",
    "doc_type": "syslog",
    "timestamp_field": "@timestamp",
    "last_start": null,
    "last_end": null,
    "target_interval": 0,
    "created": null,
    "updated": null
}

*/

PredefinedSearchView = GoldstoneBaseView.extend({

    // bootstrap classes for dropdown menu heading
    className: 'nav nav-pills predefined-search-container',

    instanceSpecificInit: function() {
        // index_prefix and settings_redirect defined on instantiation
        this.processOptions();
        this.render();

        // adds listeners to <li> elements inside dropdown container
        this.processListeners();
        this.getPredefinedSearches();
    },

    getPredefinedSearches: function() {
        var self = this;

        // fallback for incompatible API return, or failed ajax call
        var failAppend = [{
            uuid: null,
            name: goldstone.translate('No predefined searches.')
        }];

        var serverError = [{
            uuid: null,
            name: goldstone.translate('Server error.')
        }];

        $.get('/core/saved_search/?page_size=1000&index_prefix=' + this.index_prefix).
        done(
            function(result) {
                if (result.results) {
                    self.predefinedSearches = result.results;
                    self.renderUpdatedResultList();
                } else {
                    self.predefinedSearches = failAppend;
                    self.renderUpdatedResultList();
                }
            })
            .fail(function(result) {
                self.predefinedSearches = serverError;
                self.renderUpdatedResultList();
            });
    },

    populatePredefinedSearches: function(arr) {
        var result = '';

        _.each(arr, function(item) {
            result += '<li data-uuid=' + item.uuid + '>' + goldstone.translate(item.name) + '</li>';
        });

        return result;
    },

    processListeners: function() {
        var self = this;

        // dropdown to reveal predefined search list
        this.$el.find('.dropdown-menu').on('click', 'li', function(item) {
            var clickedUuid = $(this).data('uuid');
            var constructedUrlForTable = '/core/saved_search/' + clickedUuid + '/results/';

            self.collection.urlBase = '/core/saved_search/' + clickedUuid + '/results/';
            self.collection.urlGenerator();
            var constructedUrlforViz = self.collection.url;
            self.fetchResults(constructedUrlforViz, constructedUrlForTable);
        });
        
    },

    fetchResults: function(vizUrl, tableUrl) {
        var self = this;
        $.get(vizUrl)
            .done(function(res) {
                self.trigger('clickedUuidViz', [res, vizUrl]);
            })
            .fail(function(err) {
                console.error(err);
            });

        $.get(tableUrl)
            .done(function(res) {
                self.trigger('clickedUuidTable', [res, tableUrl]);
            })
            .fail(function(err) {
                console.error(err);
            });
    },

    template: _.template('' +
        '<li role="presentation" class="dropdown">' +
        '<a class = "droptown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">' +
        '<%= goldstone.translate("Predefined Searches") %> <span class="caret"></span>' +
        '</a>' +
        '<ul class="dropdown-menu">' +
        // populated via renderUpdatedResultList()
        '</ul>' +
        '</li>' +
        '<a href=<%= this.settings_redirect %>><i class="setting-btn">&nbsp</i></a>'
    ),

    updatedResultList: _.template('<%= this.populatePredefinedSearches(this.predefinedSearches) %>'),

    render: function() {
        $(this.el).html(this.template());
        return this;
    },

    renderUpdatedResultList: function() {
        this.$el.find('.dropdown-menu').html(this.updatedResultList());
    }

});
