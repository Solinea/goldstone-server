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
        this.processListeners();
        this.render();
        this.appendChartHeading();
        this.addModalAndHeadingIcons();
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

        var self = this;

        // set each key-value pair passed into the options hash
        // to a property of the view instantiation
        _.each(this.options, function(item, key) {
            self[key] = item;
        });

        // set defaults for the instantiated option in case they
        // are not passed into the options hash
        this.chartTitle = this.options.chartTitle || null;
        this.height = this.options.height || 400;
        this.width = this.options.width || 300;
        this.yAxisLabel = this.options.yAxisLabel || 'Set this.yAxisLabel';
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
                this.collection.urlGenerator();
            }
        });
    },

    getGlobalLookbackRefresh: function() {

        // currently searches for the existance of
        // global page-level selectors, but will
        // substitute sane defaults in their absense in
        // the case of template redesign.

        this.epochNow = +new Date();

        // in minutes
        var globalLookback = $('#global-lookback-range').val() || 15;
        this.globalLookback = parseInt(globalLookback, 10); // to integer

        // in seconds
        var globalRefresh = $('#global-refresh-range').val() || 30;
        this.globalRefresh = parseInt(globalRefresh, 10); // to integer
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
                'display': self.spinnerDisplay,
                'left': '-1.4em',
                'top': '-3.6em'
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

    processErrorMessage: function(message, errorMessage) {

        // XHR errors will be passed through as second argument.
        // simple error messages will be sent through as first argument.
        // in case XHR error makes it through as first argument,
        // if second argument is empty, it will be handled properly:
        if (errorMessage === undefined && (_.isObject(message))) {
            errorMessage = message;
            message = null;
        }

        if (errorMessage !== undefined) {

            // if message and errorMessage are both objects,
            // favor errorMessage:
            if (!message || (_.isObject(message) && (_.isObject(errorMessage)))) {
                message = '';
            } else {
                message = message + ' ';
            }

            if (errorMessage.status) {
                message += errorMessage.status + ' error:';
            }
            if (errorMessage.statusText) {
                message += ' ' + errorMessage.statusText + '. ';
            }

            if (errorMessage.responseJSON) {
                if (Object.keys(errorMessage.responseJSON).length === 1) {
                    message += _.values(errorMessage.responseJSON)[0][0];
                }
            }
        }
        // if just a simple message without XHR, above will be bypassed
        return message;
    },

    dataErrorMessage: function(message, errorMessage) {
        // calling raiseAlert with the 3rd param of "true" will supress the
        // auto-hiding of the element as defined in goldstone.raiseAlert
        message = this.processErrorMessage(message, errorMessage);
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

        var noDataMessage = goldstone.translate('No Data Returned');

        if (data.length === 0) {
            this.dataErrorMessage(noDataMessage);
            return false;
        } else {
            this.clearDataErrorMessage();
            return true;
        }
    },

    template: _.template('' +
        '<div id = "goldstone-primary-panel" class="panel panel-primary">' +

        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="panel-body shadow-block" style="height:<%= this.height %>px">' +
        '</div>' +
        '</div>' +
        '<div id="modal-container-<%= this.el.slice(1) %>"></div>'
    ),

    render: function() {
        $(this.el).html(this.template());
        return this;
    },

    addModalAndHeadingIcons: function() {
        return true;
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

                    while (result[x] !== undefined) {
                        x = x + '_';
                    }

                    result[x] = obj[k];
                }
            }
        };

        flattenator(obj);
        return result;
    },

    templateButtonConstructor: function(routeArray) {
        /*
        usually implemented by passing in this.templateButtonSelectors
        in the following order: [url, display text, active (optional)]

        produces output such as:
        <div class="btn-group" role="group">
            <a href="/#reports/logbrowser" class=" btn btn-default">Log Browser</a>
            <a href="/#reports/eventbrowser" class="active btn btn-default">Event Browser</a>
            <a href="/#reports/apibrowser" class=" btn btn-default">Api Browser</a>
        </div><br><br>
        */

        var result = '<div class="btn-group" role="group">';
        _.each(routeArray, function(route) {
            result += '<a href="' + route[0] + '" class="' + (route[2] === 'active' ? 'active ' : '') +
                'btn btn-default">' + goldstone.translate(route[1]) + '</a>';
        });
        result += '</div><br><br>';
        return result;
    }

});
