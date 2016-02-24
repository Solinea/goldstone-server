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
Currently only instantiated on init.js
To instantiate lookback selectors with varying values:

goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({
    lookbackValues: {
        lookback: [
            [15, 'lookback 15m', 'selected'],
            [60, 'lookback 1h'],
            [360, 'lookback 6h'],
            [1440, 'lookback 1d'],
            [4320, 'lookback 3d'],
            [10080, 'lookback 7d']
        ],
        refresh: [
            [30, 'refresh 30s', 'selected'],
            [60, 'refresh 1m'],
            [300, 'refresh 5m'],
            [-1, 'refresh off']
        ]
    }
});
$(selector).append(goldstone.globalLookbackRefreshSelectors.el);

*****************************
*****************************
sensible defaults, if needed:

lookback:
--------
'<option class="i18n" data-i18n="lookback 15m" value="15" selected>lookback 15m</option>' +
'<option class="i18n" data-i18n="lookback 1h" value="60">lookback 1h</option>' +
'<option class="i18n" data-i18n="lookback 6h" value="360">lookback 6h</option>' +
'<option class="i18n" data-i18n="lookback 1d" value="1440">lookback 1d</option>' +
'<option class="i18n" data-i18n="lookback 3d" value="4320">lookback 3d</option>' +
'<option class="i18n" data-i18n="lookback 7d" value="10080">lookback 7d</option>';

refresh:
-------
'<option class="i18n" data-i18n="refresh 30s" value="30" selected>refresh 30s</option>' +
'<option class="i18n" data-i18n="refresh 1m" value="60">refresh 1m</option>' +
'<option class="i18n" data-i18n="refresh 5m" value="300">refresh 5m</option>' +
'<option class="i18n" data-i18n="refresh off" value="-1">refresh off</option>';
*****************************
*****************************
*/

var GlobalLookbackRefreshButtonsView = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        var self = this;
        this.processOptions();
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
        if (this.lookbackValues && this.lookbackValues.lookback && this.lookbackValues.lookback.length) {
            console.log('has lookback');
            result = '';
            _.each(this.lookbackValues.lookback, function(item) {
                result += '<option class="i18n" data-i18n="' + item[1] + '" value="' + item[0] + '"';
                if (item[2] && item[2] === 'selected') {
                    result += ' selected';
                }
                result += '>' + item[1] + '</option>';
            });
            return result;
        }
    },

    customRefresh: function() {
        if (this.lookbackValues && this.lookbackValues.refresh && this.lookbackValues.refresh.length) {
            console.log('has refresh');
            result = '';
            _.each(this.lookbackValues.refresh, function(item) {
                result += '<option class="i18n" data-i18n="' + item[1] + '" value="' + item[0] + '"';
                if (item[2] && item[2] === 'selected') {
                    result += ' selected';
                }
                result += '>' + item[1] + '</option>';
            });
            return result;
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
        // based on this.lookbackValues.lookback
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
        // based on this.lookbackValues.refresh
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
