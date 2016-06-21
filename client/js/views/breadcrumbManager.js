/**
 * Copyright 2016 Solinea, Inc.
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
var BreadcrumbManager = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        this.processOptions();
        this.processListeners();
    },

    // will iterate over passed-in array of site locations
    // to create a breadcrumb navigation element
    breadcrumbTemplate: _.template('' +
        '<ol class="breadcrumb">' +
        '<% _.each(path, function(item){ %>' +
        '<%= "<li>" %>' +
        '<%= "<a href=" + item.location + ">" %>' +
        '<%= item.title %>' +
        '<%= "</a>" %>' +
        '<%= "</li>" %>' +
        '<% }) %>' +
        '</ol>'),

    createBreadcrumb: function(breadcrumb) {
        this.$el.find('.breadcrumb-path').html(this.breadcrumbTemplate({
            path: breadcrumb
        }));
    },

    processListeners: function() {
        var self = this;
        this.listenTo(this, 'updateBreadcrumb', function(breadcrumb) {
            self.createBreadcrumb(breadcrumb);
        });
    }
});
