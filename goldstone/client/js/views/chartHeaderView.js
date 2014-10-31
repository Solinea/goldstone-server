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

var ChartHeaderView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.columns = options.columns || 12;
        this.defaults.chartTitle = options.chartTitle;
        this.defaults.infoTextNumber = options.infoTextNumber;

        var ns = this.defaults;
        var self = this;

        this.render();

    },

    render: function() {
        this.$el.append(this.template());
        this.populateInfoButton();
        return this;
    },

    populateInfoButton: function() {
        var ns = this.defaults;
        var self = this;
        // chart info button popover generator
        var infoButtonText = new InfoButtonText().get('infoTextSets');
        var htmlGen = function() {
            var result = infoButtonText[ns.infoTextNumber];
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

                setTimeout(function(d) {
                    $(self.el).find(targ).popover('hide');
                }, 3000);
            });

    },

    template: _.template('<div id="chart-panel-header" class="panel panel-primary col-md-<%= this.defaults.columns %>">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '</h3></div>' +
        '<div class="mainContainer"></div>')
});
