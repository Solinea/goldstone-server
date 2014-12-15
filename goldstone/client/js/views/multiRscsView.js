/**
 * Copyright 2014 Solinea, Inc.
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
 *
 * Author: Alex Jacobs
 */

var MultiRscsView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;

        var ns = this.defaults;
        var self = this;

        this.render();

    },

    render: function() {
        this.$el.append(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="panel panel-primary multi-rsrc-panel" id="multi-rsrc-panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title multi-rsrc-title"><i class="fa fa-dashboard"></i>' +
        ' Resource List<span class="panel-header-resource-title"></span>' +
        '</h3>' +
        '</div>' +
        '<span class="additional-info-notice"></span><br>' +
        '<span id="spinner-container"></span>' +
        '<div id="multi-rsrc-body" class="panel-body">' +
        '</div>' +
        '</div>' +

        // modal
        '<div class="modal fade" id="logSettingsModal" tabindex="-1" role="dialog"' +
        'aria-labelledby="myModalLabel" aria-hidden="false">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal"' +
        'aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title single-rsrc-title" id="myModalLabel">Resource Info</h4>' +
        '</div>' +
        '<div class="modal-body single-rsrc-panel">' +
        '<div id="single-rsrc-body" class="panel-body">' +
        '<table id="single-rsrc-table" class="table table-hover">' +
        '</table>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer"></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )
});
