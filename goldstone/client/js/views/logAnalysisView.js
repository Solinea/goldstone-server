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

// extends UtilizationCpuView
var LogAnalysisView = UtilizationCpuView.extend({

    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 35,
            left: 63
        }
    },

    processOptions: function() {

        LogAnalysisView.__super__.processOptions.apply(this, arguments);

        var ns = this.defaults;
        ns.yAxisLabel = 'Log Events';
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', function() {
            self.update();
        });

        this.collection.on('error', this.dataErrorMessage, this);

        this.on('selectorChanged', function(params) {
            $(this.el).find('#spinner').show();

            this.collection.defaults.start = params[0];
            this.collection.defaults.end = params[1];
            this.collection.constructUrl();

        });
    },

    processMargins: function() {
        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;
    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();
        console.log('allthelogs', allthelogs[0]);

        var data = allthelogs[0].data;

        finalData = [];

        _.each(data, function(item) {

            finalData.push({
                debug: item.debug || 0,
                audit: item.audit || 0,
                info: item.info || 0,
                warning: item.warning || 0,
                error: item.error || 0,
                date: item.time,
            });

        });

        console.log('final data', finalData);
        return finalData;

    },

    update: function() {
        LogAnalysisView.__super__.update.apply(this, arguments);
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    modal2: _.template(
        // event filter modal
        '<div class="modal fade" id="modal-filter-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
        '<h4 class="modal-title" id="myModalLabel">Log Severity Filters</h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5>Uncheck log-type to hide from display</h5><br>' +
        '<div id="populateEventFilters"></div>' +
        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal">Exit</button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    ),

    render: function() {
        this.$el.append(this.template());
        $(this.el).find('.special-icon-post').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 20px;"></i>');
        this.$el.append(this.modal2());
        return this;
    }

});
