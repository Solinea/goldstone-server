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

var ChartHeaderView = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        this.columns = this.options.columns || 12;
        this.infoText = this.options.infoText;
        this.infoIcon = this.options.infoIcon || 'fa-dashboard';
        this.chartTitle = this.options.chartTitle || goldstone.translate('Set Chart Title');
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        this.populateInfoButton();
        return this;
    },

    populateInfoButton: function() {
        var self = this;
        // chart info button popover generator
        var infoButtonText = new InfoButtonText().get('infoText');
        var htmlGen = function() {
            var result = infoButtonText[this.infoText];
            result = result ? result : goldstone.translate('Set in InfoButtonText.js');
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

        // instantiate with infoText = 'hide' for
        // option to hide info button
        if (this.infoText === "hide") {
            $(this.el).find('#info-button').hide();
        }
    },

    template: _.template('' +
        '<div id="chart-panel-header" class="panel panel-primary col-md-<%= this.columns %>">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa <%= this.infoIcon %>"></i> <%= this.chartTitle %>' +
        '<span class="pull-right special-icon-post"></span>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '<span class="pull-right special-icon-pre"></span>' +
        '</h3></div>' +
        '<div class="mainContainer"></div>')
});
