/**
 * Copyright 2014 - 2015 Solinea, Inc.
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

var GlobalLookbackRefreshButtonsView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.lookbackValues = options.lookbackValues || null;

        var ns = this.defaults;
        var self = this;

        this.render();

    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    customLookback: function() {
        if (this.defaults.lookbackValues && this.defaults.lookbackValues.lookback && this.defaults.lookbackValues.lookback.length) {
            result = '';
            _.each(this.defaults.lookbackValues.lookback, function(item) {
                result += '<option value="' + item[0] + '"';
                if (item[2] && item[2] === 'selected') {
                    result += ' selected';
                }
                result += '>' + item[1] + '</option>';
            });
            return result;
        } else {
            return '<option value="15">lookback 15m</option>' +
                '<option value="60" selected>lookback 1h</option>' +
                '<option value="360">lookback 6h</option>' +
                '<option value="1440">lookback 1d</option>';
        }
    },

    customRefresh: function() {
        if (this.defaults.lookbackValues && this.defaults.lookbackValues.refresh && this.defaults.lookbackValues.refresh.length) {
            result = '';
            _.each(this.defaults.lookbackValues.refresh, function(item) {
                result += '<option value="' + item[0] + '"';
                if (item[2] && item[2] === 'selected') {
                    result += ' selected';
                }
                result += '>' + item[1] + '</option>';
            });
            return result;
        } else {
            return '<option value="30" selected>refresh 30s</option>' +
                '<option value="60">refresh 1m</option>' +
                '<option value="300">refresh 5m</option>' +
                '<option value="-1">refresh off</option>';
        }
    },

    template: _.template('' +
        '<div style="width:10%;" class="col-xl-1 pull-right">&nbsp;' +
        '</div>' +
        '<div class="col-xl-2 pull-right">' +
        '<form class="global-refresh-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-1">' +
        '<div class="input-group">' +
        '<select class="form-control" id="global-refresh-range">' +
        '<%= this.customRefresh() %>' +
        // '<option value="30" selected>refresh 30s</option>' +
        // '<option value="60">refresh 1m</option>' +
        // '<option value="300">refresh 5m</option>' +
        // '<option value="-1">refresh off</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '<div class="col-xl-1 pull-right">' +
        '<form class="global-lookback-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-1">' +
        '<div class="input-group">' +
        '<select class="form-control" id="global-lookback-range">' +
        '<%= this.customLookback() %>' +
        // '<option value="15">lookback 15m</option>' +
        // '<option value="60" selected>lookback 1h</option>' +
        // '<option value="360">lookback 6h</option>' +
        // '<option value="1440">lookback 1d</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>')
});
