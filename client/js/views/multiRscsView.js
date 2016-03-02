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
instantiated via topologyTreeView.js in the "render" method if
there is a multiRscsViewEl defined.

The instantiation pattern within the "render" method
only requires an el to be defined, and looks like:

    ns.multiRscsView = new MultiRscsView({
        el: ns.multiRsrcViewEl,
    });

*/

var MultiRscsView = GoldstoneBaseView.extend({

    instanceSpecificInit: function(options) {

        // processes the passed in hash of options when object is instantiated
        this.processOptions();

        // sets page-element listeners, and/or event-listeners
        this.processListeners();

        // creates the popular mw / mh calculations for the D3 rendering
        this.render();

    },

    processListeners: function() {
        this.on('errorTrigger', function(params) {

            // params is passed in as an array from the "trigger" function
            // in topologyTreeView, and is specified with index[0]
            this.dataErrorMessage(null, params[0]);
        });
    },

    render: function() {
        MultiRscsView.__super__.render.apply(this, arguments);

        this.populateInfoButton();
    },

    populateInfoButton: function() {
        var ns = this.defaults;
        var self = this;
        // chart info button popover generator
        var infoButtonText = new InfoButtonText().get('infoText');
        var htmlGen = function() {
            var result = infoButtonText.cloudTopologyResourceList;
            return result;
        };

        $(this.el).find('#info-button').popover({
            trigger: 'manual',
            content: htmlGen.apply(this),
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('toggle');
            }).on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('hide');
            });
    },

    template: _.template('' +

        '<div class="panel-heading">' +
        '<h3 class="panel-title"><%= this.chartTitle %>' +
        '<span class="title-extra"></span>' +
        '<span class="pull-right special-icon-post"></span>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '<span class="pull-right special-icon-pre"></span>' +
        '</h3></div>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="mainContainer shadow-block panel-body">' +
        '<div style="text-align:center;height:<%= (this.height - 270) %>;margin-top:240">This is the OpenStack topology map.<br>You can use leaf nodes to navigate to specific types of resources.</div>' +
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
