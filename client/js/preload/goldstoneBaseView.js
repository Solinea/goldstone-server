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

// this chart provides the base methods that
// are extended into almost all other Views

var GoldstoneBaseView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {

        options = options || {};
        this.defaults = _.clone(this.defaults);

        // essential for a unique options object,
        // as objects/arrays are pass by reference
        this.options = _.clone(options);
        this.instanceSpecificInit();
    },

    instanceSpecificInit: function() {
        // processes the hash of options passed in when object is instantiated
        this.processOptions();
        // sets page-element listeners, and/or event-listeners
        this.processListeners();
        this.render();
        this.appendChartHeading();
        this.setSpinner();
    },

    appendChartHeading: function() {
        this.$el.prepend(new ChartHeaderView({
            chartTitle: this.chartTitle,
            infoText: this.infoText,
            infoIcon: this.infoIcon
        }).el);
    },

    processOptions: function() {
        this.chartTitle = this.options.chartTitle || null;
        this.height = this.options.height || 400;
        this.infoText = this.options.infoText;
        if (this.options.el) {
            this.el = this.options.el;
        }
        if (this.options.collectionMixin) {
            this.collectionMixin = this.options.collectionMixin;
        }
        this.width = this.options.width || 300;
        this.yAxisLabel = this.options.yAxisLabel || 'Set this.yAxisLabel';
        this.collection = this.options.collection || undefined;
        this.infoIcon = this.options.infoIcon;
        this.colorArray = new GoldstoneColors().get('colorSets');
    },

    processListeners: function() {
        // registers 'sync' event so view 'watches' collection for data update
        if (this.collection) {
            this.listenTo(this.collection, 'sync', this.update);
            this.listenTo(this.collection, 'error', this.dataErrorMessage);
        }

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            this.getGlobalLookbackRefresh();
            if (this.collection) {
                this.showSpinner();
                // this.collection.globalLookback = this.globalLookback;
                this.collection.urlGenerator();
                // this.collection.fetch();
            }
        });
    },

    getGlobalLookbackRefresh: function() {

        // currently searches for the existance of
        // global page-level selectors, but will
        // substitute sane defaults in their absense in
        // the case of template redesign.

        // in minutes
        this.globalLookback = $('#global-lookback-range').val() || 15;

        // in seconds
        this.globalRefresh = $('#global-refresh-range').val() || 30;
    },

    setSpinner: function() {

        // appends spinner with sensitivity to the fact that the View object
        // may render before the .gif is served by django. If that happens,
        // the hideSpinner method will set the 'display' css property to
        // 'none' which will prevent it from appearing on the page

        var self = this;
        this.spinnerDisplay = 'inline';

        var appendSpinnerLocation;
        if (this.spinnerPlace) {
            appendSpinnerLocation = $(this.el).find(this.spinnerPlace);
        } else {
            appendSpinnerLocation = this.el;
        }

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (self.width / 2),
                'margin-top': -(self.height / 2),
                'display': self.spinnerDisplay
            });
        });
    },

    hideSpinner: function() {

        // the setting of spinnerDisplay to 'none' will prevent the spinner
        // from being appended in the case that django serves the image
        // AFTER the collection fetch returns and the chart is rendered

        this.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();
    },

    showSpinner: function() {
        this.spinnerDisplay = 'inline';
        $(this.el).find('#spinner').show();
    },

    dblclicked: function(coordinates) {

        // a method to be overwritten in the descendent Views. It is invoked
        // by the user double clicking on a viz, and it receives the
        // x,y coordinates of the click
        return null;
    },

    standardInit: function() {},

    clearDataErrorMessage: function(location) {
        // remove error messages in div with '.popup-message' class, if any.
        // $(location) may be specified, or defaults to 'this.el'
        if (location) {
            if ($(location).find('.popup-message').length) {
                $(location).find('.popup-message').fadeOut("slow");
            }
        } else {
            if ($(this.el).find('.popup-message').length) {
                $(this.el).find('.popup-message').fadeOut("slow");
            }
        }
    },

    dataErrorMessage: function(message, errorMessage) {

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        if (errorMessage !== undefined) {

            if (errorMessage.responseJSON) {
                message = '';
                if (errorMessage.responseJSON.status_code) {
                    message += errorMessage.responseJSON.status_code + ' error: ';
                }
                if (errorMessage.responseJSON.message) {
                    message += errorMessage.responseJSON.message + ' ';
                }
                if (errorMessage.responseJSON.detail) {
                    message += errorMessage.responseJSON.detail;
                }
                if (errorMessage.responseJSON.non_field_errors) {
                    message += errorMessage.responseJSON.non_field_errors;
                }

            } else {
                message = '';
                if (errorMessage.status) {
                    message += errorMessage.status + ' error:';
                }
                if (errorMessage.statusText) {
                    message += ' ' + errorMessage.statusText + '.';
                }
                if (errorMessage.responseText) {
                    message += ' ' + errorMessage.responseText + '.';
                }
            }
        }

        // calling raiseAlert with the 3rd param of "true" will supress the
        // auto-hiding of the element as defined in goldstone.raiseAlert
        goldstone.raiseAlert($(this.el).find('.popup-message'), message);

        // hide spinner, as appending errorMessage is usually the end of
        // the data fetch process
        this.hideSpinner();
    },

    dataPrep: function(data) {
        // to be overwritten based on the needs of the chart in question
        var result = data;
        return result;
    },

    checkReturnedDataSet: function(data) {
        // a method to insert in the callback that is invoked
        // when the collection is done fetching api data. If an empty set
        // is returned, creates an error message, otherwise clears
        // any existing alert or error messages.

        if (data.length === 0) {
            this.dataErrorMessage('No Data Returned');
            return false;
        } else {
            this.clearDataErrorMessage();
        }
    },

    template: _.template(''),

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    flattenObj: function(obj) {

        // recursively un-nest object
        // (will append '_' to nested keys that share a name
        // with existing keys
        var result = {};

        var flattenator = function(obj) {
            for (var k in obj) {
                // won't unpack nested arrays
                if (typeof obj[k] === 'object' && !Array.isArray(obj[k]) && obj[k] !== null) {
                    flattenator(obj[k]);
                } else {
                    // set another variable equal to k in case key exists
                    var x = k;

                    while(result[x] !== undefined) {
                        x = x + '_';
                    }

                    result[x] = obj[k];
                }
            }
        };

        flattenator(obj);
        return result;
    }
});
