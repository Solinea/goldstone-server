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
To instantiate lookback selectors with varying values:

new GlobalLookbackRefreshButtonsView({
            el: ".global-range-refresh-container",
            lookbackValues: {
                lookback: [
                    [15, 'lookback 15m'],
                    [60, 'lookback 1h', 'selected'],
                    [360, 'lookback 6h'],
                    [1440, 'lookback 1d'],
                    [10080, 'lookback 7d'],
                    [43200, 'lookback 30d']
                ],
                refresh: [
                    [30, 'refresh 30s', 'selected'],
                    [60, 'refresh 1m'],
                    [300, 'refresh 5m'],
                    [-1, 'refresh off']
                ]
            }
        });
*/

var GlobalLookbackRefreshButtonsView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.lookbackValues = options.lookbackValues || null;

        var ns = this.defaults;
        var self = this;

        this.render();

        this.$el.find('#global-refresh-range').on('change', function() {
            self.trigger('globalRefreshChange');
            self.trigger('globalSelectorChange');
        });
        this.$el.find('#global-lookback-range').on('change', function() {
            self.trigger('globalLookbackChange');
            self.trigger('globalSelectorChange');
        });


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
            return '<option value="15" selected>' + goldstone.translate('lookback 15m') + '</option>' +
                '<option value="60">' + goldstone.translate('lookback 1h') + '</option>' +
                '<option value="360">' + goldstone.translate('lookback 6h') + '</option>' +
                '<option value="1440">' + goldstone.translate('lookback 1d') + '</option>' +
                '<option value="4320">' + goldstone.translate('lookback 3d') + '</option>' +
                '<option value="10080">' + goldstone.translate('lookback 7d') + '</option>';
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
            return '<option value="30" selected>' + goldstone.translate('refresh 30s') + '</option>' +
                '<option value="60">' + goldstone.translate('refresh 1m') + '</option>' +
                '<option value="300">' + goldstone.translate('refresh 5m') + '</option>' +
                '<option value="-1">' + goldstone.translate('refresh off') + '</option>';
        }
    },

    template: _.template('' +
        '<div style="width:10%;" class="col-xl-1 pull-left">&nbsp;' +
        '</div>' +

        '<div class="col-xl-1 pull-left">' +
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
        '</div>' +

        '<div class="col-xl-2 pull-left">' +
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
        '</div>'

        )
});
