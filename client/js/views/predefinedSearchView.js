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

    instanceSpecificInit: function() {
        this.processOptions();
        this.getPredefinedSearches();
    },

    getPredefinedSearches: function() {
        var self = this;

        $.get('/core/saved_search/?page_size=1000&index_prefix=logstash-*').
        done(
            function(result) {
                if (result.results) {
                    self.predefinedSearches = result.results;
                    self.render();
                } else {
                    console.log('unknown result format');
                }
            }).
        fail(function(result) {
            console.log('failed defined search ', result);
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
        $('.compliance-predefined-search-container .dropdown-menu').on('click', 'li', function(item) {
            var clickedUuid = $(this).data('uuid');
            var constructedUrlForTable = '/compliance/defined_search/' + clickedUuid + '/results/';

            self.collection.urlBase = '/compliance/defined_search/' + clickedUuid + '/results/';
            self.collection.urlGenerator();
            var constructedUrlforViz = self.collection.url;
            self.fetchResults(constructedUrlforViz, constructedUrlForTable);
        });

        // gear icon navigation to saved search settings page
        this.$el.find('.fa-gear').click(function() {
            window.location.href = "/#reports/logbrowser/search";
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
        '</a> <i href="/#reports/logbrowser/search" style="position:absolute;top:0.2em;left:6em;" class="fa fa-gear fa-2x"></i>' +
        '<ul class="dropdown-menu">' +
        '<%= this.populatePredefinedSearches(this.predefinedSearches) %>' +
        '</ul>' +
        '</li>'
    ),

    render: function() {
        $(this.el).html(this.template());
        this.processListeners();
        return this;
    }

});
