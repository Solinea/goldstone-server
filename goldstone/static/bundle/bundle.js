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

// create a project namespace and utility for creating descendants
var goldstone = goldstone || {};

goldstone.namespace = function(name) {
    "use strict";
    var parts = name.split('.');
    var current = goldstone;
    for (var i = 0; i < parts.length; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
};

// tools for raising alerts
goldstone.raiseError = function(message) {
    "use strict";
    goldstone.raiseDanger(message);
};

goldstone.raiseDanger = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-danger", message);
};

goldstone.raiseWarning = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-warning", message);
};

goldstone.raiseSuccess = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-success", message);
};

goldstone.raiseInfo = function(message, persist) {
    "use strict";

    if (persist === true) {
        goldstone.raiseAlert(".alert-info", message, true);
    } else {
        goldstone.raiseAlert(".alert-info", message);
    }

};

goldstone.raiseAlert = function(selector, message, persist) {
    "use strict";

    if (message && message.length > 200) {
        message = message.slice(0, 200) + '...';
    }

    if (persist) {
        $(selector).html(message);
    } else {
        // commenting out the ability to dismiss the alert, which destroys the
        // element and prevents additional renderings.

        // $(selector).html(message + '<a href="#" class="close"
        // data-dismiss="alert">&times;</a>');
        $(selector).html(message + '<a href="#" class="close" data-dismiss="alert"></a>');
    }

    var alertWidth = $(selector).parent().width();

    $(selector).fadeIn("slow").css({
        'position': 'absolute',
        'width': alertWidth,
        'z-index': 10
    });

    if (!persist) {
        window.setTimeout(function() {
            $(selector).fadeOut("slow");
        }, 4000);
    }

};

goldstone.uuid = function() {
    "use strict";

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
};

goldstone.namespace('time');

goldstone.time.fromPyTs = function(t) {
    "use strict";

    if (typeof t === 'number') {
        return new Date(Math.round(t) * 1000);
    } else {
        return new Date(Math.round(Number(t) * 1000));
    }
};

goldstone.time.toPyTs = function(t) {
    "use strict";

    // TODO decide whether toPyTs should only handle date objects.  Handling numbers may cause unexpected results.
    if (typeof t === 'number') {
        return String(Math.round(t / 1000));
    } else if (Object.prototype.toString.call(t) === '[object Date]') {
        return String(Math.round(t.getTime() / 1000));
    }
};

window.onerror = function(message, fileURL, lineNumber) {
    console.log(message + ': ' + fileURL + ': ' + lineNumber);
};

// convenience for date manipulation
Date.prototype.addSeconds = function(m) {
    "use strict";
    this.setTime(this.getTime() + (m * 1000));
    return this;
};

Date.prototype.addMinutes = function(m) {
    "use strict";
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
};

Date.prototype.addHours = function(h) {
    "use strict";
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
};

Date.prototype.addDays = function(d) {
    "use strict";
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
    return this;
};

Date.prototype.addWeeks = function(d) {
    "use strict";
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000));
    return this;
};
;
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
This GoldstoneBaseModel is created as a placeholder
in case it becomes useful to attach methods or
properties to all of the Models used in the Goldstone App.

At the moment, there is no special functionality
attached to it.
*/

var GoldstoneBaseModel = Backbone.Model.extend({
});
;
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

    initialize: function(options) {

        this.options = options || {};

        // essential for unique chart objects,
        // as objects/arrays are pass by reference
        this.defaults = _.clone(this.defaults);

        // Breaks down init into discrete steps.
        // Each step can be overwritten or amended in object
        // that inherit from this view

        // processes the passed in hash of options when object is instantiated
        this.processOptions();
        // sets page-element listeners, and/or event-listeners
        this.processListeners();
        // creates the popular mw / mh calculations for the D3 rendering
        this.processMargins();
        // Appends this basic chart template, usually overwritten
        this.render();
        // basic assignment of variables to be used in chart rendering
        this.standardInit();
        // appends spinner to el
        this.showSpinner();
        // allows a container for any special afterthoughts that need to
        // be invoked during the initialization of this View, or those that
        // are descendent from this view.
        this.specialInit();
    },

    defaults: {
        margin: {
            top: 30,
            right: 30,
            bottom: 60,
            left: 70
        }
    },

    onClose: function() {
        if (this.defaults.scheduleInterval) {
            clearInterval(this.defaults.scheduleInterval);
        }
        this.off();
    },

    processOptions: function() {
        this.defaults.chartTitle = this.options.chartTitle || null;
        this.defaults.height = this.options.height || null;
        this.defaults.infoCustom = this.options.infoCustom || null;
        this.el = this.options.el;
        this.defaults.width = this.options.width || null;

        // easy to pass in a unique yAxisLabel. This pattern can be
        // expanded to any variable to allow overriding the default.
        if (this.options.yAxisLabel) {
            this.defaults.yAxisLabel = this.options.yAxisLabel;
        } else {
            this.defaults.yAxisLabel = goldstone.translate("Response Time (s)");
        }
    },

    processListeners: function() {
        // registers 'sync' event so view 'watches' collection for data update
        this.listenTo(this.collection, 'sync', this.update);
        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        // this is triggered by a listener set on nodeReportView.js
        this.on('lookbackSelectorChanged', function() {
            this.collection.defaults.globalLookback = $('#global-lookback-range').val();
            this.collection.urlGenerator();
            this.collection.fetch();
            this.defaults.start = this.collection.defaults.reportParams.start;
            this.defaults.end = this.collection.defaults.reportParams.end;
            this.defaults.interval = this.collection.defaults.reportParams.interval;

            if ($(this.el).find('#chart-button-info').length) {
                $(this.el).find('#chart-button-info').popover({
                    content: this.htmlGen.apply(this)
                });
            }

            this.defaults.spinnerDisplay = 'inline';
            $(this.el).find('#spinner').show();
        });

    },

    processMargins: function() {
        this.defaults.mw = this.defaults.width - this.defaults.margin.left - this.defaults.margin.right;
        this.defaults.mh = this.defaults.height - this.defaults.margin.top - this.defaults.margin.bottom;
    },

    showSpinner: function() {

        // appends spinner with sensitivity to the fact that the View object
        // may render before the .gif is served by django. If that happens,
        // the hideSpinner method will set the 'display' css property to
        // 'none' which will prevent it from appearing on the page

        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation;
        if (ns.spinnerPlace) {
            appendSpinnerLocation = $(this.el).find(ns.spinnerPlace);
        } else {
            appendSpinnerLocation = this.el;
        }

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height / 2),
                'display': ns.spinnerDisplay
            });
        });

    },

    hideSpinner: function() {

        // the setting of spinnerDisplay to 'none' will prevent the spinner
        // from being appended in the case that django serves the image
        // AFTER the collection fetch returns and the chart is rendered

        this.defaults.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();
    },

    dblclicked: function(coordinates) {

        // a method to be overwritten in the descendent Views. It is invoked
        // by the user double clicking on a viz, and it receives the
        // x,y coordinates of the click

        return null;
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var ns = this.defaults;
        var self = this;

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        ns.chart = ns.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // initialized the axes
        ns.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (ns.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(ns.yAxisLabel)
            .style("text-anchor", "middle");

        ns.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        ns.x = d3.time.scale()
            .rangeRound([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .ticks(5)
            .orient("bottom");

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.colorArray = new GoldstoneColors().get('colorSets');
    },

    specialInit: function() {

        // To be overwritten if needed as a container for code execution
        // during initialization of the View object.
        // Runs after code contained in the "standard init" method.

    },

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
        // a convenience method to insert in the callback that is invoked
        // when the collection is done fetching api data. If an empty set
        // is returned, creates an error message, otherwise clears
        // any existing alert or error messages.

        if (data.length === 0) {
            this.dataErrorMessage(goldstone.translate('No Data Returned'));
            return false;
        } else {
            this.clearDataErrorMessage();
        }
    },

    update: function() {},

    template: _.template(
        '<div id="chart-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="chart-button-info"></i>' +
        '</h3></div><div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});
;
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

var GoldstoneBaseView2 = Backbone.View.extend({

    initialize: function(options) {

        options = options || {};

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
        this.globalLookback = $('#global-lookback-range').val();
        this.globalRefresh = $('#global-refresh-range').val();
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
                    if (result[k] !== undefined) {
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
;
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
The GoldstoneBasePageView is a 'superclass' page view that can be instantiated
via the $(document).ready() on a django HTML tempate.

It sets up listeners that are triggered by changes to the global lookback and
refresh selectors at the top of the page. And a timing loop that
responds to changes to the 'refresh' selector, or can be cancelled by
selecting "refresh off"

Note: the values and default settings of the global lookback and refresh
selectors can be customized on the page's correspoinding django HTML template,
by modifying the parameters of the globalLookbackRefreshButtonsView
*/

var GoldstoneBasePageView = GoldstoneBaseView.extend({

    // found on GoldstoneBaseView:
    // defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.globalLookback = null;
        this.defaults.globalRefresh = null;

        this.render();
        this.getGlobalLookbackRefresh();
        this.renderCharts();
        this.setGlobalLookbackRefreshTriggers();
        this.scheduleInterval();
    },

    clearScheduledInterval: function() {
        var ns = this.defaults;
        clearInterval(ns.scheduleInterval);
    },

    onClose: function() {
        if (this.defaults.scheduleInterval) {
            clearInterval(this.defaults.scheduleInterval);
        }
        this.off();
    },

    scheduleInterval: function() {
        var self = this;
        var ns = this.defaults;

        var intervalDelay = ns.globalRefresh * 1000;

        // the value of the global refresh selector "refresh off" = -1
        if (intervalDelay < 0) {
            return true;
        }

        ns.scheduleInterval = setInterval(function() {
            self.triggerChange('lookbackIntervalReached');
        }, intervalDelay);
    },

    getGlobalLookbackRefresh: function() {
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.defaults.globalRefresh = $('#global-refresh-range').val();
    },

    triggerChange: function(change) {

        /*
        to be customized per each view that is extended from this view.

        Example usage:

        'lookbackSelectorChanged' will be triggered by a change to
        the global lookback selector at the top of the page as
        self.triggerChange('lookbackSelectorChanged');

        'lookbackIntervalReached' will be triggered by the firing
        of the setInterval that is created in this.scheduleInterval as
        self.triggerChange('lookbackIntervalReached');

        The other trigger that is generated by the listeners that are
        set up in this.setGlobalLookbackRefreshTriggers is
        'refreshSelectorChanged' which is fired when the global
        refresh selector at the top of the page is changed.

        A common pattern to use here is to create a conditional that
        will respond to the changes needed. There are listeners in
        the individual charts that handle the desired action upon
        receiving the triggers defined below:

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
        }

        if (change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackIntervalReached');
        }
        */

    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listenTo on global selectors
        // important: use obj.listenTo(obj, change, callback);
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();
            self.clearScheduledInterval();
            self.scheduleInterval();
            self.triggerChange('refreshSelectorChanged');
        });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    renderCharts: function() {

        /*
        To be customized per each view that is extended from this view.

        Example usage:

        var ns = this.defaults;

        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova',
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width()
        });
        */

    },

    // to be customized per view extended from this view
    template: _.template('')

});
;
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
The GoldstoneBasePageView is a 'superclass' page view that can be instantiated
via the $(document).ready() on a django HTML tempate.

It sets up listeners that are triggered by changes to the global lookback and
refresh selectors at the top of the page. And a timing loop that
responds to changes to the 'refresh' selector, or can be cancelled by
selecting "refresh off"

Note: the values and default settings of the global lookback and refresh
selectors can be customized on the page's correspoinding django HTML template,
by modifying the parameters of the globalLookbackRefreshButtonsView
*/

var GoldstoneBasePageView2 = GoldstoneBaseView2.extend({

    /*
    extra options passed in with GoldstoneRouter.switchView will be accessible via this.options
    */

    instanceSpecificInit: function() {
        this.render();
        this.getGlobalLookbackRefresh(); // defined on GoldstoneBaseView2
        this.renderCharts();
        this.setGlobalLookbackRefreshTriggers();
        this.scheduleInterval();
    },

    clearScheduledInterval: function() {
        clearInterval(this.currentInterval);
    },

    onClose: function() {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
        }
        _.each(this.viewsToStopListening, function(view) {
            view.stopListening();
            view.off();
        });
    },

    scheduleInterval: function() {
        var self = this;
        var intervalDelay = this.globalRefresh * 1000;

        // the value of the global refresh selector "refresh off" = -1
        if (intervalDelay < 0) {
            return true;
        }

        this.currentInterval = setInterval(function() {
            self.triggerChange('lookbackIntervalReached');
        }, intervalDelay);
    },

    triggerChange: function(change) {

        /*
        to be customized per each view that is extended from this view.

        Example usage:

        'lookbackSelectorChanged' will be triggered by a change to
        the global lookback selector at the top of the page as
        self.triggerChange('lookbackSelectorChanged');

        'lookbackIntervalReached' will be triggered by the firing
        of the setInterval that is created in this.scheduleInterval as
        self.triggerChange('lookbackIntervalReached');

        The other trigger that is generated by the listeners that are
        set up in this.setGlobalLookbackRefreshTriggers is
        'refreshSelectorChanged' which is fired when the global
        refresh selector at the top of the page is changed.

        A common pattern to use here is to create a conditional that
        will respond to the changes needed. There are listeners in
        the individual charts that handle the desired action upon
        receiving the triggers defined below:

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
        }

        if (change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackIntervalReached');
        }
        */

    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listenTo on global selectors
        // important: use obj.listenTo(obj, change, callback);
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.clearScheduledInterval();
            self.scheduleInterval();
            self.triggerChange('lookbackSelectorChanged');
        });
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();
            self.clearScheduledInterval();
            self.scheduleInterval();
            self.triggerChange('refreshSelectorChanged');
        });
    },

    renderCharts: function() {

        /*
        To be customized per each view that is extended from this view.

        Example usage:

        var ns = this.defaults;

        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova',
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width()
        });
        */

    }
});
;
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

// define collection and link to model

var GoldstoneBaseCollection = Backbone.Collection.extend({

    model: GoldstoneBaseModel.extend(),


    initialize: function(options) {
        options = options || {};
        this.options = _.clone(options);
        this.url = this.options.url || null;
        this.instanceSpecificInit();
    },

    instanceSpecificInit: function() {},

    parse: function(data) {
        this.checkForAdditionalPages(data);
        var result = this.preProcessData(data);
        return result;
    },

    checkForAdditionalPages: function(data) {
        var nextUrl;

        // in the case that there are additional paged server responses
        if (data && data.next && data.next !== null) {
            var dN = data.next;

            // if url params change, be sure to update this:
            nextUrl = dN.slice(dN.indexOf(this.urlBase));
            // fetch and add to collection without deleting existing data
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }
    },

    preProcessData: function(data) {
        return data;
    },

    // set per instance
    urlBase: 'instanceSpecific',

    urlGenerator: function() {
        this.computeLookbackAndInterval();
        this.url = this.urlBase;
        if (this.addRange) {
            this.url += this.addRange();
        }
        if (this.addInterval) {
            this.url += this.addInterval(this.interval);
        }
        if (this.addPageNumber) {
            this.url += this.addPageNumber(this.pageNumber);
        }
        if (this.addPageSize) {
            this.url += this.addPageSize(this.pageSize);
        }

        // a gate to make sure this doesn't fire if
        // this collection is being used as a mixin
        if (this.options.skipFetch === undefined) {
            this.fetch();
        }
    },

    // add the following to instances to add to url genration scheme
    // addRange: function() {
    //     return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    // },

    // addInterval: function(n) {
    //     n = n || this.interval;
    //     return '&interval=' + n + 's';
    // },

    // addPageNumber: function(n) {
    //     n = n || 1;
    //     return '&page=' + n;
    // },

    // addPageSize: function(n) {
    //     n = n || 1000;
    //     return '&page_size=' + n;
    // },

    computeLookbackAndInterval: function() {
        this.getGlobalLookbackRefresh();
        this.gte = (this.epochNow - (this.globalLookback * 60 * 1000));

        // set interval equal to 1/24th of time range
        this.interval = ((this.epochNow - this.gte) / 1000) / 24;
    },

    getGlobalLookbackRefresh: function() {
        this.epochNow = +new Date();
        this.globalLookback = parseInt($('#global-lookback-range').val(), 10);
        this.globalRefresh = parseInt($('#global-refresh-range').val(), 10);
    },

    fetchWithReset: function() {
        // used when you want to delete existing data in collection
        // such as changing the global-lookback period
        this.fetch({
            remove: true
        });
    },

    fetchNoReset: function() {

        // used when you want to retain existing data in collection
        // such as a global-refresh-triggered update to the Event Timeline viz
        this.fetch({
            remove: false
        });
    }
});

GoldstoneBaseCollection.prototype.flattenObj = GoldstoneBaseView2.prototype.flattenObj;
;
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
Much of the functionality is encompassed by the jQuery
dataTables plugin which is documented at
http://datatables.net/reference/api/

EXAMPLE SERVERSIDE DATATABLE IMPLEMENTATION ON APIBROWSERPAGEVIEW:
------------------------------------------------------------------

// instantiated only for access to url generation functions
    this.apiBrowserTableCollection = new GoldstoneBaseCollection({
        skipFetch: true
    });
    this.apiBrowserTableCollection.urlBase = "/core/apiperf/search/";
    this.apiBrowserTableCollection.addRange = function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    };

    this.apiBrowserTable = new ApiBrowserDataTableView({
        chartTitle: 'Api Browser',
        collectionMixin: this.apiBrowserTableCollection,
        el: '#api-browser-table',
        infoIcon: 'fa-table',
        width: $('#api-browser-table').width()
    });

*/

var DataTableBaseView = GoldstoneBaseView2.extend({

    render: function() {
        this.$el.html(this.template());
        $(this.el).find('.refreshed-report-container').append(this.dataTableTemplate());
        return this;
    },

    preprocess: function(data) {
        return data;
    },

    // keys will be pinned in descending value order due to 'unshift' below
    headingsToPin: {
        'name': 0
    },

    update: function() {
        console.log('MUST DEFINE UPDATE IN SUBCLASS');
    },

    // search for headingsToPin anywhere in column heading
    // exact match only
    isPinnedHeading: function(item) {
        for (var key in this.headingsToPin) {
            if (item === key) {
                return true;
            }
        }
        return false;
    },

    sortRemainingKeys: function(arr) {
        arr = arr.sort(function(a, b) {
            if (a < b) {
                return -1;
            } else {
                return 1;
            }
        });
        return arr;
    },

    pruneUndefinedValues: function(arr) {
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === undefined) {
                arr.splice(i, 1);
                i--;
            }
        }
        return arr.reverse();
    },

    dataPrep: function(tableData) {
        var self = this;

        // add a preprocessing step, if needed
        tableData = this.preprocess(tableData);

        // initialize array that will be returned after processing
        var finalResults = [];

        if (typeof (tableData[0]) === "object") {

            // chained underscore function that will scan for the existing
            // object keys, and return a list of the unique keys
            // as not every object contains every key

            var uniqueObjectKeys = _.uniq(_.flatten(_.map(tableData, function(item) {
                return Object.keys(item);
            })));

            // if there is a unique key with "name" somewhere in it,
            // reorder the keys so that it is first

            var keysWithName = [];
            for (var i = 0; i < uniqueObjectKeys.length; i++) {
                var item = uniqueObjectKeys[i];
                if (this.isPinnedHeading(item)) {
                    var spliced = uniqueObjectKeys.splice(i, 1);
                    keysWithName[this.headingsToPin[item]] = spliced;
                    i--;
                } else {
                    continue;
                }
            }

            keysWithName = this.pruneUndefinedValues(keysWithName);

            uniqueObjectKeys = this.sortRemainingKeys(uniqueObjectKeys);

            _.each(keysWithName, function(item) {
                uniqueObjectKeys.unshift(item[0]);
            });

            // append data table headers that match the unique keys
            _.each(uniqueObjectKeys, function(item) {
                $('.data-table-header-container').append('<th>' + item + '</th>');
            });

            // iterate through tableData, and push object values to results
            // array, inserting '' where there is no existing value

            _.each(tableData, function(value) {
                var subresult = [];
                _.each(uniqueObjectKeys, function(item) {
                    if (value[item] === undefined) {
                        subresult.push('');
                    } else {
                        subresult.push(value[item]);
                    }
                });
                finalResults.push(subresult);
            });

        } else {

            $('.data-table-header-container').append('<th>Result</th>');
            _.each(tableData, function(item) {
                finalResults.push([item]);
            });
        }
        return finalResults;
    },

    oTableParamGeneratorBase: function(data) {
        return {
            "scrollX": "100%",
            "info": true,
            "processing": false,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "order": [
                [0, 'desc']
            ],
            "ordering": true,
            "data": data,
            "serverSide": false
        };
    },

    addOTableParams: function(options) {
        return options;
    },

    oTableParamGenerator: function(data) {
        result = this.oTableParamGeneratorBase(data);

        // hook to add additional paramaters to the options hash
        result = this.addOTableParams(result);
        return result;
    },


    // invoked on subclass
    drawSearchTable: function(location, data) {

        // variables to capture current state of dataTable
        var currentTop; // capture top edge of screen
        var recordsPerPage; // capture records per page
        var currentSearchBox; // capture search box contents

        this.hideSpinner();

        if (data === null) {
            data = ['No results within selected time range'];
        }

        var self = this;
        var oTable;

        // removes initial placeholder message
        $(this.el).find('.reports-info-container').remove();

        if ($.fn.dataTable.isDataTable(location)) {

            // first use jquery to store current top edge of visible screen
            currentTop = $(document).scrollTop();
            recordsPerPage = $(this.el).find('[name="reports-result-table_length"]').val();
            currentSearchBox = $(this.el).find('[type="search"]').val();

            // if dataTable already exists:
            // complete remove it from memory and the dom
            oTable = $(location).DataTable();
            oTable.destroy({
                remove: true
            });

            // and re-append the table structure that will be repopulated
            // with the new data
            $(this.el).find('.refreshed-report-container')
                .html(this.dataTableTemplate());
        }

        data = this.dataPrep(data);
        var oTableParams = this.oTableParamGenerator(data);
        oTable = $(location).DataTable(oTableParams);

        // restore recordsPerPage
        if (recordsPerPage !== undefined) {
            oTable.page.len(recordsPerPage);
        }

        // lowercase dataTable returns reference to instantiated table
        oTable = $(location).dataTable();

        // restore currentSearchBox
        if (currentSearchBox !== undefined) {
            oTable.fnFilter(currentSearchBox);
        }

        // restore top edge of screen to couteract 'screen jump'
        if (currentTop !== undefined) {
            $(document).scrollTop(currentTop);
        }

    },

    drawSearchTableServerSide: function(location) {
        var self = this;
        this.hideSpinner();

        // lookback listeners not already added,
        // see note in processListenersForServerSide
        this.processListenersForServerSide();

        var oTableParams = this.oTableParamGenerator();

        // removes initial placeholder message
        $(this.el).find('.reports-info-container').remove();

        // inserts table column headers
        $(this.el).find('.data-table-header-container').remove();
        $(this.el).find('.data-table-thead').append(this.serverSideTableHeadings());

        self.oTable = $(location).DataTable(oTableParams);

    },

    processListenersForServerSide: function() {
        /*
        listeners are added in the BaseView only for views that are linked to
        collections. Since this is a server-side-processing dataTable, it has
        not been linked. Therefore, add a listener so that when the
        globalLookback selector is changed, invoke the update function
        */

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            this.getGlobalLookbackRefresh();
            this.update();
        });
    },

    // specify <tr>'s' and <th>'s on subclass
    serverSideTableHeadings: _.template(''),

    template: _.template(

        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="reports-info-container">' +
        '<br>Loading...' +
        '</div>' +
        '<div class="refreshed-report-container"></div>'
    ),

    dataTableTemplate: _.template(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead class="data-table-thead">' +
        '<tr class="header data-table-header-container">' +

        // necessary <th> is appended here by jQuery in this.dataPrep()
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>'
    )
});
;
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

// LauncherView is a "wrapper view" that is NOT instantiated with
// an .el passed into the objects hash.
// This allows for it to be "apppended" to DOM
// and removed cleanly when switching views with .remove();
var LauncherView = Backbone.View.extend({
    initialize: function(options) {
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    // inner views will be bound to ".launcher-container" via
    // their .el property passed into the options hash.
    template: _.template('' +
        '<div class="launcher-container"></div>')
});

var GoldstoneRouter = Backbone.Router.extend({
    routes: {
        "discover": "discover",
        "help": "help",
        "metrics/api_perf": "apiPerfReport",
        "metrics/cinder_report": "cinderReport",
        "metrics/glance_report": "glanceReport",
        "metrics/keystone_report": "keystoneReport",
        "metrics/metric_report": "metricViewer",
        "metrics/metric_report/": "metricViewer",
        "metrics/metric_report/:numCharts": "metricViewer",
        "metrics/neutron_report": "neutronReport",
        "metrics/nova_report": "novaReport",
        "report/node/:nodeId": "nodeReport",
        "reports/logbrowser": "logSearch",
        "reports/eventbrowser": "eventsBrowser",
        "reports/apibrowser": "apiBrowser",
        "settings": "settings",
        "settings/tenants": "tenant",
        "*default": "redirect"
    },
    extendOptions: function(options, args) {
        _.each(args, function(item) {
            _.extend(options, item);
        });
        return options;
    },
    switchView: function(view) {

        // Capture any extra params that are passed in via the
        // router functions below, such as {node_uuid: nodeId} in
        // nodeReport.
        var args = Array.prototype.slice.call(arguments, 1);

        // as a backbone object, router can emit triggers
        // this is being listened to by authLogoutView
        // to determine whether or not to render the
        // logout icon
        this.trigger('switchingView');

        if (goldstone.currentLauncherView) {

            // goldstone.currentView is instantiated below
            if (goldstone.currentView.onClose) {

                // this is defined in goldstoneBaseView and
                // removes any setIntervals which would continue
                // to trigger events even after removing the view
                goldstone.currentView.onClose();
            }

            // Backbone's remove() calls this.$el.remove() and
            // this.stopListening() which removes any events that
            // are subscribed to with listenTo()
            goldstone.currentView.off();
            goldstone.currentView.remove();
            goldstone.currentLauncherView.remove();
        }

        // instantiate wrapper view that can be removed upon page
        // change and store the current launcher and view so it
        // can be remove()'d
        goldstone.currentLauncherView = new LauncherView({});

        // append the launcher to the page div
        // .router-content-container is a div set in router.html
        $('.router-content-container').append(goldstone.currentLauncherView.el);

        // new views will pass 'options' which at least designates
        // the .el to bind to
        var options = {
            el: '.launcher-container'
        };

        // but if additional objects have been passed in via the
        // functions below, add those to the options hash
        /*
        example: calling nodeReport(nodeId)
        will call switchView and pass in the NodeReportView,
        as well as an object similar to:{"node_uuid": "ctrl-01"}.
        options will be extended to be:
        {
            el: ".launcher-container",
            node_uuid: "ctrl-01"
        }
        */
        if (args.length) {
            options = this.extendOptions(options, args);
        }

        // instantiate the desired page view
        goldstone.currentView = new view(options);

    },

    /*
    Define additional view launching functions below.
    Additional params that need to be passed to 'options' can
    be added as an object. The extra options will be extended
    */

    apiBrowser: function() {
        this.switchView(ApiBrowserPageView);
    },
    apiPerfReport: function() {
        this.switchView(ApiPerfReportView);
    },
    cinderReport: function() {
        this.switchView(CinderReportView);
    },
    discover: function() {
        this.switchView(DiscoverView);
    },
    eventsBrowser: function() {
        this.switchView(EventsBrowserPageView);
    },
    glanceReport: function() {
        this.switchView(GlanceReportView);
    },
    help: function() {
        this.switchView(HelpView);
    },
    keystoneReport: function() {
        this.switchView(KeystoneReportView);
    },
    logSearch: function() {
        this.switchView(LogSearchPageView);
    },
    metricViewer: function(numCharts) {
        if (numCharts === null || numCharts === undefined) {
            numCharts = 6;
        }
        numCharts = parseInt(numCharts, 10);
        if (numCharts > 6 || numCharts < 1) {
            numCharts = 6;
        }
        this.switchView(MetricViewerPageView, {
            numCharts: numCharts
        });
    },
    neutronReport: function() {
        this.switchView(NeutronReportView);
    },
    nodeReport: function(nodeId) {
        this.switchView(NodeReportView, {
            node_uuid: nodeId
        });
    },
    novaReport: function() {
        this.switchView(NovaReportView);
    },
    redirect: function() {
        location.href = "#discover";
    },
    settings: function() {
        this.switchView(SettingsPageView);
    },
    tenant: function() {
        this.switchView(TenantSettingsPageView);
    }
});
;
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

var ChartSet = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.data = [];
        this.processOptions();

        this.renderChartBorders();
        this.makeChart();
    },

    processOptions: function() {

        this.collection = this.options.collection ? this.options.collection : undefined;
        this.chartTitle = this.options.chartTitle || null;
        if (this.options.el) {
            this.el = this.options.el;
        }
        this.width = this.options.width || 300;
        this.height = this.options.height || 400;
        this.infoIcon = this.options.infoIcon;
        this.infoText = this.options.infoText;
        this.marginLeft = this.options.marginLeft || 50;
        this.marginRight = this.options.marginRight || 120;
        this.marginTop = this.options.marginTop || 20;
        this.marginBottom = this.options.marginBottom || 80;
        this.yAxisLabel = this.options.yAxisLabel;
        this.popoverTimeLabel = this.options.popoverTimeLabel || "time";
        this.popoverUnitLabel = this.options.popoverUnitLabel || "events";
        this.colorArray = new GoldstoneColors().get('colorSets');
        this.shapeArray = ['rect', 'circle'];
        this.shapeCounter = 0;
        this.shape = this.options.shape || this.shapeArray[this.shapeCounter];
        this.xParam = this.options.xParam;
        this.yParam = this.options.yParam;
    },

    resetXParam: function(param) {
        param = param || 'time';
        this.xParam = param;
    },

    resetYParam: function(param) {
        param = param || 'count';
        this.yParam = param;
    },

    renderChartBorders: function() {
        this.$el.append(new ChartHeaderView({
            chartTitle: this.chartTitle,
            infoText: this.infoText,
            infoIcon: this.infoIcon
        }).el);
    },

    makeChart: function() {
        this.processListeners();
        this.svgAdder(this.width, this.height);
        this.initializePopovers();
        this.chartAdder();

        this.setXDomain();
        this.setYDomain();

        this.setXAxis();
        this.setYAxis();
        this.callXAxis();
        this.callYAxis();

        this.setYAxisLabel();
        this.setSpinner();
    },

    update: function() {
        this.setData(this.collection.toJSON());
        this.updateWithNewData();
    },

    updateWithNewData: function() {
        this.setXDomain();
        this.setYDomain();
        this.resetAxes();
        this.bindShapeToData(this.shape);
        this.shapeUpdate(this.shape);
        this.shapeEnter(this.shape);
        this.shapeExit(this.shape);
        this.hideSpinner();
    },

    initializePopovers: function() {
        var self = this;
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return self.popoverTimeLabel + ": " + moment(+d.time).format() +
                    "<br>" +
                    self.popoverUnitLabel + ": " + d.count;
            });

        this.svg.call(this.tip);
    },

    setData: function(newData) {
        this.data = newData;
    },

    svgAdder: function() {
        this.svg = d3.select(this.el).append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
    },

    chartAdder: function() {
        this.chart = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');
    },

    setXDomain: function() {
        var param = this.xParam || 'time';
        var self = this;
        this.x = d3.time.scale()
        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        .domain(self.data.length ? d3.extent(this.data, function(d) {
            return d[param];
        }) : [1, 1])
            .range([0, (this.width - this.marginLeft - this.marginRight)]);
    },

    setYDomain: function() {
        var param = this.yParam || 'count';
        var self = this;
        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        this.y = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(this.data, function(d) {
                return d[param];
            }) : 0])
            .range([(this.height - this.marginTop - this.marginBottom), 0]);
    },

    setYAxisLabel: function() {
        this.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (this.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(this.yAxisLabel)
            .style("text-anchor", "middle");
    },

    bindShapeToData: function(shape, binding) {
        this[shape] = this.chart.selectAll(shape)
            .data(this.data, function(d) {
                return binding ? d[binding] : d.time;
            });
    },

    shapeUpdate: function(shape) {
        var xParam = this.xParam || 'time';
        var yParam = this.yParam || 'count';
        var self = this;
        this[shape]
            .transition()
            .attr('cx', function(d) {
                return self.x(d[xParam]);
            })
            .attr('cy', function(d) {
                return self.y(d[yParam]);
            })
            .attr('r', 10)
            .attr('x', function(d) {
                return self.x(d[xParam]);
            })
            .attr('y', function(d) {
                return self.y(d[yParam]);
            })
            .attr('height', function(d) {
                return self.height - self.marginTop - self.marginBottom - self.y(d[yParam]);
            })
            .attr('width', (this.width - this.marginLeft - this.marginRight) / this.data.length);
    },

    shapeEnter: function(shape) {
        var xParam = this.xParam || 'time';
        var yParam = this.yParam || 'count';
        var self = this;
        this[shape]
            .enter()
            .append(shape)
            .attr("fill", this.colorArray.distinct[3][1])
            .style('fill-opacity', 1e-6)
            .attr('class', 'chart-rect')
            .attr('id', 'chart-rect')
            .attr('x', function(d) {
                return self.x(d[xParam]);
            })
            .attr('y', function(d) {
                return (self.y(d[yParam]));
            })
            .attr('height', function(d) {
                return self.height - self.marginTop - self.marginBottom - self.y(d[yParam]);
            })
            .attr('width', (this.width - this.marginLeft - this.marginRight) / this.data.length)
            .attr('cx', function(d) {
                return self.x(d[xParam]);
            })
            .attr('cy', function(d) {
                return (self.y(d[yParam]));
            })
            .attr('r', 10)
            .on('mouseover', function(d) {
                self.mouseoverAction(d);
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            })
            .transition()
            .style('fill-opacity', 1);
    },

    mouseoverAction: function(d) {
        this.tip.show(d);
    },

    mouseoutAction: function(d) {
        this.tip.hide();
    },

    shapeExit: function(shape) {
        this[shape]
            .exit()
            .transition()
            .style('fill-opacity', 1e-6)
            .remove();
    },

    switchShape: function() {
        this.svgClearer(this.shape);
        this.shape = this.shapeArray[this.shapeCounter++ % 2];
        this.bindShapeToData(this.shape);
        this.shapeUpdate(this.shape);
        this.shapeEnter(this.shape);
        this.shapeExit(this.shape);
    },

    areaSetter: function() {
        var self = this;
        this.area = d3.svg.area()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return self.x(d.time);
            })
            .y0(function(d) {
                return self.y(0);
            })
            .y1(function(d) {
                return self.y(d.count);
            });
    },

    pathAdder: function(datum) {
        var self = this;
        this.chart.append("path")
            .datum(datum)
            .attr("class", "area")
            .attr("id", "minMaxArea")
            .attr("d", this.area)
            .attr("fill", this.colorArray.distinct[3][1])
            .style("opacity", 0.8);
    },

    svgClearer: function(attribute) {
        var selector = this.chart;
        selector.selectAll(attribute)
            .data([])
            .exit()
            .transition()
            .style("fill-opacity", 1e-6)
            .remove();
    },

    setXAxis: function() {
        this.xAxis = d3.svg.axis()
            .scale(this.x)
            .ticks(4)
        // format: day month H:M:S
        .tickFormat(d3.time.format("%e %b %X"))
            .orient("bottom");
    },

    setYAxis: function() {
        this.yAxis = d3.svg.axis()
            .scale(this.y)
            .ticks(5)
            .orient("left");
    },

    callXAxis: function() {
        this.svg
            .append('g')
            .attr("class", "x axis")
            .attr('transform', 'translate(' + (this.marginLeft) + ',' + (this.height - this.marginBottom) + ')')
            .call(this.xAxis);
    },

    callYAxis: function() {
        this.svg
            .append('g')
            .attr("class", "y axis")
            .attr('transform', 'translate(' + (this.marginLeft) + ',' + this.marginTop + ')')
            .call(this.yAxis);
    },

    resetAxes: function() {
        var self = this;
        d3.select(this.el).select('.axis.x')
            .transition()
            .call(this.xAxis.scale(self.x));

        self.svg.select('.axis.y')
            .transition()
            .call(this.yAxis.scale(self.y));
    },

    addToLegend: function(selector, legendText) {
        d3.select(this.el).select(selector)
            .attr('data-legend', legendText);
    },

    appendLegend: function() {
        this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + this.marginLeft + ",10)")
            .call(d3.legend);
    }
});
;
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
NOTE: This Backbone View is a "superClass" that is extended to at least 2 other chart-types at the time of this documentation.

The method of individuating charts that have particular individual requirements is to instantiate them with the 'featureSet' property within the options hash.

Instantiated on nodeReportView as:

this.cpuUsageChart = new UtilizationCpuCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.cpuUsageView = new UtilizationCpuView({
    collection: this.cpuUsageChart,
    el: '#node-report-r3 #node-report-panel #cpu-usage',
    width: $('#node-report-r3 #node-report-panel #cpu-usage').width(),
    featureSet: 'cpuUsage'
});
*/

var UtilizationCpuView = GoldstoneBaseView.extend({

    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 25,
            left: 33
        }
    },

    processOptions: function() {
        UtilizationCpuView.__super__.processOptions.apply(this, arguments);
        this.defaults.url = this.collection.url;
        this.defaults.featureSet = this.options.featureSet || null;
        var ns = this.defaults;
        if (ns.featureSet === 'memUsage') {
            ns.divisor = (1 << 30);
        }
        ns.formatPercent = d3.format(".0%");
        ns.height = this.options.height || this.options.width;
        ns.yAxisLabel = '';
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.defaults.urlCollectionCount === 0) {
                self.update();
                // the collection count will have to be set back to the original count when re-triggering a fetch.
                self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
                self.collection.defaults.fetchInProgress = false;
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            this.collection.defaults.globalLookback = $('#global-lookback-range').val();
            this.collection.fetchMultipleUrls();
            $(this.el).find('#spinner').show();
        });
    },

    processMargins: function() {
        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.width - ns.margin.top - ns.margin.bottom;
    },

    standardInit: function() {
        UtilizationCpuView.__super__.standardInit.apply(this, arguments);

        var ns = this.defaults;
        var self = this;

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(4);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        if (ns.featureSet === "cpuUsage") {
            ns.yAxis
                .tickFormat(ns.formatPercent);
        }

        if (ns.featureSet === 'logEvents') {

            ns.color = d3.scale.ordinal().domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"])
                .range(ns.colorArray.distinct.openStackSeverity8);
        } else {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct['2R']);
        }

        ns.area = d3.svg.area()
            .interpolate("monotone")
            .x(function(d) {
                return ns.x(d.date);
            })
            .y0(function(d) {
                return ns.y(d.y0);
            })
            .y1(function(d) {
                return ns.y(d.y0 + d.y);
            });

        ns.stack = d3.layout.stack()
            .values(function(d) {
                return d.values;
            });

    },

    collectionPrep: function() {
        var allthelogs = this.collection.toJSON();

        var data = allthelogs;

        /*
        make it like this:

        @timestamp: "2015-05-14T05:55:50.342Z"
        host: "10.10.20.10:56787"
        metric_type: "gauge"
        name: "os.cpu.wait"
        node: "ctrl-01"
        unit: "percent"
        value: 0.26161110700781587
*/
        // allthelogs will have as many objects as api calls were made
        // iterate through each object to tag the data with the
        // api call that was made to produce it
        _.each(data, function(collection) {

            // within each collection, tag the data points
            _.each(collection.per_interval, function(dataPoint) {

                _.each(dataPoint, function(item, i) {
                    item['@timestamp'] = i;
                    item.name = collection.metricSource;
                    item.value = item.stats.max;
                });

            });
        });


        var condensedData = _.flatten(_.map(data, function(item) {
            return item.per_interval;
        }));


        var dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
            return item[_.keys(item)[0]]['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                wait: null,
                sys: null,
                user: null
            };
        });


        _.each(condensedData, function(item) {

            var key = _.keys(item)[0];
            var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
            newData[key][metric] = item[key].value;

        });


        finalData = [];

        _.each(newData, function(item, i) {

            item.wait = item.wait || 0;
            item.sys = item.sys || 0;
            item.user = item.user || 0;

            finalData.push({
                wait: item.wait,
                sys: item.sys,
                user: item.user,
                idle: 100 - (item.user + item.wait + item.sys),
                date: i
            });
        });

        return finalData;

    },

    dataErrorMessage: function(message, errorMessage) {

        UtilizationCpuView.__super__.dataErrorMessage.apply(this, arguments);

        var self = this;

        // the collection count will have to be set back to the original count when re-triggering a fetch.
        self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
        self.collection.defaults.fetchInProgress = false;
    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        this.hideSpinner();

        // define allthelogs and ns.data even if
        // rendering is halted due to empty data set
        var allthelogs = this.collectionPrep();
        ns.data = allthelogs;

        if (ns.featureSet === 'logEvents') {
            ns.data = allthelogs.finalData;
            ns.loglevel = d3.scale.ordinal()
                .domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"])
                .range(ns.colorArray.distinct.openStackSeverity8);
        }

        // If we didn't receive any valid files, append "No Data Returned" and halt
        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

        ns.color.domain(d3.keys(ns.data[0]).filter(function(key) {

            if (ns.featureSet === 'logEvents') {
                return (ns.filter[key] && key !== "date" && key !== "total" && key !== "time");
            } else {
                return key !== "date";
            }
        }));

        var components;
        if (ns.featureSet === 'logEvents') {

            var curr = false;
            var anyLiveFilter = _.reduce(ns.filter, function(curr, status) {
                return status || curr;
            });

            if (!anyLiveFilter) {
                ns.chart.selectAll('.component')
                    .remove();
                return;
            }

            components = ns.stack(ns.color.domain().map(function(name) {
                return {
                    name: name,
                    values: ns.data.map(function(d) {
                        return {
                            date: d.date,
                            y: d[name]
                        };
                    })
                };
            }));

        } else {

            components = ns.stack(ns.color.domain().map(function(name) {
                return {
                    name: name,
                    values: ns.data.map(function(d) {
                        return {
                            date: d.date,
                            y: self.defaults.featureSet === 'cpuUsage' ? d[name] / 100 : d[name]
                        };
                    })
                };
            }));
        }

        $(this.el).find('.axis').remove();

        ns.x.domain(d3.extent(ns.data, function(d) {
            return d.date;
        }));

        if (ns.featureSet === 'memUsage') {
            ns.y.domain([0, ns.memTotal / ns.divisor]);
        }

        if (ns.featureSet === 'netUsage') {
            ns.y.domain([0, d3.max(allthelogs, function(d) {
                return d.rx + d.tx;
            })]);
        }

        if (ns.featureSet === 'logEvents') {
            ns.y.domain([
                0,
                d3.max(ns.data.map(function(d) {
                    return self.sums(d);
                }))
            ]);
        }

        ns.chart.selectAll('.component')
            .remove();

        var component = ns.chart.selectAll(".component")
            .data(components)
            .enter().append("g")
            .attr("class", "component");

        component.append("path")
            .attr("class", "area")
            .attr("d", function(d) {
                return ns.area(d.values);
            })
            .style("stroke", function(d) {
                if (ns.featureSet === "logEvents") {
                    return ns.loglevel(d.name);
                }
            })
            .style("stroke-width", function(d) {
                if (ns.featureSet === "logEvents") {
                    return 1.5;
                }
            })
            .style("stroke-opacity", function(d) {
                if (ns.featureSet === "logEvents") {
                    return 1;
                }
            })
            .style("fill", function(d) {

                if (ns.featureSet === "cpuUsage") {
                    if (d.name.toLowerCase() === "idle") {
                        return "none";
                    }
                    return ns.color(d.name);
                }

                if (ns.featureSet === "memUsage") {
                    if (d.name.toLowerCase() === "free") {
                        return "none";
                    }
                    return ns.color(d.name);
                }

                if (ns.featureSet === "netUsage") {
                    return ns.color(d.name);
                }

                if (ns.featureSet === "logEvents") {
                    return ns.loglevel(d.name);
                }

                console.log('define featureSet in utilizationCpuView.js');

            });

        component.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.value.date) + "," + ns.y(d.value.y0 + d.value.y / 2) + ")";
            })
            .attr("x", 1)
            .attr("y", function(d, i) {
                // make space between the labels

                if (ns.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return -3;
                    } else {
                        return 0;
                    }
                }

                if (ns.featureSet === 'cpuUsage') {
                    return -i * 3;
                }

                if (ns.featureSet === 'netUsage') {
                    return -i * 8;
                }

                if (ns.featureSet === 'logEvents') {
                    return 0;
                }

                console.log('define feature set in utilizationCpuView.js');
                return null;

            })
            .attr("text-anchor", function(d) {
                if (ns.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return 'end';
                    }
                }
            })
            .style("font-size", ".8em")
            .text(function(d) {

                if (ns.featureSet === 'cpuUsage') {
                    return d.name;
                }

                if (ns.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return 'Total: ' + ((Math.round(ns.memTotal / ns.divisor * 100)) / 100) + 'GB';
                    }
                    if (d.name === 'free') {
                        return '';
                    } else {
                        return d.name;
                    }
                }

                if (ns.featureSet === 'netUsage') {
                    return d.name + " (kB)";
                }

                if (ns.featureSet === 'logEvents') {
                    return null;
                }

                console.log('define feature set in utilizationCpuView.js');
                return 'feature set undefined';

            });

        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis);
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {
        this.$el.append(this.template());
        return this;
    }

});
;
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
to invoke:
1. include goldstoneColors.js in the template script tags
2. assign the palatte as a variable: var colorArray = new GoldstoneColors().get('colorSets');
3. invoke via colorArray, a subset, and an index corresponding to the size of the array desired

colorArray.distinct[3] (Range of 3 colorBlindFriendly colors)
colorArray.distinct[5] (Range of 5 colorBlindFriendly colors)
etc...

OPENSTACK SEVERITY LEVELS
=========================
EMERGENCY: system is unusable
ALERT: action must be taken immediately
CRITICAL: critical conditions
ERROR: error conditions
WARNING: warning conditions
NOTICE: normal but significant condition
INFO: informational messages
DEBUG: debug-level messages
*/

var blue1 = '#1560B7';
var lightBlue = '#88CCEE';
var turquoise = '#5AC6DA';
var orange1 = '#EB6F26';
var green1 = '#6BA757';
var green2 = '#117733';
var yellow1 = '#DDCC77';
var ochre = '#E5AD1E';
var purple1 = '#5C4591';
var purpleDark = '#332288';
var redPurple = '#AA4499';
var salmon = '#CC6677';
var salmonDark = '#AA4466';
var splitPea = '#999933';
var maroon = '#882255';
var brown = '#661100';

var GoldstoneColors = GoldstoneBaseModel.extend({
    defaults: {
        colorSets: {
            distinct: {
                1: [blue1],
                2: [orange1, blue1],
                '2R': [blue1, orange1],
                3: [green1, blue1, orange1],
                '3R': [orange1, blue1, green1],
                4: [blue1, green2, yellow1, ochre],
                5: [green1, orange1, blue1, ochre, purple1],
                6: [purple1, turquoise, green2, yellow1, salmon, redPurple],
                7: [purple1, turquoise, green1, green2, yellow1, salmon, redPurple],
                8: [purple1, turquoise, green1, green2, splitPea, yellow1, salmon, redPurple],
                9: [purple1, turquoise, green1, green2, splitPea, yellow1, salmon, maroon, redPurple],
                10: [purple1, turquoise, green1, green2, splitPea, yellow1, brown, salmon, maroon, redPurple],
                11: [purple1, blue1, turquoise, green1, green2, splitPea, yellow1, brown, salmon, maroon, redPurple],
                12: [purple1, blue1, turquoise, green1, green2, splitPea, yellow1, brown, salmon, salmonDark, maroon, redPurple],
                0: [purple1, green1, turquoise, yellow1, salmonDark, green2, blue1, brown, splitPea, salmon, maroon, redPurple],
                openStackSeverity8: [redPurple, purpleDark, splitPea, salmon, yellow1, lightBlue, green1, green2]
            },
            grey: {
                0: ['#bdbdbd']
            },
            oldDistinct: {
                // archives original 'color blind' palette
                1: ['#1560B7'],
                2: ['#1560B7', '#CC6677'],
                3: ['#1560B7', '#DDCC77', '#CC6677'],
                4: ['#1560B7', '#117733', '#DDCC77', '#CC6677'],
                5: ['#332288', '#88CCEE', '#117733', '#DDCC77', '#CC6677'],
                6: ['#332288', '#88CCEE', '#117733', '#DDCC77', '#CC6677', '#AA4499'],
                7: ['#332288', '#88CCEE', '#44AA99', '#117733', '#DDCC77', '#CC6677', '#AA4499'],
                8: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#AA4499'],
                9: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499'],
                10: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#661100', '#CC6677', '#882255', '#AA4499'],
                11: ['#332288', '#6699CC', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#661100', '#CC6677', '#882255', '#AA4499'],
                12: ['#332288', '#6699CC', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#661100', '#CC6677', '#AA4466', '#882255', '#AA4499'],
                0: ['#332288', '#44AA99', '#88CCEE', '#DDCC77', '#AA4466', '#117733', '#6699CC', '#661100', '#999933', '#CC6677', '#882255', '#AA4499'],
                openStackSeverity8: ['#AA4499', '#332288', '#999933', '#CC6677', '#DDCC77', '#88CCEE', '#44AA99', '#117733']
            }
        }
    }
});
;
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

var I18nModel = Backbone.Model.extend({

    initialize: function() {
        this.createTranslationObject();
        this.setTranslationObject();
        this.translateBaseTemplate();
        this.addListeners();
    },

    createTranslationObject: function() {

        // goldstone.i18nJSON is assigned on router.html, and is
        // the contents of the json object stored in the
        // goldstone/static/i18n/po_json/ directory
        var originalObject = goldstone.i18nJSON;

        var finalResult = {};
        finalResult.domain = "English";

        // if goldstone.translate is called on a key not in the .po file
        finalResult.missing_key_callback = function(key) {
            console.error('missing .po file translation for: `' + key + '`');
        };

        finalResult.locale_data = {};

        _.each(goldstone.i18nJSON, function(val, key, orig) {
            var result = {};
            result = _.omit(orig[key].locale_data.messages, "");
            result[""] = orig[key].locale_data.messages[""];
            result[""].domain = key;
            finalResult.locale_data[key] = result;
        });
        this.combinedPoJsonFiles = finalResult;

        /*
        this constructs an initialization object like:

        this.combinedPoJsonFiles: {
            "domain": "English",
            "missing_key_callback": function(key) {
                console.error('missing .po file translation for: `' + key + '`');
            }
            "locale_data": {
                "English": {
                    "": {
                        "domain": "English",
                        "plural_forms": "nplurals=2; plural=(n != 1);",
                        "lang": "en"
                    },
                    "goldstone": [""],
                    "Metrics": [""],
                    "User Settings": [""],
                },
                "japanese": {
                    "": {
                        "domain": "japanese",
                        "plural_forms": "nplurals=1; plural=0;",
                        "lang": "ja"
                    },
                    "goldstone": ["ゴールドストーン"],
                    "Metrics": ["メトリック"],
                    "User Settings": ["ユーザ設定"],
                }
            }
        }
        */
    },

    setTranslationObject: function() {

        // this.combinedPoJsonFiles created via this.createTranslationObject()
        goldstone.translationObject = new Jed(this.combinedPoJsonFiles);
        this.checkCurrentLanguage();
        this.setTranslationFunction();
    },

    /*
    these are the function signatures for the api returned by
    creating a new Jed object:

    gettext = function ( key )
    dgettext = function ( domain, key )
    dcgettext = function ( domain, key, category )
    ngettext = function ( singular_key, plural_key, value )
    dngettext = function ( domain, singular_ley, plural_key, value )
    dcngettext = function ( domain, singular_key, plural_key, value, category )
    pgettext = function ( context, key )
    dpgettext = function ( domain, context, key )
    npgettext = function ( context, singular_key, plural_key, value )
    dnpgettext = function ( domain, context, singular_key, plural_key, value )
    dcnpgettext = function ( domain, context, singular_key, plural_key, value, category )

    the most common one will be dgettext, so that is how we are setting up
    goldstone.translate.
    */

    setTranslationFunction: function() {


        // lookup for entered string and domain set to current language
        goldstone.translate = function(string) {
            if (string === '') {
                return '';
            }
            var domain = goldstone.translationObject.domain;
            return goldstone.translationObject.dgettext(domain, string);
        };

        // lookup with context applied, for simple words that may have
        // different translations in varying contexts
        goldstone.contextTranslate = function(string, context) {
            if (string === '') {
                return '';
            }
            var domain = goldstone.translationObject.domain;
            return goldstone.translationObject.dpgettext(domain, context, string);
        };

        /*
        implement the gettext sprintf string replacement function
        as provided and documented by Jed.js. example:
        goldstone.sprintf('hello, %s', 'world!');
        ==> 'hello, world!'
        goldstone.sprintf('I have %d apples', 3);
        ==> 'I have 3 apples'
        */

        goldstone.sprintf = goldstone.translationObject.sprintf;

    },


    checkCurrentLanguage: function() {

        // first determine which lanaguage .po files are installed
        var existingPos = _.keys(goldstone.i18nJSON);

        // if there is a currently selected language in localStorage,
        // use that to set the current .domain, or set to the
        // English default if none found.
        var userPrefs = localStorage.getItem('userPrefs');

        // set current language
        if (userPrefs !== null) {
            var lang = JSON.parse(userPrefs).i18n;

            // check if language is set && the po exists
            if (lang !== undefined && existingPos.indexOf(lang) > -1) {
                this.setCurrentLanguage(lang);
                return;
            }
        }

        // if lang preference hasn't been set yet,
        // or lang set in localStorage does not have a .po file,
        // just default to 'English' and set the
        // localStorage item to 'English'
        this.setCurrentLanguage('English');
        userPrefs = JSON.parse(userPrefs);

        // in case of initial load, userPrefs will be null
        userPrefs = userPrefs || {};
        userPrefs.i18n = 'English';
        localStorage.setItem('userPrefs', JSON.stringify(userPrefs));

        return;
    },

    setCurrentLanguage: function(language) {
        goldstone.translationObject.domain = language;
    },

    addListeners: function() {
        var self = this;

        // this would be triggered on userPrefsView
        this.listenTo(this, 'setLanguage', function(language) {

            // .domain is used by the dgettext calls throughout
            // the site to determine which language set to
            // draw from when determining the appropriate tranlation.
            self.setCurrentLanguage(language);
            self.translateBaseTemplate();
        });
    },

    translateBaseTemplate: function() {
        _.each($('.i18n'), function(item) {
            $(item).text(goldstone.translate($(item).data().i18n));
        });
    }
});
;
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
to invoke:
1. include infoButonText.js in the template script tags
2. instantiate the model as a variable: var infoButtonText = new InfoButtonText().get('infoText');
3. invoke via infoButtonText, and an index corresponding to the particular text desired.

2 styles:
---------
1. infoButtonText.discoverCloudTopology (Front Page Cloud Topology)
2. infoButtonText['eventTimeline'] (Front Page Event Timeline)
etc...

*/

var InfoButtonText = GoldstoneBaseModel.extend({
    defaults: {
        infoText: {

            // populate info-button-text here.
            // accepts html markup such as <br>

            discoverCloudTopology: function() {
                return goldstone.translate('This is the OpenStack topology map.  You can use leaf nodes to navigate to specific types of resources.');
            },

            discoverZoomTopology: function() {
                return goldstone.translate('This is the OpenStack topology map.  Clicking branches will zoom in, clicking on leaf nodes will bring up information about resources.  Click on the far left section to zoom out.');
            },

            eventTimeline: function() {
                return goldstone.translate('The event timeline displays key events that have occurred in your cloud.  You can adjust the displayed data with the filter and time settings in the menu bar.  Hovering on an event brings up the event detail.');
            },

            nodeAvailability: function() {
                return goldstone.translate('The node presence chart keeps track of the last time each node in the cloud was seen.  Nodes on the right have been seen more recently than nodes on the left.  The center lane shows nodes that have been detected in the log stream.  The top lane shows nodes that are not logging, but can be pinged.');
            },

            serviceStatus: function() {
                return goldstone.translate('The service status panel shows the last known state of all OS services on the node.');
            },

            utilization: function() {
                return goldstone.translate('The utilization charts show the OS level utilization of the node.');
            },

            hypervisor: function() {
                return goldstone.translate('The hypervisor charts show the last known allocation and usage of resources across all of the VMs on the node.');
            },

            novaTopologyDiscover: function() {
                return goldstone.translate('This is the OpenStack Nova topology map.  You can use leaf nodes to populate the resource list on the right.  In some cases, such as hypervisors, clicking a resource in the table will navigate you to a resource specific view.');
            },

            cinderTopologyDiscover: function() {
                return goldstone.translate('This is the OpenStack Cinder topology map.  You can use leaf nodes to populate the resource list on the right.  In some cases, clicking a resource in the table will navigate you to a resource specific view.');
            },

            glanceTopologyDiscover: function() {
                return goldstone.translate('This is the OpenStack Glance topology map.  You can use leaf nodes to populate the resource list on the right.  In some cases, clicking a resource in the table will navigate you to a resource specific view.');
            },

            keystoneTopologyDiscover: function() {
                return goldstone.translate('This is the OpenStack Keystone topology map.  You can use leaf nodes to populate the resource list on the right.  In some cases, clicking a resource in the table will navigate you to a resource specific view.');
            },

            novaSpawns: function() {
                return goldstone.translate('This chart displays VM spawn success and failure counts across your cloud.  You can adjust the displayed data with the time settings in the menu bar.  This data is derived from the log stream, so if no logging occurs for a period of time, gaps may appear in the data.');
            },

            novaCpuResources: function() {
                return goldstone.translate('This chart displays aggregate CPU core allocation across your cloud.  You can adjust the displayed data with the time settings in the menu bar.  This data is derived from the log stream, so if no logging occurs for a period of time, gaps may appear in the data.');
            },

            novaMemResources: function() {
                return goldstone.translate('This chart displays aggregate memory allocation across your cloud.  You can adjust the displayed data with the time settings in the menu bar.  This data is derived from the log stream, so if no logging occurs for a period of time, gaps may appear in the data.');
            },

            novaDiskResources: function() {
                return goldstone.translate('This chart displays aggregate disk allocation across your cloud.  You can adjust the displayed data with the time settings in the menu bar.  This data is derived from the log stream, so if no logging occurs for a period of time, gaps may appear in the data.');
            },

            searchLogAnalysis: function() {
                return goldstone.translate('This chart displays log stream data across your cloud.  You can adjust the displayed data with the time settings in the menu bar, and with the filter settings that double as a legend.  The table below contains the individual log entries for the time range and filter settings.');
            },

            cloudTopologyResourceList: function() {
                return goldstone.translate('Click row for additional resource info.<br><br>Clicking on hypervisor or hosts reports will navigate to additional report pages.');

            },

            eventBrowserViz: function() {
                return goldstone.translate('');

            },

            apiBrowserViz: function() {
                return goldstone.translate('');

            },

            nodeReportLogTab: function() {
                return goldstone.translate('');

            },

            openTrailManager: function() {
                return goldstone.translate('');

            },

            openTrailLogHistory: function() {
                return goldstone.translate('');

            },

            leasesManager: function() {
                return goldstone.translate('');
            },

        }
    }
});
;
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

instantiated on eventsBrowserPageView as:

this.eventsBrowserTableCollection = new EventsBrowserTableCollection({});

this.eventsBrowserTable = new EventsBrowserDataTableView({
    chartTitle: 'Events Browser',
    collection: this.eventsBrowserTableCollection,
    el: '#events-browser-table',
    infoIcon: 'fa-table',
    width: $('#events-browser-table').width()
});

*/

// define collection and link to model
var ApiBrowserTableCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        this.urlGenerator();
    },

    urlBase: '/core/apiperf/search/',

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addPageSize: function(n) {
        n = n || 1000;
        return '&page_size=' + n;
    },

    preProcessData: function(data) {
        if(data && data.results) {
            return data.results;
        }
    }
});
;
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
instantiated on eventsBrowserPageView as:

this.eventsBrowserVizCollection = new EventsHistogramCollection({});

this.eventsBrowserView = new ChartSet({
    chartTitle: 'Events Histogram',
    collection: this.eventsBrowserVizCollection,
    el: '#events-histogram-visualization',
    infoIcon: 'fa-tasks',
    width: $('#events-histogram-visualization').width(),
    yAxisLabel: 'Number of Events'
});
 */

// define collection and link to model

var ApiHistogramCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        this.urlGenerator();
    },

    urlBase: '/core/apiperf/summarize/',

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    preProcessData: function(data) {
        var self = this;
        // initialize container for formatted results
        finalResult = [];

        // for each array index in the 'data' key
        _.each(data.per_interval, function(item) {
            var tempObj = {};

            // adds the 'time' param based on the object keyed by timestamp
            // and the 200-500 statuses
            tempObj.time = parseInt(_.keys(item)[0], 10);
            tempObj.count = item[tempObj.time].count;

            // add the tempObj to the final results array
            finalResult.push(tempObj);
        });

        // returning inside the 'parse' function adds to collection
        // and triggers 'sync'
        return finalResult;
    }
});
;
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
Instantiated similar to:

this.novaApiPerfChart = new ApiPerfCollection({
    componentParam: 'nova',
});
*/

// define collection and link to model

var ApiPerfModel = GoldstoneBaseModel.extend({});

var ApiPerfCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.per_interval) {
            return data.per_interval;
        } else {
            return [];
        }
    },

    model: ApiPerfModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.componentParam = this.options.componentParam;
        this.defaults.reportParams = {};
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {

        // a listener in the parent page container triggers an event picked up
        // by GoldstoneBaseView which adjusts ns.globalLookback to match
        // the number of minutes specified by the selector

        var ns = this.defaults;
        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        ns.reportParams.interval = '' + Math.round(1 * ns.globalLookback) + "s";
        this.url = '/core/apiperf/summarize/?@timestamp__range={"gte":' + ns.reportParams.start +
            ',"lte":' + ns.reportParams.end +
            '}&interval=' + ns.reportParams.interval +
            '&component=' + this.defaults.componentParam;

        // generates url string similar to:
        // /core/apiperf/summarize/?@timestamp__range={%22gte%22:1428556490}&interval=60s&component=glance

    }
});
;
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

// define collection and link to model

var EventTimelineModel = GoldstoneBaseModel.extend({
    // sort by @timestamp. Used to be id, but that has been
    // removed as of v3 api.
    idAttribute: 'timestamp'
});

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        var nextUrl;

        // in the case that there are additional paged server responses
        if (data.next && data.next !== null) {
            var dN = data.next;

            // if url params change, be sure to update this:
            nextUrl = dN.slice(dN.indexOf(this.urlBase));

            // fetch and add to collection without deleting existing data
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }

        // in any case, return the data to the collection
        return data.results;
    },

    defaults: {},

    urlBase: '/core/events/search/',

    initialize: function(options) {

        this.defaults = _.clone(this.defaults);

        this.urlUpdate(this.computeLookback());
        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3
        this.fetchWithReset();
    },

    model: EventTimelineModel,

    computeLookback: function() {
        var lookbackMinutes;
        if ($('.global-lookback-selector .form-control').length) {
            // global lookback is available:
            lookbackMinutes = parseInt($('.global-lookback-selector .form-control').val(), 10);
        } else {
            // otherwise, default to 1 hour:
            lookbackMinutes = 60;
        }
        return lookbackMinutes;
    },

    fetchWithReset: function() {

        // used when you want to delete existing data in collection
        // such as changing the global-lookback period
        this.fetch({
            remove: true
        });
    },

    fetchNoReset: function() {

        // used when you want to retain existing data in collection
        // such as a global-refresh-triggered update to the Event Timeline viz
        this.fetch({
            remove: false
        });
    },

    urlUpdate: function(val) {
        // creates a url similar to:
        // /logging/events/search/?@timestamp__range={"gte":1426698303974}&page_size=1000"

        var lookback = +new Date() - (val * 60 * 1000);
        this.url = this.urlBase + '?timestamp__range={"gte":' +
            lookback + ',"lte":' + (+new Date()) + '}&page_size=100';
    }
});
;
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

instantiated on eventsBrowserPageView as:

this.eventsBrowserTableCollection = new EventsBrowserTableCollection({});

this.eventsBrowserTable = new EventsBrowserDataTableView({
    chartTitle: 'Events Browser',
    collection: this.eventsBrowserTableCollection,
    el: '#events-browser-table',
    infoIcon: 'fa-table',
    width: $('#events-browser-table').width()
});

*/

// define collection and link to model
var EventsBrowserTableCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        this.urlGenerator();
    },

    urlBase: '/core/events/search/',

    addRange: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addPageSize: function(n) {
        n = n || 1000;
        return '&page_size=' + n;
    },

    preProcessData: function(data) {
        if(data && data.results) {
            return data.results;
        }
    }
});
;
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
instantiated on eventsBrowserPageView as:

this.eventsBrowserVizCollection = new EventsHistogramCollection({});

this.eventsBrowserView = new ChartSet({
    chartTitle: 'Events Histogram',
    collection: this.eventsBrowserVizCollection,
    el: '#events-histogram-visualization',
    infoIcon: 'fa-tasks',
    width: $('#events-histogram-visualization').width(),
    yAxisLabel: 'Number of Events'
});
 */

// define collection and link to model

var EventsHistogramCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        this.urlGenerator();
    },

    urlBase: '/core/events/summarize/',

    addRange: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    preProcessData: function(data) {
        var self = this;

        // initialize container for formatted results
        finalResult = [];

        // for each array index in the 'data' key
        _.each(data.data, function(item) {
            var tempObj = {};

            // adds the 'time' param based on the
            // object keyed by timestamp
            tempObj.time = parseInt(_.keys(item)[0], 10);

            // iterate through each item in the array
            _.each(item[tempObj.time], function(obj){
                var key = _.keys(obj);
                var value = _.values(obj)[0];

                // copy key/value pairs to tempObj
                tempObj[key] = value;
            });

            // initialize counter
            var count = 0;
            _.each(tempObj, function(val, key) {
                // add up the values of each nested object
                if(key !== 'time') {
                    count += val;
                }
            });

            // set 'count' equal to the counter
            tempObj.count = count;

            // add the tempObj to the final results array
            finalResult.push(tempObj);
        });

        // returning inside the 'parse' function adds to collection
        // and triggers 'sync'
        return finalResult;
    }
});
;
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

// define collection and link to model

var HypervisorCollection = Backbone.Collection.extend({

    parse: function(data) {
        this.dummyGen();
        return this.dummy.results;
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.url = options.url;
        this.dummy = _.clone(this.dummy);
        this.fetch();
    },

    dummyGen: function() {
        this.dummy = {
            results: []
        };

        var day = +new Date();

        var coreTotal = 0;
        var coreGen = function() {
            var result = 2 << (Math.floor(Math.random() * 3));
            coreTotal += result;
            return result;
        };

        var instanceGen = function() {
            var result = Math.floor(Math.random() * 100000000);
            return result;
        };

        var result = {
            "date": day
        };

        for (var i = 0; i < 5; i++) {
            var instance = "00000" + instanceGen();
            result[instance] = coreGen();
        }

        result.available = 192 - coreTotal;

        this.dummy.results.push(result);
    },


    dummy: {
        results: [{
                "date": 1412815619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13
            }, {
                "date": 1412818619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13
            }, {
                "date": 1412823619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13
            }, {
                "date": 1412828619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13
            }

        ]
    }
});
;
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

// define collection and link to model

var HypervisorVmCpuCollection = Backbone.Collection.extend({

    parse: function(data) {
        return this.dummy.results;
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.url = options.url;
        this.dummy = _.clone(this.dummy);
        this.dummyGen();
        this.fetch();
    },

    dummyGen: function() {
        this.dummy = {
            results: []
        };


        var day = 1412812619263;

        var randomizer = function() {
            var result = Math.floor(Math.random() * 5000) /
                100;
            return result;
        };

        for (var i = 0; i < Math.floor(Math.random() * 20) + 10; i++) {

            var result = {
                date: day,

                user: [{
                    vm1: randomizer(),
                    vm2: randomizer(),
                    vm3: randomizer(),
                    vm4: randomizer(),
                    vm5: randomizer()
                }],
                system: [{
                    vm1: randomizer(),
                    vm2: randomizer(),
                    vm3: randomizer(),
                    vm4: randomizer(),
                    vm5: randomizer()
                }],
                wait: [{
                    vm1: randomizer(),
                    vm2: randomizer(),
                    vm3: randomizer(),
                    vm4: randomizer(),
                    vm5: randomizer()
                }]

            };

            this.dummy.results.push(result);
            day += 360000;

        }
    },

    dummy: {

        results: [

            {
                date: 1412812619263,

                user: [{
                    vm1: 50,
                    vm2: 19,
                    vm3: 11
                }],
                system: [{
                    vm1: 10,
                    vm2: 79,
                    vm3: 31
                }],
                wait: [{
                    vm1: 80,
                    vm2: 39,
                    vm3: 61
                }]

            }, {
                date: 1412912619263,

                user: [{
                    vm1: 80,
                    vm2: 29,
                    vm3: 51
                }],
                system: [{
                    vm1: 80,
                    vm2: 59,
                    vm3: 21
                }],
                wait: [{
                    vm1: 70,
                    vm2: 49,
                    vm3: 71
                }]

            }, {
                date: 1413012619263,

                user: [{
                    vm1: 60,
                    vm2: 29,
                    vm3: 51
                }],
                system: [{
                    vm1: 80,
                    vm2: 39,
                    vm3: 81
                }],
                wait: [{
                    vm1: 30,
                    vm2: 79,
                    vm3: 51
                }]
            }
        ]
    }


});
;
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

// define collection and link to model

/*
instantiated in logSearchPageView.js as:

    this.logAnalysisCollection = new LogAnalysisCollection({});

    ** and the view as:

    this.logAnalysisView = new LogAnalysisView({
        collection: this.logAnalysisCollection,
        width: $('.log-analysis-container').width(),
        height: 300,
        el: '.log-analysis-container',
        featureSet: 'logEvents',
        chartTitle: 'Log Analysis',
        urlRoot: "/logging/summarize?",

    });

*/

var LogAnalysisCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/logging'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }

        return data;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'time' for
    // the models as they are put into the collection
    // comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
    },

    fetchWithRemoval: function() {
        this.fetch({
            remove: true
        });
    }
});
;
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

// define collection and link to model

var model = GoldstoneBaseModel.extend({});

var MetricViewCollection = GoldstoneBaseCollection.extend({

    instanceSpecificInit: function() {
        this.reportParams = {};
        this.statistic = this.options.statistic;
        this.standardDev = this.options.standardDev;
        this.fetchWithReset();
    }
});
;
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

// define collection and link to model

/*
instantiated on nodeReportView and novaReportView

instantiation example:

this.cpuUsageChart = new MultiMetricComboCollection({
    metricNames: ['os.cpu.sys', 'os.cpu.user', 'os.cpu.wait'],
    globalLookback: ns.globalLookback, (optional)
    nodeName: hostName (optional)
});
*/

var MultiMetricComboCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        var ns = this.defaults;

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        } else {
            ns.urlCollectionCount--;
        }

        // before returning the collection, tag it with the metricName
        // that produced the data
        data.metricSource = ns.metricNames[(ns.metricNames.length - 1) - ns.urlCollectionCount];

        return data;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.reportParams = {};
        this.defaults.fetchInProgress = false;
        this.defaults.nodeName = this.options.nodeName;
        this.defaults.metricNames = this.options.metricNames;
        this.defaults.urlCollectionCountOrig = this.defaults.metricNames.length;
        this.defaults.urlCollectionCount = this.defaults.metricNames.length;
        this.fetchMultipleUrls();

    },

    fetchMultipleUrls: function() {
        var self = this;
        var ns = this.defaults;

        if (ns.fetchInProgress) {
            return null;
        }

        ns.fetchInProgress = true;
        ns.urlsToFetch = [];

        // grabs minutes from global selector option value
        ns.globalLookback = $('#global-lookback-range').val();

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date() - (ns.globalLookback * 1000 * 60));
        ns.reportParams.interval = '' + Math.max(1, (ns.globalLookback / 24)) + 'm';

        _.each(self.defaults.metricNames, function(prefix) {

            var urlString = '/core/metrics/summarize/?name=' + prefix;

            if (self.defaults.nodeName) {
                urlString += '&node=' + self.defaults.nodeName;
            }

            urlString += '&@timestamp__range={"gte":' +
                ns.reportParams.start + ',"lte":' + ns.reportParams.end +
                '}&interval=' + ns.reportParams.interval;

            self.defaults.urlsToFetch.push(urlString);
        });

        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: ns.urlsToFetch[0],
            success: function() {

                // upon success: further fetches are carried out with
                // remove: false to build the collection
                _.each(self.defaults.urlsToFetch.slice(1), function(item) {
                    self.fetch({
                        url: item,
                        remove: false
                    });
                });
            }
        });
    }
});
;
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
Instantiated on discoverView as:
    this.nodeAvailChart = new NodeAvailCollection({});
*/

var NodeAvailModel = GoldstoneBaseModel.extend({});

var NodeAvailCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data.next && data.next !== null) {
            var dp = data.next;
            var nextUrl = dp.slice(dp.indexOf('/logging'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        } else {
            // there will be multiple fetches arriving and until
            // they are done, no new fetches can be initiated
            // decrement the count and return the data so far
            this.defaults.urlCollectionCount--;
        }
        return data;
    },

    model: NodeAvailModel,

    initialize: function(options) {
        this.defaults = _.clone(this.defaults);

        // fetchInProgress = true will block further fetches
        this.defaults.fetchInProgress = false;

        // one small interval for more accurate timestamp
        // and one large interval for more accurate event counts
        this.defaults.urlCollectionCount = 2;
        this.defaults.urlCollectionCountOrig = 2;

        // kick off the process of fetching the two data payloads
        this.fetchMultipleUrls();

    },

    computeLookback: function() {
        var lookbackMinutes;
        if ($('.global-lookback-selector .form-control').length) {
            // global lookback is available:
            lookbackMinutes = parseInt($('.global-lookback-selector .form-control').val(), 10);
        } else {
            // otherwise, default to 1 hour:
            lookbackMinutes = 60;
        }

        // returns the number of minutes corresponding
        // to the global lookback selector
        return lookbackMinutes;
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        var lookbackMinutes = (this.computeLookback());
        var lookbackSeconds = (lookbackMinutes * 60);
        var lookbackMilliseconds = (lookbackSeconds * 1000);

        // this is the url with the small interval to gather a more
        // accurate assessment of the time the node was last seen.
        // creating approximately 24 buckets for a good mix of accuracy/speed.
        this.defaults.urlsToFetch[0] = '' +
            '/logging/summarize/?@timestamp__range={"gte":' +
            (+new Date() - (lookbackMilliseconds)) +
            '}&interval=' + Math.max(1, (lookbackMinutes / 24)) + 'm';

        // this is the url with the long lookback to bucket ALL
        // the values into a single return value per alert level.
        // currently magnifying 1 day (or portion thereof) into 1 week.
        this.defaults.urlsToFetch[1] = '' +
            '/logging/summarize/?@timestamp__range={"gte":' +
            (+new Date() - (lookbackMilliseconds)) +
            '}&interval=' + (Math.ceil(lookbackMinutes / 1440)) + 'w';

        // don't add {remove:false} to the initial fetch
        // as it will introduce an artifact that will
        // render via d3
        this.fetch({
            // clear out the previous results
            remove: true,
            url: this.defaults.urlsToFetch[0],
            // upon successful first fetch, kick off the second
            success: function() {
                self.fetch({
                    url: self.defaults.urlsToFetch[1],
                    // clear out the previous result, it's already been
                    // stored in the view for zipping the 2 together
                    remove: true
                });
            }
        });
    }
});
;
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

// define collection and link to model

var ReportsReportCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        return {
            result: data.per_name
        };
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.nodeName = options.nodeName;
        this.defaults.globalLookback = options.globalLookback;
        this.retrieveData();
    },

    retrieveData: function() {
        var self = this;

        this.url = "/core/report_names/?node=" +
            this.defaults.nodeName +
            "&@timestamp__range={'gte':" + (+new Date() - this.defaults.globalLookback * 1000 * 60) +
            "}";

        // /core/report_names/?node=ctrl-01&@timestamp__range={%27gte%27:1427189954471}

        this.fetch();
    }
});
;
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

// define collection and link to model

var ServiceStatusCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        var nextUrl;
        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }
        return data.results;
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.nodeName = options.nodeName;
        this.retrieveData();
    },

    retrieveData: function() {
        var twentyAgo = (+new Date() - (1000 * 60 * 20));

        this.url = "/core/reports/?name__prefix=os.service&node__prefix=" +
            this.defaults.nodeName + "&page_size=300" +
            "&@timestamp__range={'gte':" + twentyAgo + "}";

        // this.url similar to: /core/reports/?name__prefix=os.service&node__prefix=rsrc-01&page_size=300&@timestamp__gte=1423681500026

        this.fetch();
    }
});
;
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
This collection is currently direclty implemented in the
Nova VM Spawns viz
JSON payload format:

per_interval: [{
    timestamp:[count: 1, success: [{true: 1}]],
    timestamp:[count: 3, success: [{true: 2}, {false: 1}]],
    timestamp:[count: 0, success: []],
    ...
}]
*/

// define collection and link to model

var SpawnsCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.per_interval) {
            return data.per_interval;
        } else {
            return [];
        }
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.urlPrefix = this.options.urlPrefix;
        this.defaults.reportParams = {};
        // this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {
        var ns = this.defaults;

        // a listener in the parent page container triggers an event picked up
        // by GoldstoneBaseView which adjusts ns.globalLookback to match
        // the number of minutes specified by the selector

        // grabs minutes from global selector option value
        ns.globalLookback = $('#global-lookback-range').val();

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        ns.reportParams.interval = '' + Math.max(1, (ns.globalLookback / 24)) + 'm';

        this.url = ns.urlPrefix + '?@timestamp__range={"gte":' +
            ns.reportParams.start +
            ',"lte":' + ns.reportParams.end +
            '}&interval=' + ns.reportParams.interval;

    }


    // creates a url similar to:
    // /nova/hypervisor/spawns/?@timestamp__range={"gte":1429027100000}&interval=1h

});
;
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

// define collection and link to model

var ZoomablePartitionCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        return data;
    },

    model: GoldstoneBaseModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.url = "/core/nav_tree/";
        this.fetch();
    }
});
;
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
This view will be re-invoked upon initial page load, and every full page
refresh, as it is baked into router.html .
*/

/*
instantiated on router.html as:
goldstone.addonMenuView = new AddonMenuView({
    el: ".addon-menu-view-container"
});
*/

var AddonMenuView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.el = this.options.el;
        this.processListeners();

        // passing true will also dynamically generate new routes in
        // Backbone router corresponding with the .routes param in the
        // addon's .js file.
        this.refreshAddonsMenu(true);
    },

    processListeners: function() {
        var self = this;

        // this trigger is fired by loginPageView after user logs in
        this.listenTo(this, 'installedAppsUpdated', function() {

            // calling refreshAddonsMenu without passing true will update the
            // add-ons drop-down menu, but will not again re-register the
            // url routes with Backbone router.
            self.refreshAddonsMenu(true);
        });
    },

    refreshAddonsMenu: function(addNewRoute) {
        var addons = localStorage.getItem('addons');

        // the 'else' case will be triggered due to any of the various ways that
        // local storage might return a missing key, or a null set.
        if (addons && addons !== null && addons !== "null" && addons !== "[]" && addons !== []) {

            // clear list before re-rendering in case app list has changed
            this.$el.html('');

            // render appends the 'Add-ons' main menu-bar dropdown
            this.render();

            // the individual dropdowns and dropdown submenus are constructed
            // as a html string, and then appended into the menu drop-down list
            var extraMenuItems = this.generateDropdownElementsPerAddon(addNewRoute);
            $(this.el).find('.addon-menu-li-elements').html(extraMenuItems());

            // must trigger html template translation in order to display a
            // language other than English upon initial render without
            // having to toggle the language selector switch
            goldstone.i18n.translateBaseTemplate();

        } else {

            // in the case that the addons key in localStorage
            // is falsy, just remove the dropdown and links
            this.$el.html('');
        }
    },

    generateDropdownElementsPerAddon: function(addNewRoute) {
        var self = this;
        var list = localStorage.getItem('addons');
        list = JSON.parse(list);
        var result = '';

        // for each object in the array of addons in 'list', do the following:
        _.each(list, function(item) {

            /*
            In keeping with the i18n scheme for dynamically tranlsating
            elements that are appended to the base template, addon drop-down
            are given the required <span> element with a class of 'i18n'
            and a data-i18n atribute with a key equal to the string
            to be translated.

            example:
            <li class="dropdown-submenu"><a tabindex="-1"><i class="fa fa-star"></i> <span class="i18n" data-i18n="opentrail">opentrail</a><ul class="dropdown-menu" role="menu"></li>
            */

            // create a sub-menu labelled with the addon's 'name' property
            result += '<li class="dropdown-submenu">' +
                '<a tabindex="-1"><i class="fa fa-star"></i> <span class="i18n" data-i18n="' + item.name + '">' + item.name +'</a>' +
                '<ul class="dropdown-menu" role="menu">';

            // addons will be loaded into localStorage after the redirect
            // to /#login, but a full page refresh is required before the
            // newly appended js script tags are loaded.
            if (goldstone[item.url_root]) {

                // for each sub-array in the array of 'routes' in
                // the addon's javascript file, do the following:
                _.each(goldstone[item.url_root].routes, function(route) {

                    // conditional to skip adding a drop-down entry if
                    // no drop-down label is supplied.
                    if (route[1] !== null) {

                        // append a drop-down <li> tag for each item with a link
                        // pointing to index 0 of the route, and a menu label
                        // derived from index 1 of the item
                        result += '<li><a href="#' + route[0] +
                            '"><span class="i18n" data-i18n="' + route[1] +
                            '">' + route[1] + '</a>';
                    }

                    // dynamically add a new route for each item
                    // the 'addNewRoute === true' condition prevents the route from
                    // being added again when it is re-triggered by the listener
                    // on gsRouter 'switchingView'
                    if (addNewRoute === true) {
                        // ignored for menu updates beyond the first one
                        self.addNewRoute(route);
                    }

                });

                // cap the dropdown sub-menu with closing tags before
                // continuing the iteration through the addons localStorage entry.
                result += '</ul></li>';
            } else {

                var refreshMessage = goldstone.translate('Refresh browser and/or log in to complete addon installation process.');

                goldstone.raiseInfo(refreshMessage);
                result += '<li>' + refreshMessage;
            }

        });

        // return backbone template of html string that will construct
        // the drop down menu and submenus of the add-ons menu item
        return _.template(result);
    },

    addNewRoute: function(routeToAdd) {

        // .route will dynamically add a new route where the url is
        // index 0 of the passed in route array, and the view to load is
        // index 2 of the passed in route array.
        goldstone.gsRouter.route(routeToAdd[0], function(passedValue) {

            // passedValue will be created by routes with /:foo
            // passed value = 'foo'
            if (passedValue) {
                this.switchView(routeToAdd[2], {'passedValue': passedValue});
            } else {
                this.switchView(routeToAdd[2]);
            }
        });
    },

    template: _.template('' +
        '<a href="#" class="dropdown-toggle" data-toggle="dropdown">' +
        '<i class = "fa fa-briefcase"></i> <span class="i18n" data-i18n="Add-ons">Add-ons</span><b class="caret"></b></a>' +
        '<ul class="dropdown-menu addon-menu-li-elements">' +
        '</ul>'
    )

});
;
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
the jQuery dataTables plugin is documented at
http://datatables.net/reference/api/

instantiated on apiBrowserPageView as:

    this.eventsBrowserTable = new EventsBrowserDataTableView({
        el: '.events-browser-table',
        chartTitle: 'Events Browser',
        infoIcon: 'fa-table',
        width: $('.events-browser-table').width()
    });

*/

var ApiBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        ApiBrowserDataTableView.__super__.instanceSpecificInit.apply(this, arguments);
        this.drawSearchTableServerSide('#reports-result-table');
    },

    update: function() {
        var oTable;

        if ($.fn.dataTable.isDataTable("#reports-result-table")) {
            oTable = $("#reports-result-table").DataTable();
            oTable.ajax.reload();
        }
    },

    oTableParamGeneratorBase: function() {
        var self = this;
        return {
            "scrollX": "100%",
            "processing": false,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "ordering": true,
            "order": [
                [0, 'desc']
            ],
            "columnDefs": [{
                    "data": "@timestamp",
                    "type": "date",
                    "targets": 0,
                    "render": function(data, type, full, meta) {
                        return moment(data).format();
                    }
                }, {
                    "data": "host",
                    "targets": 1
                }, {
                    "data": "client_ip",
                    "targets": 2
                }, {
                    "data": "uri",
                    "targets": 3
                }, {
                    "data": "response_status",
                    "targets": 4
                }, {
                    "data": "response_time",
                    "targets": 5
                }, {
                    "data": "response_length",
                    "targets": 6
                }, {
                    "data": "component",
                    "targets": 7
                }, {
                    "data": "type",
                    "targets": 8
                }, {
                    "data": "doc_type",
                    "visible": false,
                    "searchable": true
                }, {
                    "data": "id",
                    "visible": false,
                    "searchable": true
                }

            ],
            "serverSide": true,
            "ajax": {
                beforeSend: function(obj, settings) {
                    self.collectionMixin.urlGenerator();
                    // the pageSize and searchQuery are jQuery values
                    var pageSize = $(self.el).find('select.form-control').val();
                    var searchQuery = $(self.el).find('input.form-control').val();

                    // the paginationStart is taken from the dataTables
                    // generated serverSide query string that will be
                    // replaced by this.defaults.url after the required
                    // components are parsed out of it
                    var paginationStart = settings.url.match(/start=\d{1,}&/gi);
                    paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
                    var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                    var urlColumnOrdering = decodeURIComponent(settings.url).match(/order\[0\]\[column\]=\d*/gi);

                    // capture which column was clicked
                    // and which direction the sort is called for

                    var urlOrderingDirection = decodeURIComponent(settings.url).match(/order\[0\]\[dir\]=(asc|desc)/gi);

                    // the url that will be fetched is now about to be
                    // replaced with the urlGen'd url before adding on
                    // the parsed components
                    settings.url = self.collectionMixin.url + "&page_size=" + pageSize +
                        "&page=" + computeStartPage;

                    // here begins the combiation of additional params
                    // to construct the final url for the dataTable fetch
                    if (searchQuery) {
                        settings.url += "&_all__regexp=.*" +
                            searchQuery + ".*";
                    }

                    // if no interesting sort, ignore it
                    if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

                        // or, if something has changed, capture the
                        // column to sort by, and the sort direction

                        // generalize if sorting is implemented server-side
                        var columnLabelHash = {
                            0: '@timestamp',
                            1: 'syslog_severity',
                            2: 'component',
                            3: 'host',
                            4: 'log_message'
                        };

                        var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

                        var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

                        var ascDec;
                        if (orderByDirection === 'asc') {
                            ascDec = '';
                        } else {
                            ascDec = '-';
                        }

                        // uncomment when ordering is in place.
                        // settings.url = settings.url + "&ordering=" +
                        //     ascDec + columnLabelHash[orderByColumn];
                    }



                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = self.serverSideDataPrep(data);
                    return data;
                }
            }
        };
    },

    serverSideDataPrep: function(data) {
        data = JSON.parse(data);
        var result = {
            results: data.results,
            recordsTotal: data.count,
            recordsFiltered: data.count
        };
        result = JSON.stringify(result);
        return result;
    },

    serverSideTableHeadings: _.template('' +
        '<tr class="header">' +
        '<th><%=goldstone.contextTranslate(\'timestamp\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'host\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'client ip\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'uri\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'status\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'response time\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'length\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'component\', \'apibrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'type\', \'apibrowserdata\')%></th>' +
        '</tr>'
    )
});
;
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

var ApiBrowserPageView = GoldstoneBasePageView2.extend({

    renderCharts: function() {

        this.apiBrowserVizCollection = new ApiHistogramCollection({});

        this.apiBrowserView = new ApiBrowserView({
            chartTitle: goldstone.contextTranslate('Api Calls vs Time', 'apibrowserpage'),
            collection: this.apiBrowserVizCollection,
            el: '#api-histogram-visualization',
            infoIcon: 'fa-tasks',
            width: $('#api-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Api Calls by Range', 'apibrowserpage'),
            marginLeft: 60
        });

        // instantiated only for access to url generation functions
        this.apiBrowserTableCollection = new GoldstoneBaseCollection({
            skipFetch: true
        });
        this.apiBrowserTableCollection.urlBase = "/core/apiperf/search/";
        this.apiBrowserTableCollection.addRange = function() {
            return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
        };

        this.apiBrowserTable = new ApiBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Api Browser', 'apibrowserpage'),
            collectionMixin: this.apiBrowserTableCollection,
            el: '#api-browser-table',
            infoIcon: 'fa-table',
            infoText: 'hide',
            width: $('#api-browser-table').width()
        });

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.apiBrowserVizCollection, this.apiBrowserView, this.apiBrowserTableCollection, this.apiBrowserTable];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.apiBrowserView.trigger('lookbackSelectorChanged');
            this.apiBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    template: _.template('' +

        '<div class="row">' +
        '<div id="api-histogram-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="api-browser-table" class="col-md-12"></div>' +
        '</div>'
    )

});
;
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

var ApiBrowserView = ChartSet.extend({

    // instanceSpecificInit: function() {
    //     this.data = [];
    //     this.processOptions();

    //     this.renderChartBorders();
    //     this.makeChart();
    // },

    // processOptions: function() {

    //     this.collection = this.options.collection ? this.options.collection : undefined;
    //     this.chartTitle = this.options.chartTitle || null;
    //     if (this.options.el) {
    //         this.el = this.options.el;
    //     }
    //     this.width = this.options.width || 300;
    //     this.height = this.options.height || 400;
    //     this.infoIcon = this.options.infoIcon;
    //     this.infoText = this.options.infoText;
    //     this.marginLeft = this.options.marginLeft || 50;
    //     this.marginRight = this.options.marginRight || 120;
    //     this.marginTop = this.options.marginTop || 20;
    //     this.marginBottom = this.options.marginBottom || 80;
    //     this.yAxisLabel = this.options.yAxisLabel;
    //     this.popoverTimeLabel = this.options.popoverTimeLabel || "time";
    //     this.popoverUnitLabel = this.options.popoverUnitLabel || "events";
    //     this.colorArray = new GoldstoneColors().get('colorSets');
    //     this.shapeArray = ['rect', 'circle'];
    //     this.shapeCounter = 0;
    //     this.shape = this.options.shape || this.shapeArray[this.shapeCounter];
    //     this.xParam = this.options.xParam;
    //     this.yParam = this.options.yParam;
    // },

    // resetXParam: function(param) {
    //     param = param || 'time';
    //     this.xParam = param;
    // },

    // resetYParam: function(param) {
    //     param = param || 'count';
    //     this.yParam = param;
    // },

    // renderChartBorders: function() {
    //     this.$el.append(new ChartHeaderView({
    //         chartTitle: this.chartTitle,
    //         infoText: this.infoText,
    //         infoIcon: this.infoIcon,
    //     }).el);
    // },

    // makeChart: function() {
    //     this.processListeners();
    //     this.svgAdder(this.width, this.height);
    //     this.initializePopovers();
    //     this.chartAdder();

    //     this.setXDomain();
    //     this.setYDomain();

    //     this.setXAxis();
    //     this.setYAxis();
    //     this.callXAxis();
    //     this.callYAxis();

    //     this.setYAxisLabel();
    //     this.setSpinner();
    // },

    // update: function() {
    //     this.setData(this.collection.toJSON());
    //     this.updateWithNewData();
    // },

    // updateWithNewData: function() {
    //     this.setXDomain();
    //     this.setYDomain();
    //     this.resetAxes();
    //     this.bindShapeToData(this.shape);
    //     this.shapeUpdate(this.shape);
    //     this.shapeEnter(this.shape);
    //     this.shapeExit(this.shape);
    //     this.hideSpinner();
    // },

    // initializePopovers: function() {
    //     var self = this;
    //     this.tip = d3.tip()
    //         .attr('class', 'd3-tip')
    //         .offset([-10, 0])
    //         .html(function(d) {
    //             return self.popoverTimeLabel + ": " + moment(+d.time).format() +
    //                 "<br>" +
    //                 self.popoverUnitLabel + ": " + d.count;
    //         });

    //     this.svg.call(this.tip);
    // },

    // setData: function(newData) {
    //     this.data = newData;
    // },

    // svgAdder: function() {
    //     this.svg = d3.select(this.el).append('svg')
    //         .attr('width', this.width)
    //         .attr('height', this.height);
    // },

    // chartAdder: function() {
    //     this.chart = this.svg
    //         .append('g')
    //         .attr('class', 'chart')
    //         .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');
    // },

    // setXDomain: function() {
    //     var param = this.xParam || 'time';
    //     var self = this;
    //     this.x = d3.time.scale()
    //     // protect against invalid data and NaN for initial
    //     // setting of domain with unary conditional
    //     .domain(self.data.length ? d3.extent(this.data, function(d) {
    //         return d[param];
    //     }) : [1, 1])
    //         .range([0, (this.width - this.marginLeft - this.marginRight)]);
    // },

    // setYDomain: function() {
    //     var param = this.yParam || 'count';
    //     var self = this;
    //     // protect against invalid data and NaN for initial
    //     // setting of domain with unary conditional
    //     this.y = d3.scale.linear()
    //         .domain([0, self.data.length ? d3.max(this.data, function(d) {
    //             return d[param];
    //         }) : 0])
    //         .range([(this.height - this.marginTop - this.marginBottom), 0]);
    // },

    // setYAxisLabel: function() {
    //     this.svg.append("text")
    //         .attr("class", "axis.label")
    //         .attr("transform", "rotate(-90)")
    //         .attr("x", 0 - (this.height / 2))
    //         .attr("y", -5)
    //         .attr("dy", "1.5em")
    //         .text(this.yAxisLabel)
    //         .style("text-anchor", "middle");
    // },

    // bindShapeToData: function(shape, binding) {
    //     this[shape] = this.chart.selectAll(shape)
    //         .data(this.data, function(d) {
    //             return binding ? d[binding] : d.time;
    //         });
    // },

    // shapeUpdate: function(shape) {
    //     var xParam = this.xParam || 'time';
    //     var yParam = this.yParam || 'count';
    //     var self = this;
    //     this[shape]
    //         .transition()
    //         .attr('cx', function(d) {
    //             return self.x(d[xParam]);
    //         })
    //         .attr('cy', function(d) {
    //             return self.y(d[yParam]);
    //         })
    //         .attr('r', 10)
    //         .attr('x', function(d) {
    //             return self.x(d[xParam]);
    //         })
    //         .attr('y', function(d) {
    //             return self.y(d[yParam]);
    //         })
    //         .attr('height', function(d) {
    //             return self.height - self.marginTop - self.marginBottom - self.y(d[yParam]);
    //         })
    //         .attr('width', (this.width - this.marginLeft - this.marginRight) / this.data.length);
    // },

    // shapeEnter: function(shape) {
    //     var xParam = this.xParam || 'time';
    //     var yParam = this.yParam || 'count';
    //     var self = this;
    //     this[shape]
    //         .enter()
    //         .append(shape)
    //         .attr("fill", this.colorArray.distinct[3][1])
    //         .style('fill-opacity', 1e-6)
    //         .attr('class', 'chart-rect')
    //         .attr('id', 'chart-rect')
    //         .attr('x', function(d) {
    //             return self.x(d[xParam]);
    //         })
    //         .attr('y', function(d) {
    //             return (self.y(d[yParam]));
    //         })
    //         .attr('height', function(d) {
    //             return self.height - self.marginTop - self.marginBottom - self.y(d[yParam]);
    //         })
    //         .attr('width', (this.width - this.marginLeft - this.marginRight) / this.data.length)
    //         .attr('cx', function(d) {
    //             return self.x(d[xParam]);
    //         })
    //         .attr('cy', function(d) {
    //             return (self.y(d[yParam]));
    //         })
    //         .attr('r', 10)
    //         .on('mouseover', function(d) {
    //             self.mouseoverAction(d);
    //         })
    //         .on('mouseout', function(d) {
    //             self.mouseoutAction(d);
    //         })
    //         .transition()
    //         .style('fill-opacity', 1);
    // },

    // mouseoverAction: function(d) {
    //     this.tip.show(d);
    // },

    // mouseoutAction: function(d) {
    //     this.tip.hide();
    // },

    // shapeExit: function(shape) {
    //     this[shape]
    //         .exit()
    //         .transition()
    //         .style('fill-opacity', 1e-6)
    //         .remove();
    // },

    // switchShape: function() {
    //     this.svgClearer(this.shape);
    //     this.shape = this.shapeArray[this.shapeCounter++ % 2];
    //     this.bindShapeToData(this.shape);
    //     this.shapeUpdate(this.shape);
    //     this.shapeEnter(this.shape);
    //     this.shapeExit(this.shape);
    // },

    // areaSetter: function() {
    //     var self = this;
    //     this.area = d3.svg.area()
    //         .interpolate("basis")
    //         .tension(0.85)
    //         .x(function(d) {
    //             return self.x(d.time);
    //         })
    //         .y0(function(d) {
    //             return self.y(0);
    //         })
    //         .y1(function(d) {
    //             return self.y(d.count);
    //         });
    // },

    // pathAdder: function(datum) {
    //     var self = this;
    //     this.chart.append("path")
    //         .datum(datum)
    //         .attr("class", "area")
    //         .attr("id", "minMaxArea")
    //         .attr("d", this.area)
    //         .attr("fill", this.colorArray.distinct[3][1])
    //         .style("opacity", 0.8);
    // },

    // svgClearer: function(attribute) {
    //     var selector = this.chart;
    //     selector.selectAll(attribute)
    //         .data([])
    //         .exit()
    //         .transition()
    //         .style("fill-opacity", 1e-6)
    //         .remove();
    // },

    // setXAxis: function() {
    //     this.xAxis = d3.svg.axis()
    //         .scale(this.x)
    //         .ticks(4)
    //     // format: day month H:M:S
    //     .tickFormat(d3.time.format("%e %b %X"))
    //         .orient("bottom");
    // },

    // setYAxis: function() {
    //     this.yAxis = d3.svg.axis()
    //         .scale(this.y)
    //         .ticks(5)
    //         .orient("left");
    // },

    // callXAxis: function() {
    //     this.svg
    //         .append('g')
    //         .attr("class", "x axis")
    //         .attr('transform', 'translate(' + (this.marginLeft) + ',' + (this.height - this.marginBottom) + ')')
    //         .call(this.xAxis);
    // },

    // callYAxis: function() {
    //     this.svg
    //         .append('g')
    //         .attr("class", "y axis")
    //         .attr('transform', 'translate(' + (this.marginLeft) + ',' + this.marginTop + ')')
    //         .call(this.yAxis);
    // },

    // resetAxes: function() {
    //     var self = this;
    //     d3.select(this.el).select('.axis.x')
    //         .transition()
    //         .call(this.xAxis.scale(self.x));

    //     self.svg.select('.axis.y')
    //         .transition()
    //         .call(this.yAxis.scale(self.y));
    // },

    // addToLegend: function(selector, legendText) {
    //     d3.select(this.el).select(selector)
    //         .attr('data-legend', legendText);
    // },

    // appendLegend: function() {
    //     this.svg.append("g")
    //         .attr("class", "legend")
    //         .attr("transform", "translate(" + this.marginLeft + ",10)")
    //         .call(d3.legend);
    // }

});
;
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

var ApiPerfReportView = GoldstoneBasePageView.extend({

    defaults: {},

    initialize: function(options) {
        ApiPerfReportView.__super__.initialize.apply(this, arguments);
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
            this.neutronApiPerfChartView.trigger('lookbackSelectorChanged');
            this.keystoneApiPerfChartView.trigger('lookbackSelectorChanged');
            this.glanceApiPerfChartView.trigger('lookbackSelectorChanged');
            this.cinderApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        var ns = this.defaults;

        //----------------------------
        // instantiate charts via
        // backbone collection / views


        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova'
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Nova API Performance"),
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: goldstone.translate("API Call"),
                value: goldstone.translate("All")
            }],
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width()
        });


        //------------------------------
        // instantiate neutron api chart

        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron'
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Neutron API Performance"),
            collection: this.neutronApiPerfChart,
            height: 300,
            infoCustom: [{
                key: goldstone.translate("API Call"),
                value: goldstone.translate("All")
            }],
            el: '#api-perf-report-r1-c2',
            width: $('#api-perf-report-r1-c2').width()
        });

        //-------------------------------
        // instantiate keystone api chart

        this.keystoneApiPerfChart = new ApiPerfCollection({
            componentParam: 'keystone'
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Keystone API Performance"),
            collection: this.keystoneApiPerfChart,
            height: 300,
            infoCustom: [{
                key: goldstone.translate("API Call"),
                value: goldstone.translate("All")
            }],
            el: '#api-perf-report-r2-c1',
            width: $('#api-perf-report-r2-c1').width()
        });

        //-----------------------------
        // instantiate glance api chart

        this.glanceApiPerfChart = new ApiPerfCollection({
            componentParam: 'glance'
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Glance API Performance"),
            collection: this.glanceApiPerfChart,
            height: 300,
            infoCustom: [{
                key: goldstone.translate("API Call"),
                value: goldstone.translate("All")
            }],
            el: '#api-perf-report-r2-c2',
            width: $('#api-perf-report-r2-c2').width()
        });

        //-----------------------------
        // instantiate cinder api chart

        this.cinderApiPerfChart = new ApiPerfCollection({
            componentParam: 'cinder'
        });

        this.cinderApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Cinder API Performance"),
            collection: this.cinderApiPerfChart,
            height: 300,
            infoCustom: [{
                key: goldstone.translate("API Call"),
                value: goldstone.translate("All")
            }],
            el: '#api-perf-report-r3-c1',
            width: $('#api-perf-report-r3-c1').width()
        });

    },

    template: _.template('' +
        '<div id="api-perf-report-r1" class="row">' +
        '<div id="api-perf-report-r1-c1" class="col-md-6"></div>' +
        '<div id="api-perf-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="api-perf-report-r2" class="row">' +
        '<div id="api-perf-report-r2-c1" class="col-md-6"></div>' +
        '<div id="api-perf-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="api-perf-report-r3" class="row">' +
        '<div id="api-perf-report-r3-c1" class="col-md-6"></div>' +
        '<div id="api-perf-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
;
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
Instantiated similar to:

this.novaApiPerfChart = new ApiPerfCollection({
    componentParam: 'nova',
});

this.novaApiPerfChartView = new ApiPerfView({
    chartTitle: "Nova API Performance",
    collection: this.novaApiPerfChart,
    height: 300,

    // for info-button text
    infoCustom: [{
        key: "API Call",
        value: "Hypervisor Show"
    }],
    el: '#api-perf-report-r1-c1',
    width: $('#api-perf-report-r1-c1').width()
});
*/

// view is linked to collection when instantiated

var ApiPerfView = GoldstoneBaseView.extend({

    specialInit: function() {
        var ns = this.defaults;
        var self = this;

        // chart info button popover generator
        this.htmlGen = function() {
            var start = moment(goldstone.time.fromPyTs(ns.start / 1000)).format();
            var end = moment(goldstone.time.fromPyTs(ns.end / 1000)).format();
            var custom = _.map(ns.infoCustom, function(e) {
                return e.key + ": " + e.value + "<br>";
            });
            var result = '<div class="infoButton"><br>' + custom +
                goldstone.translate('Start') + ': ' + start + '<br>' +
                goldstone.translate('End') + ': ' + end + '<br>' +
                goldstone.translate('Interval') + ': ' + ns.interval + '<br>' +
                '<br></div>';
            return result;
        };

        $(this.el).find('#api-perf-info').popover({
            trigger: 'manual',
            content: function() {
                return self.htmlGen.apply(this);
            },
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('toggle');
            })
            .on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('hide');
            });

    },

    processOptions: function() {
        ApiPerfView.__super__.processOptions.call(this);
        this.defaults.start = this.collection.defaults.reportParams.start || null;
        this.defaults.end = this.collection.defaults.reportParams.end || null;
        this.defaults.interval = this.collection.defaults.reportParams.interval || null;
    },

    update: function() {
        var ns = this.defaults;
        var self = this;
        var json = this.collection.toJSON();
        json = this.dataPrep(json);
        var mw = ns.mw;
        var mh = ns.mh;

        this.hideSpinner();

        if (this.checkReturnedDataSet(json) === false) {
            return;
        }

        $(this.el).find('svg').find('.chart').html('');
        $(this.el + '.d3-tip').detach();

        ns.y.domain([0, d3.max(json, function(d) {
            var key = _.keys(d).toString();
            return d[key].stats.max;
        })]);

        json.forEach(function(d) {
            // careful as using _.keys after this
            // will return [timestamp, 'time']
            d.time = moment(+_.keys(d)[0]);

            // which is why .filter is required here:
            var key = _.keys(d).filter(function(item) {
                return item !== "time";
            }).toString();
            d.min = d[key].stats.min || 0;
            d.max = d[key].stats.max || 0;
            d.avg = d[key].stats.avg || 0;
        });

        ns.x.domain(d3.extent(json, function(d) {
            return d.time;
        }));

        var area = d3.svg.area()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y0(function(d) {
                return ns.y(d.min);
            })
            .y1(function(d) {
                return ns.y(d.max);
            });

        var maxLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.max);
            });

        var minLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.min);
            });

        var avgLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.avg);
            });

        var hiddenBar = ns.chart.selectAll(this.el + ' .hiddenBar')
            .data(json);

        var hiddenBarWidth = mw / json.length;

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return "<p>" + d.time.format() + "<br>Max: " + d.max.toFixed(2) +
                    "<br>Avg: " + d.avg.toFixed(2) + "<br>Min: " + d.min.toFixed(2) + "<p>";
            });

        // Invoke the tip in the context of your visualization

        ns.chart.call(tip);

        // initialize the chart lines

        ns.chart.append("path")
            .datum(json)
            .attr("class", "area")
            .attr("id", "minMaxArea")
            .attr("d", area)
            .attr("fill", ns.colorArray.distinct[3][1])
            .style("opacity", 0.8);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'minLine')
            .attr('data-legend', "Min")
            .style("stroke", ns.colorArray.distinct[3][0])
            .datum(json)
            .attr('d', minLine);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'maxLine')
            .attr('data-legend', "Max")
            .style("stroke", ns.colorArray.distinct[3][2])
            .datum(json)
            .attr('d', maxLine);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'avgLine')
            .attr('data-legend', "Avg")
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke", ns.colorArray.grey[0][0])
            .datum(json)
            .attr('d', avgLine);

        ns.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + mh + ')')
            .call(ns.xAxis);

        ns.chart.append('g')
            .attr('class', 'y axis')
            .call(ns.yAxis);

        var legend = ns.chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20,-20)")
            .call(d3.legend);

        // UPDATE
        // Update old elements as needed.

        // ENTER
        // Create new elements as needed.

        hiddenBar.enter()
            .append('g')
            .attr("transform", function(d, i) {
                return "translate(" + i * hiddenBarWidth + ",0)";
            });

        // ENTER + UPDATE
        // Appending to the enter selection expands the update selection to include
        // entering elements; so, operations on the update selection after appending to
        // the enter selection will apply to both entering and updating nodes.

        // hidden rectangle for tooltip tethering

        hiddenBar.append("rect")
            .attr('class', 'partialHiddenBar')
            .attr("id", function(d, i) {
                return "verticalRect" + i;
            })
            .attr("y", function(d) {
                return ns.y(d.max);
            })
            .attr("height", function(d) {
                return mh - ns.y(d.max);
            })
            .attr("width", hiddenBarWidth);

        // narrow guideline turns on when mouse enters hidden bar

        hiddenBar.append("rect")
            .attr("class", "verticalGuideLine")
            .attr("id", function(d, i) {
                return "verticalGuideLine" + i;
            })
            .attr("x", 0)
            .attr("height", mh)
            .attr("width", 1)
            .style("opacity", 0);

        // wide guideline with mouse event handling to show guide and
        // tooltip.

        hiddenBar.append("rect")
            .attr('class', 'hiddenBar')
            .attr("height", mh)
            .attr("width", hiddenBarWidth)
            .on('mouseenter', function(d, i) {
                var rectId = self.el + " #verticalRect" + i,
                    guideId = self.el + " #verticalGuideLine" + i,
                    targ = d3.select(guideId).pop().pop();
                d3.select(guideId).style("opacity", 0.8);
                tip.offset([50, 0]).show(d, targ);
            })
            .on('mouseleave', function(d, i) {
                var id = self.el + " #verticalGuideLine" + i;
                d3.select(id).style("opacity", 0);
                tip.hide();
            });

        // EXIT
        // Remove old elements as needed.
    },

    template: _.template(
        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="api-perf-info"></i>' +
        '</h3></div><div class="alert alert-danger popup-message" hidden="true"></div>')

});
;

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
This view will be invoked upon initial site load, as it is
baked into router.html, but not for every backbone router view load.

After ajaxSend Listener is bound to $(document), it will be triggered on all
subsequent $.ajaxSend calls.

Uses xhr.setRequestHeader to append the Auth token on all subsequent api calls.
It also serves to handle 401 auth
errors, removing any existing token, and redirecting to the login page.

The logout icon will only be rendered in the top-right corner of the page if
there is a truthy value present in localStorage.userToken

On router.html, this view is subscribed to the gsRouter object
which will emit a trigger when a view is switched out.
*/

var LogoutIcon = GoldstoneBaseView.extend({

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();

        // prune old unused localStorage keys
        this.pruneLocalStorage();

        // if auth token present, hijack all subsequent ajax requests
        // with an auth header containing the locally stored token
        this.setAJAXSendRequestHeaderParams();

        // only render the logout button if an auth token is present
        this.makeVisibleIfTokenPresent();

        // clicking logout button > expire token via /accounts/logout
        // then clear token from localStorage and redirect to /login
        this.setLogoutButtonHandler();
    },

    pruneLocalStorage: function() {
        var temp = {};

        // localStorageKeys is defined in router.html
        if(goldstone === undefined || goldstone.localStorageKeys === undefined) {
            return;
        }

        _.each(goldstone.localStorageKeys, function(item) {
            temp[item] = localStorage.getItem(item);
        });
        localStorage.clear();
        _.each(goldstone.localStorageKeys, function(item) {
            if(temp[item] !== null) {
                localStorage.setItem(item, temp[item]);
            }
        });
    },

    // subscribed to gsRouter 'switching view' on router.html
    viewSwitchTriggered: function() {
        this.makeVisibleIfTokenPresent();
    },

    setAJAXSendRequestHeaderParams: function() {
        var self = this;

        // if there is no userToken present in localStorage, don't append the
        // request header to api calls or it will append null
        // which will create a server error

        var $doc = $(document);
        $doc.ajaxSend(function(event, xhr) {
            var authToken = localStorage.getItem('userToken');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Token " +
                    authToken);
            }
        });

        // all 401 errors will cause a deletion of existing userToken and
        // redirect to /login with the hash appened to the url
        $doc.ajaxError(function(event, xhr) {
            if (xhr.status === 401) {
                self.clearToken();
                self.redirectToLogin();
            }
        });
    },

    makeVisibleIfTokenPresent: function() {

        // only render logout icon if there is a token present
        var authToken = localStorage.getItem('userToken');
        if (authToken) {
            $('.fa-sign-out').css('visibility', 'visible');
        } else {
            $('.fa-sign-out').css('visibility', 'hidden');
        }
    },

    setLogoutButtonHandler: function() {
        var self = this;
        $('div.logout-icon-container .fa-sign-out').on('click', function() {

            // clicking logout button => submit userToken to
            // remove userToken. Upon success, remove token
            // and redirect to /login
            // if failed, raise alert and don't redirect

            $.post('/accounts/logout/')
                .done(function() {
                    goldstone.raiseSuccess('Logout Successful');
                    self.clearToken();
                    self.makeVisibleIfTokenPresent();
                    self.redirectToLogin();
                })
                .fail(function() {
                    goldstone.raiseWarning('Logout Failed');
                    self.makeVisibleIfTokenPresent();
                });
        });
    },

    clearToken: function() {
        localStorage.removeItem('userToken');
    },

    redirectToLogin: function() {
        location.href = "login/";
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<i class="fa fa-sign-out pull-right"></i>'
    )

});
;
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

var ChartHeaderView = GoldstoneBaseView2.extend({

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
;
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

var CinderReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.cinderApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
        this.cinderApiPerfChart = new ApiPerfCollection({
            componentParam: 'cinder'
        });

        this.cinderApiPerfChartView = new ApiPerfView({
            chartTitle: "Cinder API Performance",
            collection: this.cinderApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#cinder-report-r1-c1',
            width: $('#cinder-report-r1-c1').width()
        });
    },

    template: _.template('' +
        '<div id="cinder-report-r1" class="row">' +
        '<div id="cinder-report-r1-c1" class="col-md-6"></div>' +
        '</div>'
    )
});
;
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
This view makes up the "Details" tab of nodeReportView.js
It is sub-classed from GoldstoneBaseView.

Instantiated on nodeReportView as:

this.detailsReport = new DetailsReportView({
    el: '#node-report-panel #detailsReport'
});
*/

var DetailsReportView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.render();

        // node data was stored in localStorage before the
        // redirect from the discover page
        var data = JSON.parse(localStorage.getItem('detailsTabData'));
        localStorage.removeItem('detailsTabData');

        // TODO: after utilizing the stored data, clear it
        // from localStorage

        if(data){
            this.drawSingleRsrcInfoTable(data);
        } else {
            $('#details-single-rsrc-table').text(goldstone.contextTranslate('No additional details available.', 'detailsreport'));
        }
    },

    drawSingleRsrcInfoTable: function(json) {

        // make a dataTable
        var location = '#details-single-rsrc-table';
        var oTable;
        var keys = Object.keys(json);
        var data = _.map(keys, function(k) {
            if (json[k] === Object(json[k])) {
                return [k, JSON.stringify(json[k])];
            } else {
                return [k, json[k]];
            }
        });

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "autoWidth": true,
                "info": false,
                "paging": true,
                "searching": true,
                "columns": [{
                    "title": "Key"
                }, {
                    "title": "Value"
                }]
            };
            oTable = $(location).DataTable(oTableParams);
        }
    },

    render: function() {
        $(this.el).append(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="panel panel-primary node_details_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> <%=goldstone.contextTranslate(\'Resource Details\', \'detailsreport\')%>' +
        '</h3>' +
        '</div>' +
        '</div>' +

        '<div class="panel-body">' +
        '<table id="details-single-rsrc-table" class="table"></table>' +
        '</div>'
    )
});
;
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

var DiscoverView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged') {
            this.eventTimelineChartView.trigger('lookbackSelectorChanged');
            this.nodeAvailChartView.trigger('lookbackSelectorChanged');
        }

        if (change === 'lookbackIntervalReached') {
            this.eventTimelineChartView.trigger('lookbackIntervalReached');
            this.nodeAvailChartView.trigger('lookbackIntervalReached');
        }
    },

    renderCharts: function() {

        //---------------------------
        // instantiate event timeline chart

        // fetch url is set in eventTimelineCollection
        this.eventTimelineChart = new EventTimelineCollection({});

        this.eventTimelineChartView = new EventTimelineView({
            collection: this.eventTimelineChart,
            el: '#goldstone-discover-r1-c1',
            chartTitle: goldstone.translate('Event Timeline'),
            width: $('#goldstone-discover-r1-c1').width()
        });

        //---------------------------
        // instantiate Node Availability chart

        this.nodeAvailChart = new NodeAvailCollection({});

        this.nodeAvailChartView = new NodeAvailView({
            chartTitle: goldstone.translate('Node Availability'),
            collection: this.nodeAvailChart,
            el: '#goldstone-discover-r1-c2',
            h: {
                "main": 150,
                "swim": 50
            },
            width: $('#goldstone-discover-r1-c2').width()
        });


        //---------------------------
        // instantiate Cloud Topology chart
        // Style of chart depends on user pref selected in settings page

        var topoTreePref = JSON.parse(localStorage.getItem('userPrefs'));

        this.discoverTree = new ZoomablePartitionCollection({});

        if (topoTreePref && topoTreePref.topoTreeStyle &&
            topoTreePref.topoTreeStyle === 'zoom') {

            // if user prefs designate 'zoom'able style
            this.zoomableTreeView = new ZoomablePartitionView({
                blueSpinnerGif: blueSpinnerGif,
                chartHeader: ['#goldstone-discover-r2-c1', goldstone.translate('Cloud Topology'),
                    'discoverZoomTopology'
                ],
                collection: this.discoverTree,
                el: '#goldstone-discover-r2-c1',
                h: 600,
                leafDataUrls: this.leafDataUrls,
                multiRsrcViewEl: '#goldstone-discover-r2-c2',
                width: $('#goldstone-discover-r2-c1').width()
            });

        } else {

            // if user prefs designate collapsable style
            var topologyTreeView = new TopologyTreeView({
                blueSpinnerGif: blueSpinnerGif,
                collection: this.discoverTree,
                chartHeader: ['#goldstone-discover-r2-c1', goldstone.translate('Cloud Topology'),
                    'discoverCloudTopology'
                ],
                el: '#goldstone-discover-r2-c1',
                h: 600,
                leafDataUrls: this.leafDataUrls,
                multiRsrcViewEl: '#goldstone-discover-r2-c2',
                width: $('#goldstone-discover-r2-c1').width(),
            });
        }
    },

    // defined on the object to be used as common to both topo tree views above
    leafDataUrls: {
        "services-leaf": "/services",
        "endpoints-leaf": "/endpoints",
        "roles-leaf": "/roles",
        "users-leaf": "/users",
        "tenants-leaf": "/tenants",
        "agents-leaf": "/agents",
        "aggregates-leaf": "/aggregates",
        "availability-zones-leaf": "/availability_zones",
        "cloudpipes-leaf": "/cloudpipes",
        "flavors-leaf": "/flavors",
        "floating-ip-pools-leaf": "/floating_ip_pools",
        "hosts-leaf": "/hosts",
        "hypervisors-leaf": "/hypervisors",
        "networks-leaf": "/networks",
        "secgroups-leaf": "/security_groups",
        "servers-leaf": "/servers",
        "images-leaf": "/images",
        "volumes-leaf": "/volumes",
        "backups-leaf": "/backups",
        "snapshots-leaf": "/snapshots",
        "transfers-leaf": "/transfers",
        "volume-types-leaf": "/volume_types"
    },

    template: _.template('' +
        '<div id="goldstone-discover-r1" class="row">' +
        '<div id="goldstone-discover-r1-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r1-c2" class="col-md-6"></div>' +
        '</div>' +

        '<div id="goldstone-discover-r2" class="row">' +
        '<div id="goldstone-discover-r2-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r2-c2" class="col-md-6"></div>' +
        '</div>' +

        '<div id="goldstone-discover-r3" class="row"><br><br></div>'

    )

});
;
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
Instantiated on discoverView as:

var eventTimelineChart = new EventTimelineCollection({});

var eventTimelineChartView = new EventTimelineView({
    collection: eventTimelineChart,
    el: '#goldstone-discover-r1-c1',
    chartTitle: 'Event Timeline',
    width: $('#goldstone-discover-r1-c1').width()
});
*/

var EventTimelineView = GoldstoneBaseView.extend({
    defaults: {
        margin: {
            top: 25,
            bottom: 25,
            right: 20,
            left: 40
        },

        h: {
            "main": 100,
            "padding": 30,
            "tooltipPadding": 50
        }
    },

    initialize: function(options) {
        EventTimelineView.__super__.initialize.apply(this, arguments);
        this.setInfoButtonPopover();
    },

    processOptions: function() {
        this.defaults.colorArray = new GoldstoneColors().get('colorSets');
        this.el = this.options.el;
        this.defaults.chartTitle = this.options.chartTitle;
        this.defaults.width = this.options.width;
    },

    processListeners: function() {
        var self = this;

        this.listenTo(this.collection, 'sync', this.update);
        this.listenTo(this. collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            self.updateSettings();
            self.fetchNowWithReset();
        });

        this.on('lookbackIntervalReached', function() {
            self.updateSettings();
            self.fetchNowNoReset();
        });
    },

    showSpinner: function() {
        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.h.main / 2 + ns.h.padding),
                'display': ns.spinnerDisplay
            });
        });
    },

    standardInit: function() {
        var ns = this.defaults;
        var self = this;

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.h.main - ns.margin.top - ns.margin.bottom;

        ns.topAxis = d3.svg.axis()
            .orient("top")
            .ticks(3)
            .tickFormat(d3.time.format("%a %b %e %Y"));
        ns.bottomAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(5)
            .tickFormat(d3.time.format("%H:%M:%S"));
        ns.xScale = d3.time.scale()
            .range([ns.margin.left, ns.width - ns.margin.right - 10]);


        /*
         * colors
         */

        // you can change the value in colorArray to select
        // a particular number of different colors
        var colorArray = new GoldstoneColors().get('colorSets');
        ns.color = d3.scale.ordinal().range(colorArray.distinct[1]);

        /*
         * The graph and axes
         */

        ns.svg = d3.select(this.el).select(".panel-body").append("svg")
            .attr("width", ns.width + ns.margin.right)
            .attr("height", ns.h.main + (ns.h.padding + ns.h.tooltipPadding));

        // tooltipPadding adds room for tooltip popovers
        ns.graph = ns.svg.append("g").attr("id", "graph")
            .attr("transform", "translate(0," + ns.h.tooltipPadding + ")");

        ns.graph.append("g")
            .attr("class", "xUpper axis")
            .attr("transform", "translate(0," + ns.h.padding + ")");

        ns.graph.append("g")
            .attr("class", "xLower axis")
            .attr("transform", "translate(0," + ns.h.main + ")");

        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .offset(function() {
                var leftOffset;
                // [top-offset, left-offset]
                var halfToolWidth = 260;
                if (this.getBBox().x < halfToolWidth) {
                    leftOffset = halfToolWidth - this.getBBox().x;
                } else if (this.getBBox().x > ns.width - halfToolWidth) {
                    leftOffset = -(halfToolWidth - (ns.width - this.getBBox().x));
                } else {
                    leftOffset = 0;
                }
                return [0, leftOffset];
            })
            .html(function(d) {

                d.host = d.traits.host || 'No host logged';
                d.log_message = d.log_message || 'No message logged';

                if (d.log_message.length > 280) {
                    d.log_message = d.log_message.slice(0, 300) + "...";
                }
                d.doc_type = d.doc_type || 'No event type logged';
                d.timestamp = d.timestamp || 'No date logged';

                return "" +
                    "Host: " + d.host + "<br>" +
                    d.doc_type + " (click event line to persist popup info)<br>" +
                    // "uuid: " + d.id + "<br>" +
                    "Created: " + d.timestamp + "<br>";
                    // "Message: " + d.log_message + "<br>";
            });

        ns.graph.call(ns.tooltip);

    },

    lookbackRange: function() {
        var lookbackMinutes;
        lookbackMinutes = $('.global-lookback-selector .form-control').val();
        return parseInt(lookbackMinutes, 10);
    },

    updateSettings: function() {
        var ns = this.defaults;
        ns.lookbackRange = this.lookbackRange();
    },

    fetchNowWithReset: function() {
        var ns = this.defaults;
        $(this.el).find('#spinner').show();
        this.collection.urlUpdate(ns.lookbackRange);
        this.collection.fetchWithReset();
    },

    fetchNowNoReset: function() {
        var ns = this.defaults;
        $(this.el).find('#spinner').show();
        this.collection.urlUpdate(ns.lookbackRange);
        this.collection.fetchNoReset();
    },

    opacityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (filterType === d.doc_type && !ns.filter[filterType].active) {
                return 0;
            }
        }
        return 0.8;
    },

    visibilityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (filterType === d.doc_type && !ns.filter[filterType].active) {
                return "hidden";
            }
        }
        return "visible";
    },

    update: function() {
        var ns = this.defaults;
        var self = this;

        this.hideSpinner();

        var allthelogs = (this.collection.toJSON());

        var xEnd = moment(d3.min(_.map(allthelogs, function(evt) {
            return evt.timestamp;
        })));

        var xStart = moment(d3.max(_.map(allthelogs, function(evt) {
            return evt.timestamp;
        })));

        ns.xScale = ns.xScale.domain([xEnd._d, xStart._d]);

        // If we didn't receive any valid files, append "No Data Returned"
        this.checkReturnedDataSet(allthelogs);

        /*
         * Shape the dataset
         *   - Convert datetimes to integer
         *   - Sort by last seen (from most to least recent)
         */
        ns.dataset = allthelogs
            .map(function(d) {
                d.timestamp = moment(d.timestamp)._d;
                return d;
            });


        // compile an array of the unique event types
        ns.uniqueEventTypes = _.uniq(_.map(allthelogs, function(item) {
            return item.doc_type;
        }));

        // populate ns.filter based on the array of unique event types
        // add uniqueEventTypes to filter modal
        ns.filter = ns.filter || {};

        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(ns.uniqueEventTypes, function(item) {

            // regEx to create separate words out of the event types
            // GenericSyslogError --> Generic Syslog Error
            var re = /([A-Z])/g;
            if (item === undefined) {
                item = 'UnspecifiedErrorType';
            }
            itemSpaced = item.replace(re, ' $1').trim();

            ns.filter[item] = ns.filter[item] || {
                active: true,
                color: ns.color(ns.uniqueEventTypes.indexOf(item) % ns.color.range().length),
                displayName: itemSpaced
            };

            var addCheckIfActive = function(item) {
                if (ns.filter[item].active) {
                    return 'checked';
                } else {
                    return '';
                }
            };
            var checkMark = addCheckIfActive(item);

            $(this.el).find('#populateEventFilters')
                .append(
                    '<div class="row">' +
                    '<div class="col-lg-12">' +
                    '<div class="input-group">' +
                    '<span class="input-group-addon"' +
                    'style="opacity: 0.8; background-color:' + ns.filter[item].color + ';">' +
                    '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                    '</span>' +
                    '<span type="text" class="form-control">' + itemSpaced + '</span>' +
                    '</div>' +
                    '</div>' +
                    '</div>'
            );
        }, this);

        $(this.el).find('#populateEventFilters :checkbox').on('click', function() {

            var checkboxId = this.id;
            ns.filter[this.id].active = !ns.filter[this.id].active;
            self.redraw();

        });

        /*
         * Axes
         *   - calculate the new domain.
         *   - adjust each axis to its new scale.
         */

        ns.topAxis.scale(ns.xScale);
        ns.bottomAxis.scale(ns.xScale);

        ns.svg.select(".xUpper.axis")
            .transition()
            .call(ns.topAxis);

        ns.svg.select(".xLower.axis")
            .transition()
            .call(ns.bottomAxis);

        /*
         * New rectangles appear at the far right hand side of the graph.
         */

        var rectangle = ns.graph.selectAll("rect")

            // bind data to d3 nodes and create uniqueness based on
            // th.timestamparam. This could possibly create some
            // issues due to duplication of a supposedly unique
            // param, but has not yet been a problem in practice.
            .data(ns.dataset, function(d) {
                return d.timestamp;
            });

        // enters at wider width and transitions to lesser width for a
        // dynamic resizing effect
        rectangle.enter()
            .append("rect")
            .attr("x", ns.width)
            .attr("y", ns.h.padding + 1)
            .attr("width", 5)
            .attr("height", ns.h.main - ns.h.padding - 2)
            .attr("class", "single-event")
            .style("opacity", function(d) {
                return self.opacityByFilter(d);
            })
            .style("visibility", function(d) {
                // to avoid showing popovers for hidden lines
                return self.visibilityByFilter(d);
            })
            .attr("fill", function(d) {
                return ns.color(ns.uniqueEventTypes.indexOf(d.doc_type) % ns.color.range().length);
            })
            .on("mouseover", ns.tooltip.show)
            .on("click", function() {
                if (ns.tooltip.pause === undefined) {
                    ns.tooltip.pause = true;
                } else {
                    ns.tooltip.pause = !ns.tooltip.pause;
                }
                if (ns.tooltip.pause === false) {
                    ns.tooltip.hide();
                }
            })
            .on("mouseout", function() {
                if (ns.tooltip.pause) {
                    return;
                }
                ns.tooltip.hide();
            });

        rectangle
            .transition()
            .attr("width", 2)
            .attr("x", function(d) {
                return ns.xScale(d.timestamp);
            });

        rectangle.exit().remove();

        return true;
    },

    redraw: function() {
        var ns = this.defaults;
        var self = this;

        ns.graph.selectAll("rect")
            .transition().duration(500)
            .attr("x", function(d) {
                return ns.xScale(d.timestamp);
            })
            .style("opacity", function(d) {
                return self.opacityByFilter(d);
            })
            .style("visibility", function(d) {
                // to avoid showing popovers for hidden lines
                return self.visibilityByFilter(d);
            });
    },

    render: function() {
        this.$el.html(this.template());

        // commented out, as the settings are determined by the
        // global lookback selector
        // $('#modal-container-' + this.el.slice(1)).append(this.eventSettingModal());

        // append the modal that is triggered by
        // clicking the filter icon
        $('#modal-container-' + this.el.slice(1)).append(this.eventFilterModal());

        // standard Backbone convention is to return this
        return this;
    },

    setInfoButtonPopover: function() {

        var infoButtonText = new InfoButtonText().get('infoText');
        var htmlGen = function() {
            var result = infoButtonText.eventTimeline;
            return result;
        };
        // attach click listeners to chart heading info button
        $('#goldstone-event-info').popover({
            trigger: 'manual',
            content: htmlGen.apply(this),
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('toggle');
            }).on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('hide');
            });
    },

    template: _.template(
        '<div id = "goldstone-event-panel" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +

        // cog icon
        // '<i class="fa fa-cog pull-right" data-toggle="modal"' +
        // 'data-target="#modal-settings-<%= this.el.slice(1) %>' +
        // '"></i>' +

        // filter icon
        '<i class="fa fa-filter pull-right" data-toggle="modal"' +
        'data-target="#modal-filter-<%= this.el.slice(1) %>' + '" style="margin-right: 15px;"></i>' +

        // info-circle icon
        '<i class="fa fa-info-circle panel-info pull-right "  id="goldstone-event-info"' +
        'style="margin-right: 15px;"></i>' +
        '</h3></div>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="panel-body" style="height:<%= (this.defaults.h.padding * 2) %>' +
        'px">' +
        '<div id="event-filterer" class="btn-group pull-left" data-toggle="buttons" align="center">' +
        '</div>' +
        '</div>' +
        '<div class="panel-body" style="height:<%= this.defaults.h.main %>' + 'px">' +
        '<div id="goldstone-event-chart">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div id="modal-container-<%= this.el.slice(1) %>' +
        '"></div>'

    ),

    eventFilterModal: _.template(
        // event filter modal
        '<div class="modal fade" id="modal-filter-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +

        '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
        '<h4 class="modal-title" id="myModalLabel"><%=goldstone.translate(\'Event Type Filters\')%></h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5><%=goldstone.translate(\'Uncheck event-type to hide from display\')%></h5><br>' +
        '<div id="populateEventFilters"></div>' +


        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal"><%=goldstone.contextTranslate(\'Exit\', \'eventtimeline\')%></button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    ),

    eventSettingModal: _.template(
        // event settings modal
        // don't render if using global refresh/lookback
        '<div class="modal fade" id="modal-settings-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title" id="myModalLabel">Chart Range Settings</h4>' +
        '</div>' +
        '<div class="modal-body">' +

        // insert start/end form elements:

        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="lookbackRange" class="col-sm-2 control-label">Lookback: </label>' +
        '<div class="col-sm-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="lookbackRange">' +
        '<option value="15">15 minutes</option>' +
        '<option value="60" selected>1 hour</option>' +
        '<option value="360">6 hours</option>' +
        '<option value="1440">1 day</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +

        // end of new start/end elements

        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="eventAutoRefresh" class="col-sm-2 control-label">Refresh: </label>' +
        '<div class="col-sm-5">' +
        '<div class="input-group">' +
        '<span class="input-group-addon">' +
        '<input type="checkbox" class="eventAutoRefresh" checked>' +
        '</span>' +
        '<select class="form-control" id="eventAutoRefreshInterval">' +
        '<option value="5">5 seconds</option>' +
        '<option value="15">15 seconds</option>' +
        '<option value="30" selected>30 seconds</option>' +
        '<option value="60">1 minute</option>' +
        '<option value="300">5 minutes</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<div class="form-group">' +
        '<button type="button" id="eventSettingsUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal">Update</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )
});
;
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
the jQuery dataTables plugin is documented at
http://datatables.net/reference/api/

instantiated on eventsBrowserPageView as:

    this.eventsBrowserTable = new EventsBrowserDataTableView({
        el: '.events-browser-table',
        chartTitle: 'Events Browser',
        infoIcon: 'fa-table',
        width: $('.events-browser-table').width()
    });

*/

var EventsBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        EventsBrowserDataTableView.__super__.instanceSpecificInit.apply(this, arguments);
        this.drawSearchTable('#reports-result-table', this.collection.toJSON());
    },

    update: function() {
        this.drawSearchTable('#reports-result-table', this.collection.toJSON());
    },

    preprocess: function(data) {

        /*
        strip object down to _id, _type, timestamp, and things in 'traits'
        and then flatten object before returning it to the dataPrep function
        */

        var self = this;
        var result = [];

        // strip away all but _id, _type, timestamp, and things in traits
        _.each(data, function(item) {
            var tempObj = {};
            tempObj.id = item.id;
            tempObj.type = item.doc_type;
            tempObj.timestamp = item.timestamp;
            tempObj.traits = item.traits;
            tempObj.user_name = item.user_name;
            tempObj.user_type = item.user_type;
            tempObj.tenant_name = item.tenant_name;
            tempObj.tenant_type = item.tenant_type;
            tempObj.instance_name = item.instance_name;
            tempObj.instance_type = item.instance_type;

            result.push(tempObj);
        });

        // replace original data with stripped down dataset
        data = result;

        // reset result array
        result = [];

        // un-nest (flatten) objects
        _.each(data, function(item) {
            result.push(self.flattenObj(item));
        });

        // return flattened/stripped array of objects
        return result;
    },

    // keys will be pinned in ascending value order of key:value pair
    headingsToPin: {
        'timestamp': 0,
        'type': 1,
        'id': 2,
        'user_name': 3,
        'user_type': 4,
        'tenant_name': 5,
        'tenant_type': 6,
        'instance_name': 7,
        'instance_type': 8
    }
});
;
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

var EventsBrowserPageView = GoldstoneBasePageView2.extend({

    renderCharts: function() {

        this.eventsBrowserVizCollection = new EventsHistogramCollection({});

        this.eventsBrowserView = new ChartSet({
            chartTitle: goldstone.contextTranslate('Events vs Time', 'eventsbrowser'),
            collection: this.eventsBrowserVizCollection,
            el: '#events-histogram-visualization',
            infoIcon: 'fa-tasks',
            width: $('#events-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Number of Events', 'eventsbrowser')
        });

        this.eventsBrowserTableCollection = new EventsBrowserTableCollection({});

        this.eventsBrowserTable = new EventsBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Events Browser', 'eventsbrowser'),
            collection: this.eventsBrowserTableCollection,
            el: '#events-browser-table',
            infoIcon: 'fa-table',
            infoText: 'hide',
            width: $('#events-browser-table').width()
        });

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.eventsBrowserVizCollection, this.eventsBrowserView, this.eventsBrowserTableCollection, this.eventsBrowserTable];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.eventsBrowserView.trigger('lookbackSelectorChanged');
            this.eventsBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    template: _.template('' +

        '<div class="row">' +
        '<div id="events-histogram-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="events-browser-table" class="col-md-12"></div>' +
        '</div>'
    )

});
;
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
This view makes up the "Events" tab of nodeReportView.js
It is sub-classed from GoldstoneBaseView.

Much of the functionality is encompassed by the jQuery
dataTables plugin which is documented at
http://datatables.net/reference/api/

Instantiated on nodeReportView as:

this.eventsReport = new EventsReportView({
    el: '#node-report-panel #eventsReport',
    width: $('#node-report-panel #eventsReport').width(),
    nodeName: hostName,
    globalLookback: ns.globalLookback
});
*/

var EventsReportView = GoldstoneBaseView.extend({

    // initialize empty 'defaults' object that will be used as a container
    // for shared values amongst local functions
    defaults: {},

    urlGen: function() {

        // urlGen is instantiated inside the beforeSend AJAX hook
        // which means it is run again before every dataTables server query

        var now = +new Date();
        // subtracts correct ms from current time
        var lookback = now - (1000 * 60 * this.defaults.globalLookback);

        var urlRouteConstruction = '/logging/events/search/?host=' +
            this.defaults.hostName +
            '&@timestamp__range={"gte":' + lookback + ',"lte":' + now + '}';

        // makes a route similar to:
        // /logging/events/search/?host=rsrc-01&@timestamp__range={"gte":1426019353333,"lte":1427245753333}

        // this will be added by the dataTables beforeSend section:
        // &page_size=10&page=1&log_message__regexp=.*blah.*

        this.defaults.url = urlRouteConstruction;
    },

    initialize: function(options) {

        EventsReportView.__super__.initialize.apply(this, arguments);
    },

    processOptions: function() {
        EventsReportView.__super__.processOptions.apply(this, arguments);

        this.defaults.hostName = this.options.nodeName;
        this.defaults.globalLookback = this.options.globalLookback;
    },

    processListeners: function() {
        // this is triggered by a listener set on nodeReportView.js
        this.on('lookbackSelectorChanged', function() {

            // set the lookback based on the global selector
            this.defaults.globalLookback = $('#global-lookback-range').val();

            // trigger a redraw of the table
            $('#events-report-table').dataTable().fnDraw();
        });
    },

    processMargins: function() {
        // overwritten so as not to conflict with super-class'
        // method that will calculate irrelevant margins.
        return null;
    },

    standardInit: function() {
        // overwritten so as not to conflict with super-class'
        // method that will calculate irrelevant margins.
        return null;
    },

    dataPrep: function(data) {
        var ns = this.defaults;
        var self = this;

        // initial result is stringified JSON
        var tableData = JSON.parse(data);

        var finalResults = [];

        _.each(tableData.results, function(item) {

            // if any field is undefined, dataTables throws an alert
            // so set to empty string if otherwise undefined
            item['@timestamp'] = item['@timestamp'] || '';
            item.event_type = item.event_type || '';
            item.log_message = item.log_message || '';
            item.syslog_severity = item.syslog_severity || '';
            item.host = item.host || '';
            item.syslog_facility = item.syslog_facility || '';

            finalResults.push([item['@timestamp'], item.event_type, item.log_message, item.syslog_severity, item.host, item.syslog_facility]);
        });

        // total/filtered/result feeds the dataTables
        // item count at the bottom of the table
        return {
            recordsTotal: tableData.count,
            recordsFiltered: tableData.count,
            result: finalResults
        };
    },

    drawSearchTable: function(location) {

        var ns = this.defaults;
        var self = this;

        this.hideSpinner();

        var oTable;

        // Params documented at http://datatables.net/reference/option/
        var oTableParams = {
            "info": true,
            "processing": true,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "order": [
                [0, 'desc']
            ],
            "ordering": true,
            "serverSide": true,
            "ajax": {
                beforeSend: function(obj, settings) {

                    // warning: as dataTable features are enabled/
                    // disabled , check if the structure of settings.
                    // url changes significantly. Be sure to
                    // reference the correct array indices when
                    // comparing, or scraping data

                    self.urlGen();

                    var pageSize = $(self.el).find('select.form-control').val();
                    var searchQuery = $(self.el).find('input.form-control').val();
                    var paginationStart = settings.url.match(/start=\d{1,}&/gi);
                    paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
                    var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                    var urlColumnOrdering = decodeURIComponent(settings.url).match(/order\[0\]\[column\]=\d*/gi);

                    // capture which column was clicked
                    // and which direction the sort is called for

                    var urlOrderingDirection = decodeURIComponent(settings.url).match(/order\[0\]\[dir\]=(asc|desc)/gi);
                    settings.url = self.defaults.url + "&page_size=" + pageSize + "&page=" + computeStartPage;

                    if (searchQuery) {
                        settings.url = settings.url + "&log_message__regexp=.*" + searchQuery +
                            ".*";
                    }

                    // if no interesting sort, ignore it
                    if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

                        // or, if something has changed, capture the
                        // column to sort by, and the sort direction

                        var columnLabelHash = {
                            0: '@timestamp',
                            1: 'event_type',
                            2: 'log_message'
                        };

                        var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

                        var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

                        var ascDec;
                        if (orderByDirection === 'asc') {
                            ascDec = '';
                        } else {
                            ascDec = '-';
                        }

                        // TODO: uncomment when ordering is in place.
                        // settings.url = settings.url + "&ordering=" +
                        //     ascDec + columnLabelHash[orderByColumn];
                    }


                },
                dataFilter: function(data) {

                    /* dataFilter is analagous to the purpose of ajax 'success',
                    but you can't also use 'success' as then dataFilter
                    will not be triggered */

                    // spinner rendered upon page-load
                    // will be cleared after the first
                    // data payload is returned
                    self.hideSpinner();

                    // clear any error messages when data begins to flow again
                    self.clearDataErrorMessage();

                    // runs result through this.dataPrep
                    var result = self.dataPrep(data);

                    // dataTables expects JSON encoded result
                    return JSON.stringify(result);
                },
                error: function(error) {
                    // append error message to '.popup-message'
                    self.dataErrorMessage(null, error);
                },
                // tells dataTable to look for 'result' param of result object
                dataSrc: "result"
            },
            "columnDefs": [{
                "name": "created",
                "type": "date",
                "targets": 0,
                "render": function(data, type, full, meta) {
                    return moment(data).format();
                }
            }, {
                "name": "event_type",
                "targets": 1
            }, {
                "name": "message",
                "targets": 2
            }, {
                "name": "syslog_severity",
                "targets": 3
            }, {
                "name": "host",
                "targets": 4
            }, {
                "name": "syslog_facility",
                "targets": 5
            }, {
                "visible": false,
                "targets": [3, 4, 5]
            }]
        };

        // instantiate dataTable
        oTable = $(location).DataTable(oTableParams);
    },

    render: function() {
        $(this.el).append(this.template());
        this.drawSearchTable('#events-report-table');
        return this;
    },

    template: _.template(

        '<div class="row">' +
        '<div id="table-col" class="col-md-12">' +
        '<div class="panel panel-primary log_table_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> <%=goldstone.contextTranslate(\'Events Report\', \'eventsreport\')%>' +
        '</h3>' +
        '</div>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div id="node-event-data-table" class="panel-body">' +
        '<table id="events-report-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header">' +
        '<th>Created</th>' +
        '<th>Event Type</th>' +
        '<th>Message</th>' +
        '</tr>' +
        '</thead>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>')
});
;
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
var GlanceReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.glanceApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
        this.glanceApiPerfChart = new ApiPerfCollection({
            componentParam: 'glance'
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: "Glance API Performance",
            collection: this.glanceApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#glance-report-r1-c1',
            width: $('#glance-report-r1-c1').width()
        });
    },

    template: _.template('' +
        '<div id="glance-report-r1" class="row">' +
        '<div id="glance-report-r1-c1" class="col-md-6"></div>' +
        '</div>'
    )
});
;
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
            return '<option value="30">' + goldstone.translate('refresh 30s') + '</option>' +
                '<option value="60">' + goldstone.translate('refresh 1m') + '</option>' +
                '<option value="300">' + goldstone.translate('refresh 5m') + '</option>' +
                '<option value="-1">' + goldstone.translate('refresh off') + '</option>';
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
;
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

var HelpView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="row">' +
        '<div class="col-md-12">' +
        '<h3><%=goldstone.translate("Getting Help")%></h3>' +
        '<%=goldstone.translate("If you would like to contact Solinea regarding issues, feature requests, or other Goldstone related feedback, check out the <a href=\'https://groups.google.com/forum/#!forum/goldstone-users\' target=\'_blank\'>goldstone-users forum</a>, or <a href=\'https://github.com/Solinea/goldstone-server/issues\' target=\'_blank\'> file an issue on Github</a>. For general inquiries or to contact our consulting services team, email <a href=\'mailto:info@solinea.com\'>info@solinea.com</a>.")%>' +

        '<h3><%=goldstone.translate("License")%></h3>' +
        '<%=goldstone.translate("Goldstone license information can be found in the file <b>/opt/goldstone/LICENSE</b> or on the web at <a href=\'https://www.apache.org/licenses/LICENSE-2.0\'>https://www.apache.org/licenses/LICENSE-2.0</a>.")%>' +
        '</div>' +
        '</div>'
    )

});
;
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

var HypervisorView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 10,
            right: 10,
            bottom: 18,
            left: 25
        }
    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.el = options.el;
        this.defaults.width = options.width;
        this.defaults.axisLabel = options.axisLabel;

        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', this.update, this);

        this.on('lookbackSelectorChanged', function() {
            self.collection.fetch();
        });

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.width * 2 - ns.margin.top - ns.margin.bottom;

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        var colorArray = new GoldstoneColors().get('colorSets');
        ns.color = d3.scale.ordinal().range(colorArray.distinct[5]);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.mw + ns.margin.left + ns.margin.right)
            .attr("height", ns.mh + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // tooltip:
        // [top-offset, left-offset]
        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-5, 0])
            .html(function(d) {
                d.name = d.name || 'No name reported';
                d.cores = d.y1 - d.y0 || 'No core count reported';

                return "vm: " + d.name + "<br>" +
                    d.cores + " " + ns.axisLabel;
            });

        ns.svg.call(ns.tooltip);

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(this.el).css({
                'position': 'relative',
                'margin-top': -(ns.mh / 2),
                'display': ns.spinnerDisplay

            });
        });

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

        var allthelogs = this.collection.toJSON();

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0) {

            // if 'no data returned' already exists on page, don't reapply it
            if ($(this.el).find('#noDataReturned').length) {
                return;
            }

            $('<span id="noDataReturned"><br>No<br>Data<br>Returned</span>').appendTo(this.el)
                .css({
                    'position': 'relative',
                    'margin-left': $(this.el).width() / 2 - 14,
                    'top': -$(this.el).height() / 2
                });
            return;
        }

        // remove No Data Returned once data starts flowing again
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }

        var data = allthelogs;

        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "date";
        }));

        data.forEach(function(d) {
            var y0 = 0;
            d.cores = ns.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });
            d.total = d.cores[d.cores.length - 1].y1;
        });

        data.sort(function(a, b) {
            return b.total - a.total;
        });

        ns.x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        ns.svg.selectAll('rect')
            .remove();

        ns.svg.selectAll("g").remove();

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(0)")
            .attr("x", 4)
            .attr("y", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "beginning")
            .text("Total " + ns.axisLabel + ": " + ns.y.domain()[1]);

        var vmCore = ns.svg.selectAll(".vmCore")
            .data(data)
            .enter().append("g")
            .attr("class", "g");

        vmCore.selectAll("rect")
            .data(function(d) {
                return d.cores;
            })
            .enter().append("rect")
            .style("fill", "#f5f5f5")
            .attr("width", ns.mw)
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .on("mouseover", ns.tooltip.show)
            .on("mouseout", function() {
                ns.tooltip.hide();
            })
            .transition()
            .style("fill", function(d) {
                if (d.name === "available") {
                    return 'none';
                }
                return ns.color(d.name);
            })
            .style("opacity", 0.8);

        var legend = ns.svg.selectAll(".legend")
            .data(data);

        legend
            .enter().append("g")
            .attr("class", "legend");

        legend.text('');

        legend.append("text")
            .attr("x", ns.mw / 2)
            .attr("y", ns.mh + 12)
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return moment(d.date).calendar();
            });

    }

});
;
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

var HypervisorVmCpuView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 25,
            right: 70,
            bottom: 18,
            left: 25
        }
    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.el = options.el;
        this.defaults.width = options.width;

        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', this.update, this);

        this.on('lookbackSelectorChanged', function(){
        });

        this.render();

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = (ns.width * 0.84) - ns.margin.top - ns.margin.bottom;

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        var colorArray = new GoldstoneColors().get('colorSets');
        ns.color = d3.scale.ordinal().range(colorArray.distinct[5]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(5);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.line = d3.svg.line()
            .interpolate("monotone")
            .x(function(d) {
                return ns.x(d.date);
            })
            .y(function(d) {
                return ns.y(d.utilValue);
            });

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.mw + ns.margin.left + ns.margin.right)
            .attr("height", ns.mh + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-top': -(ns.mh / 2),
                'margin-left': (ns.mw / 2),
                'display': ns.spinnerDisplay
            });
        });

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

        var allthelogs = this.collection.toJSON();

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0) {

            // if 'no data returned' already exists on page, don't reapply it
            if ($(this.el).find('#noDataReturned').length) {
                return;
            }

            $('<span id="noDataReturned"><br>No<br>Data<br>Returned</span>').appendTo(this.el)
                .css({
                    'position': 'relative',
                    'margin-left': $(this.el).width() / 2 - 14,
                    'top': -$(this.el).height() / 2
                });
            return;
        }

        // remove No Data Returned once data starts flowing again
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }

        ns.data = allthelogs;

        ns.color.domain(d3.keys(ns.data[0][ns.selectedButton][0]).filter(function(key) {
            return key !== "date";
        }));

        ns.vms = ns.color.domain().map(function(name) {
            return {
                name: name,
                values: ns.data.map(function(d) {
                    return {
                        date: d.date,
                        utilValue: d[ns.selectedButton][0][name]
                    };
                })
            };
        });

        ns.x.domain(d3.extent(ns.data, function(d) {
            return d.date;
        }));

        ns.y.domain([0, 100]);

        ns.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("x", 3)
            .attr("y", -6)
            .attr("dy", ".71em")
            .style("text-anchor", "beginning")
            .text("percent utilization (%)");

        ns.vm = ns.svg.selectAll(".vm")
            .data(ns.vms)
            .enter().append("g")
            .attr("class", "vm");

        ns.vm.append("path")
            .attr("class", "line")
            .attr("d", function(d) {
                return ns.line(d.values);
            })
            .style("stroke", function(d) {
                return ns.color(d.name);
            })
            .style("stroke-width", "2px")
            .style("opacity", 0.8);

        ns.vm.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.value.date) + "," + ns.y(d.value.utilValue) + ")";
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.name;
            });

    },

    refresh: function() {
        var ns = this.defaults;
        var self = this;

        if (ns.data === undefined) {
            return;
        }

        ns.vms = ns.color.domain().map(function(name) {
            return {
                name: name,
                values: ns.data.map(function(d) {
                    return {
                        date: d.date,
                        utilValue: d[ns.selectedButton][0][name]
                    };
                })
            };
        });

        ns.x.domain(d3.extent(ns.data, function(d) {
            return d.date;
        }));

        ns.vm.remove();

        ns.vm = ns.svg.selectAll(".vm")
            .data(ns.vms)
            .enter().append("g")
            .attr("class", "vm");

        ns.vm.append("path")
            .attr("class", "line")
            .attr("d", function(d) {
                return ns.line(d.values);
            })
            .style("stroke", function(d) {
                return ns.color(d.name);
            })
            .style("stroke-width", "2px");

        ns.vm.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.value.date) + "," + ns.y(d.value.utilValue) + ")";
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.name;
            });

    },

    appendButtons: function() {

        var ns = this.defaults;
        var self = this;

        $(this.el).find("#data-filterer")
            .append("<div class='btn-group pull-left'>" +
                "<div class='btn-group'>" +
                "<button type='button' class='btn btn-default btn-sm active'>User</button>" +
                "<button type='button' class='btn btn-default btn-sm'>System</button>" +
                "<button type='button' class='btn btn-default btn-sm'>Wait</button>" +
                "</div></div>"
        );

        $(self.el).find("button").click(function() {
            $("button.active").toggleClass("active");
            $(this).toggleClass("active");
            var buttonPressed = ($(this).context.innerText);
            self.defaults.selectedButton = buttonPressed.toLowerCase();
            self.refresh();
        });

        ns.selectedButton = 'user';

    },

    template: _.template('<div id="data-filterer"></div>'),

    render: function(){
        $(this.el).append(this.template());
        this.appendButtons();
        return this;
    }
});
;
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

var KeystoneReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.keystoneApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
        this.keystoneApiPerfChart = new ApiPerfCollection({
            componentParam: 'keystone'
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: "Keystone API Performance",
            collection: this.keystoneApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#keystone-report-r1-c1',
            width: $('#keystone-report-r1-c1').width()
        });

    },

    template: _.template('' +
        '<div id="keystone-report-r1" class="row">' +
        '<div id="keystone-report-r1-c1" class="col-md-6"></div>' +
        '<div id="keystone-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="keystone-report-r2" class="row">' +
        '<div id="keystone-report-r2-c1" class="col-md-6"></div>' +
        '</div>'
    )

});
;
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
openstack syslog severity levels:
0       EMERGENCY: system is unusable
1       ALERT: action must be taken immediately
2       CRITICAL: critical conditions
3       ERROR: error conditions
4       WARNING: warning conditions
5       NOTICE: normal but significant condition
6       INFO: informational messages
7       DEBUG: debug-level messages
/*

/* instantiated in logSearchPageView.js as:

    this.logAnalysisCollection = new LogAnalysisCollection({});

    this.logAnalysisView = new LogAnalysisView({
        collection: this.logAnalysisCollection,
        width: $('.log-analysis-container').width(),
        height: 300,
        el: '.log-analysis-container',
        featureSet: 'logEvents',
        chartTitle: 'Log Analysis',
        urlRoot: "/logging/summarize/?",

    });
*/

// extends UtilizationCpuView
var LogAnalysisView = UtilizationCpuView.extend({
    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 35,
            left: 63
        },

        // populated dynamically by
        // returned levels param of data
        // in this.collectionPrep
        // and will look something like this:

        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in ns.filter


        filter: {
            emergency: true,
            alert: true,
            critical: true,
            error: true,
            warning: true,
            notice: true,
            info: true,
            debug: true
        },

        refreshCount: 2,

        // will prevent updating when zoom is active
        isZoomed: false

    },

    processOptions: function() {

        LogAnalysisView.__super__.processOptions.apply(this, arguments);

        var self = this;
        var ns = this.defaults;
        ns.yAxisLabel = goldstone.contextTranslate('Log Events', 'loganalysis');
        ns.urlRoot = this.options.urlRoot;

        // specificHost will only be passed in if instantiated on a node
        // report page. If null, will be ignored in this.constructUrl
        // and this.urlGen
        ns.specificHost = this.options.specificHost || null;
    },

    processMargins: function() {
        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;
    },

    constructUrl: function() {
        var self = this;
        var ns = this.defaults;

        var seconds = (ns.end - ns.start) / 1000;
        var interval = Math.max(1, Math.floor((seconds / (ns.width / 10))));

        this.collection.url = ns.urlRoot;
        if (ns.specificHost) {
            this.collection.url += 'host=' + ns.specificHost + '&';
        }
        this.collection.url += 'per_host=False&@timestamp__range={' +
            '"gte":' + ns.start + ',"lte":' + ns.end + '}&interval=' + interval + 's';
    },

    startEndToGlobalLookback: function() {
        var self = this;
        var ns = this.defaults;

        var globalLookback = $('#global-lookback-range').val();

        ns.end = +new Date();
        ns.start = ns.end - (globalLookback * 60 * 1000);
    },

    triggerSearchTable: function() {

        this.drawSearchTable('#log-search-table', this.defaults.start, this.defaults.end);
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            self.update();
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackIntervalReached', function(params) {

            if (ns.isZoomed === true) {
                return;
            }

            ns.start = params[0];
            ns.end = params[1];

            $(this.el).find('#spinner').show();
            this.constructUrl();
            this.collection.fetchWithRemoval();

        });

        this.on('lookbackSelectorChanged', function(params) {
            $(this.el).find('#spinner').show();
            ns.isZoomed = false;
            ns.start = params[0];
            ns.end = params[1];
            this.constructUrl();
            this.collection.fetchWithRemoval();
        });
    },

    standardInit: function() {
        LogAnalysisView.__super__.standardInit.apply(this, arguments);

        var ns = this.defaults;

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(7);

        this.startEndToGlobalLookback();
        this.triggerSearchTable();
        this.constructUrl();
        this.collection.fetchWithRemoval();

    },

    specialInit: function() {
        var ns = this.defaults;
        var self = this;

        // ZOOM IN
        this.$el.find('.fa-search-plus').on('click', function() {
            self.paintNewChart([ns.width, 0], 4);
        });

        // ZOOM IN MORE
        this.$el.find('.fa-forward').on('click', function() {
            self.paintNewChart([ns.width, 0], 12);
        });

        // ZOOM OUT
        this.$el.find('.fa-search-minus').on('click', function() {
            self.paintNewChart([ns.width * 0.7, 0], 0.45);
        });

        // ZOOM OUT MORE
        this.$el.find('.fa-backward').on('click', function() {
            self.paintNewChart([ns.width * 0.7, 0], 0.25);
        });
    },

    paintNewChart: function(coordinates, mult) {
        var ns = this.defaults;
        var self = this;

        $(this.el).find('#spinner').show();
        ns.isZoomed = true;
        $('.global-refresh-selector select').val(-1);

        var zoomedStart;
        var zoomedEnd;

        var leftMarginX = 64;
        var rightMarginX = 42;

        var adjustedClick = Math.max(0, Math.min(coordinates[0] - leftMarginX, (ns.width - leftMarginX - rightMarginX)));

        var fullDomain = [+ns.x.domain()[0], +ns.x.domain()[1]];

        var domainDiff = fullDomain[1] - fullDomain[0];

        var clickSpot = +ns.x.invert(adjustedClick);

        var zoomMult = mult || 4;

        zoomedStart = Math.floor(clickSpot - (domainDiff / zoomMult));
        zoomedEnd = Math.floor(clickSpot + (domainDiff / zoomMult));

        ns.start = zoomedStart;
        ns.end = Math.min(+new Date(), zoomedEnd);

        if (ns.end - ns.start < 2000) {
            ns.start -= 1000;
            ns.end += 1000;
        }

        this.constructUrl();

        this.collection.fetchWithRemoval();
        return null;
    },

    dblclicked: function(coordinates) {
        this.paintNewChart(coordinates);
    },

    collectionPrep: function() {

        var ns = this.defaults;
        var self = this;

        // this.collection.toJSON() returns an object
        // with keys: timestamps, levels, data.
        var collectionDataPayload = this.collection.toJSON()[0];

        // We will store the levels for the loglevel
        // construction and add it back in before returning
        var logLevels = collectionDataPayload.levels;

        // if ns.filter isn't defined yet, only do
        // this once
        if (ns.filter === null) {
            ns.filter = {};
            _.each(logLevels, function(item) {
                ns.filter[item] = true;
            });
        }

        // we use only the 'data' for the construction of the chart
        var data = collectionDataPayload.data;

        // prepare empty array to return at end
        finalData = [];

        // 3 layers of nested _.each calls
        // the first one iterates through each object
        // in the 'data' array as 'item':
        // {
        //     "1426640040000": [
        //         {
        //             "audit": 7
        //         },
        //         {
        //             "info": 0
        //         },
        //         {
        //             "warning": 0
        //         }
        //     ]
        // }

        // the next _.each iterates through the array of
        // nested objects that are keyed to the timestamp
        // as 'subItem'
        // [
        //     {
        //         "audit": 7
        //     },
        //     {
        //         "info": 0
        //     },
        //     {
        //         "warning": 0
        //     }
        // ]

        // and finally, the last _.each iterates through
        // the most deeply nested objects as 'subSubItem'
        // such as:
        //  {
        //      "audit": 7
        //  }

        _.each(data, function(item) {

            var tempObject = {};

            _.each(item, function(subItem) {
                _.each(subItem, function(subSubItem) {

                    // each key/value pair of the subSubItems is added to tempObject
                    var key = _.keys(subSubItem)[0];
                    var value = _.values(subSubItem)[0];
                    tempObject[key] = value;
                });
            });

            // and then after tempObject is populated
            // it is standardized for chart consumption
            // by making sure to add '0' for unreported
            // values, and adding the timestamp

            _.each(ns.filter, function(item, i) {
                tempObject[i] = tempObject[i] || 0;
            });
            tempObject.date = _.keys(item)[0];

            // which is the equivalent of doing this:

            // tempObject.debug = tempObject.debug || 0;
            // tempObject.audit = tempObject.audit || 0;
            // tempObject.info = tempObject.info || 0;
            // tempObject.warning = tempObject.warning || 0;
            // tempObject.error = tempObject.error || 0;
            // tempObject.date = _.keys(item)[0];

            // and the final array is built up of these
            // individual objects for the viz
            finalData.push(tempObject);

        });

        // and finally return the massaged data and the
        // levels to the superclass 'update' function
        return {
            finalData: finalData,
            logLevels: logLevels
        };

    },

    sums: function(datum) {
        var ns = this.defaults;

        // Return the sums for the filters that are on
        return d3.sum(ns.color.domain().map(function(k) {

            if (ns.filter[k]) {
                return datum[k];
            } else {
                return 0;
            }
        }));
    },

    update: function() {
        LogAnalysisView.__super__.update.apply(this, arguments);

        this.hideSpinner();

        var ns = this.defaults;
        var self = this;

        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in ns.filter

        // populate the modal based on the event types.
        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(_.keys(ns.filter), function(item) {

            if (item === 'none') {
                return null;
            }

            var addCheckIfActive = function(item) {
                if (ns.filter[item]) {
                    return 'checked';
                } else {
                    return '';
                }
            };

            var checkMark = addCheckIfActive(item);

            $(self.el).find('#populateEventFilters').
            append(

                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div class="input-group">' +
                '<span class="input-group-addon"' +
                'style="opacity: 0.8; background-color:' + ns.loglevel([item]) + '">' +
                '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                '</span>' +
                '<span type="text" class="form-control">' + item + '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        $(this.el).find('#populateEventFilters :checkbox').on('click', function() {
            var checkboxId = this.id;
            ns.filter[checkboxId] = !ns.filter[checkboxId];
            self.update();
        });

        // eliminates the immediate re-rendering of search table
        // upon initial chart instantiation
        this.refreshSearchTableAfterOnce();
        this.redraw();

    },

    refreshSearchTableAfterOnce: function() {
        var ns = this.defaults;
        var self = this;
        if (--ns.refreshCount < 1) {
            self.refreshSearchTable();
        }
    },

    searchDataErrorMessage: function(message, errorMessage, location) {

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        if (errorMessage !== undefined) {
            message = errorMessage.responseText;
            message = '' + errorMessage.status + ' error: ' + message;
        }

        // calling raiseAlert with the 3rd param will supress auto-hiding
        // goldstone.raiseAlert($(location), message, true);
        goldstone.raiseAlert($(location), message, true);

    },

    clearSearchDataErrorMessage: function(location) {
        // if error message already exists on page,
        // remove it in case it has changed
        if ($(location).length) {
            $(location).fadeOut("slow");
        }
    },

    urlGen: function() {
        var ns = this.defaults;
        var self = this;

        var uri = '/logging/search/?';

        if (ns.specificHost) {
            uri += 'host=' + ns.specificHost + '&';
        }

        uri += '@timestamp__range={"gte":' +
            ns.start +
            ',"lte":' +
            ns.end +
            '}&syslog_severity__terms=[';

        levels = ns.filter || {};
        for (var k in levels) {
            if (levels[k]) {
                uri = uri.concat('"', k.toUpperCase(), '",');
            }
        }
        uri += "]";

        uri = uri.slice(0, uri.indexOf(',]'));
        uri += "]";

        this.defaults.url = uri;

        /*
        makes a url such as:
        /logging/search/?@timestamp__range={%22gte%22:1426981050017,%22lte%22:1426984650017}&loglevel__terms=[%22EMERGENCY%22,%22ALERT%22,%22CRITICAL%22,%22ERROR%22,%22WARNING%22,%22NOTICE%22,%22INFO%22,%22DEBUG%22]
        with "&host=node-01" added in if this is a node report page
        */
    },

    dataPrep: function(data) {
        var ns = this.defaults;
        var self = this;

        data = JSON.parse(data);
        _.each(data.results, function(item) {

            // if any field is undefined, dataTables throws an alert
            // so set to empty string if otherwise undefined
            item['@timestamp'] = item['@timestamp'] || '';
            item.syslog_severity = item.syslog_severity || '';
            item.component = item.component || '';
            item.log_message = item.log_message || '';
            item.host = item.host || '';
        });

        return {
            recordsTotal: data.count,
            recordsFiltered: data.count,
            result: data.results
        };
    },

    refreshSearchTable: function() {
        var ns = this.defaults;
        var self = this;

        var oTable;

        if ($.fn.dataTable.isDataTable("#log-search-table")) {
            oTable = $("#log-search-table").DataTable();
            // oTable.ajax.url(uri);
            oTable.ajax.reload();
        }
    },

    drawSearchTable: function(location, start, end) {
        var self = this;
        var ns = this.defaults;

        $("#log-table-loading-indicator").show();

        var oTable;

        var uri = this.urlGen(start, end);

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            // oTable.ajax.url(uri);
            // oTable.ajax.reload();
        } else {
            var oTableParams = {
                "info": true,
                "bAutoWidth": false,
                "autoWidth": true,
                "processing": true,
                "lengthChange": true,
                "paging": true,
                "searching": true,
                "ordering": true,
                "order": [
                    [0, 'desc']
                ],
                "serverSide": true,
                "ajax": {
                    beforeSend: function(obj, settings) {

                        // the url generated by urlGen will be available
                        // as this.defaults.url
                        self.urlGen();

                        // the pageSize and searchQuery are jQuery values
                        var pageSize = $('div#intel-search-data-table').find('select.form-control').val();
                        var searchQuery = $('div#intel-search-data-table').find('input.form-control').val();

                        // the paginationStart is taken from the dataTables
                        // generated serverSide query string that will be
                        // replaced by this.defaults.url after the required
                        // components are parsed out of it
                        var paginationStart = settings.url.match(/start=\d{1,}&/gi);
                        paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
                        var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                        var urlColumnOrdering = decodeURIComponent(settings.url).match(/order\[0\]\[column\]=\d*/gi);

                        // capture which column was clicked
                        // and which direction the sort is called for

                        var urlOrderingDirection = decodeURIComponent(settings.url).match(/order\[0\]\[dir\]=(asc|desc)/gi);

                        // the url that will be fetched is now about to be
                        // replaced with the urlGen'd url before adding on
                        // the parsed components
                        settings.url = self.defaults.url + "&page_size=" + pageSize +
                            "&page=" + computeStartPage;

                        // here begins the combiation of additional params
                        // to construct the final url for the dataTable fetch
                        if (searchQuery) {
                            settings.url += "&_all__regexp=.*" +
                                searchQuery + ".*";
                        }

                        // if no interesting sort, ignore it
                        if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

                            // or, if something has changed, capture the
                            // column to sort by, and the sort direction

                            var columnLabelHash = {
                                0: '@timestamp',
                                1: 'syslog_severity',
                                2: 'component',
                                3: 'host',
                                4: 'log_message'
                            };

                            var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

                            var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

                            var ascDec;
                            if (orderByDirection === 'asc') {
                                ascDec = '';
                            } else {
                                ascDec = '-';
                            }

                            // TODO: uncomment when ordering is in place.
                            // settings.url = settings.url + "&ordering=" +
                            //     ascDec + columnLabelHash[orderByColumn];
                        }
                    },
                    dataFilter: function(data) {

                        /* dataFilter is analagous to the purpose of ajax 'success',
                        but you can't also use 'success' as then dataFilter
                        will not be triggered */

                        // clear any error messages when data begins to flow again
                        self.clearSearchDataErrorMessage('.search-popup-message');

                        var result = self.dataPrep(data);

                        // dataTables expects JSON encoded result
                        // return result;
                        return JSON.stringify(result);

                    },
                    error: function(data) {
                        self.searchDataErrorMessage(null, data, '.search-popup-message');
                    },
                    dataSrc: "result"
                },
                "columnDefs": [{
                    "data": "@timestamp",
                    "type": "date",
                    "targets": 0,
                    "render": function(data, type, full, meta) {
                        return moment(data).format();
                    }
                }, {
                    "data": "syslog_severity",
                    "targets": 1
                }, {
                    "data": "component",
                    "targets": 2
                }, {
                    "data": "host",
                    "targets": 3
                }, {
                    "data": "log_message",
                    "targets": 4
                }]
            };
            oTable = $(location).DataTable(oTableParams);
        }
        $("#log-table-loading-indicator").hide();
    },

    redraw: function() {

        var ns = this.defaults;
        var self = this;

        ns.y.domain([
            0,
            d3.max(ns.data.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(this.el).select('.x.axis')
            .transition()
            .duration(500)
            .call(ns.xAxis.scale(ns.x));

        d3.select(this.el).select('.y.axis')
            .transition()
            .duration(500)
            .call(ns.yAxis.scale(ns.y));

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
        $(this.el).find('.special-icon-pre').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 15px;"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-forward pull-right" style="margin: 0 4px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-plus pull-right" style="margin: 0 5px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-minus pull-right" style="margin: 0 20px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-backward pull-right" style="margin: 0 5px 0 0"></i>');
        this.$el.append(this.modal2());
        return this;
    }

});
;
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
The intelligence/search page is composed of a LogAnalysisView on top, contained
within this LogSearchPageView. The global lookback/refresh listeners are listenTo()'d
from this view, and with the triggerChange function, kick off responding
processes in the LogAnalysisView that is instantiated from within this view.

instantiated in goldstoneRouter as
    new LogSearchPageView({
        el: ".launcher-container"
    });
*/

var LogSearchPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        this.computeLookback();
        var ns = this.defaults;

        // Pass the start/end params. Must be an array.
        this.logAnalysisView.trigger(change, [ns.start, ns.end]);
    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listenTo on global selectors
        // important: use obj.listenTo(obj, change, callback);
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();

            // also triggers 'lookbackSelectorChanged' in order to reset
            // chart view after changing refresh interval
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
    },

    render: function() {
        this.$el.html(this.template());

        $('.log-analysis-container').append(new ChartHeaderView({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logsearchpage'),
            infoText: 'searchLogAnalysis',
            infoIcon: 'fa-dashboard'
        }).el);

        return this;
    },

    computeLookback: function() {
        var ns = this.defaults;
        ns.end = +new Date();
        ns.start = ns.end - (ns.globalLookback * 60 * 1000);
    },

    renderCharts: function() {
        var self = this;
        this.computeLookback();
        var ns = this.defaults;

        // specificHost applies to this chart when instantiated
        // on a node report page to scope it to that node
        this.defaults.specificHost = this.options.specificHost || '';
        this.logAnalysisCollection = new LogAnalysisCollection({});

        this.logAnalysisView = new LogAnalysisView({
            collection: this.logAnalysisCollection,
            width: $('.log-analysis-container').width(),
            height: 300,
            el: '.log-analysis-container',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            urlRoot: "/logging/summarize/?",
            specificHost: ns.specificHost
        });
    },

    template: _.template('' +

        // container for new prototype d3 log chart
        '<div class="log-analysis-container"></div>' +

        // dataTable searchResults table
        '<div class="search-results-container"></div>' +

        '<div class="row">' +
        '<div id="table-col" class="col-md-12">' +
        '<div class="panel panel-primary log_table_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i>' +
        ' <%=goldstone.contextTranslate(\'Search Results\', \'logsearchpage\')%>' +
        '</h3>' +
        '</div>' +

        '<div class="alert alert-danger search-popup-message" hidden="true"></div>' +
        '<div id="intel-search-data-table" class="panel-body">' +
        '<table id="log-search-table" class="table table-hover">' +

        '<!-- table rows filled by draw_search_table -->' +

        '<thead>' +
        '<tr class="header">' +
        '<th><%=goldstone.contextTranslate(\'Timestamp\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Syslog Severity\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Component\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Host\', \'logsearchpage\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Message\', \'logsearchpage\')%></th>' +
        '</tr>' +
        '</thead>' +
        '</table>' +
        '<img src="<%=blueSpinnerGif%>" ' +
        'id="log-table-loading-indicator" class="ajax-loader"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
;
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

var LoginPageView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.checkForRememberedUsername();
        this.addHandlers();
    },

    checkForRememberedUsername: function() {

        // if user last logged in without box checked, this will be null
        var rememberedUsername = localStorage.getItem('rem');

        // if value exists
        if (rememberedUsername !== null && rememberedUsername !== undefined) {

            // pre-check remember me checkbox
            document.getElementById('chk1').checked = true;

            // and fill in decrypted username
            var username = atob(rememberedUsername);
            document.getElementsByName('username')[0].value = username;
        }

    },

    checkForInstalledApps: function() {
        $.ajax({
            type: 'get',
            url: '/addons/'
        }).done(function(success) {
            localStorage.setItem('addons', JSON.stringify(success));

            // triggers view in addonMenuView.js
            goldstone.addonMenuView.trigger('installedAppsUpdated');
        }).fail(function(fail) {
            console.log(goldstone.translate("Failed to initialize installed addons"));

            // triggers view in addonMenuView.js
            goldstone.addonMenuView.trigger('installedAppsUpdated');
        });
    },

    addHandlers: function() {
        var self = this;

        // sets auth token with each xhr request.
        // remove this if returning to SPA architecture with one main template

        var $doc = $(document);
        $doc.ajaxSend(function(event, xhr) {
            var authToken = localStorage.getItem('userToken');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Token " +
                    authToken);
            }
        });

        $('.login-form').on('submit', function(e) {
            e.preventDefault();
            self.trimInputField('[name="username"]');
            self.submitRequest($(this).serialize());
        });
    },

    trimInputField: function(selector) {
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/login/', input, function() {})
            .done(function(success) {

                // store the auth token
                self.storeUsernameIfChecked();
                self.storeAuthToken(success.auth_token);

                // must follow storing token otherwise call will fail with 401
                self.checkForInstalledApps();
                self.redirectPostSuccessfulAuth();
            })
            .fail(function(fail) {
                // and add a failure message to the top of the screen
                goldstone.raiseInfo("Username / Password combo failed. Please try again");
            });
    },

    storeUsernameIfChecked: function() {

        // is the 'remember me' checkbox checked?
        var rememberMeChecked = document.getElementById('chk1').checked;

        if (rememberMeChecked) {

            // grab and escape the username from the form
            var username = _.escape(document.getElementsByName('username')[0].value);

            // encrypt to base-64 (not secure, obsurred to casual glance)
            var hashedUsername = btoa(username);
            localStorage.setItem('rem', hashedUsername);
        } else {
            // otherwise remove the stored hash
            localStorage.removeItem('rem');
        }
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
    },

    redirectPostSuccessfulAuth: function() {
        location.href = '/';
    }

});
;
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
Instantiated in metricViewerView similar to:

this.metricChart = new MetricViewCollection({
    url: url
});

this.metricChartView = new MetricView({
    collection: this.metricChart,
    height: 320,
    el: '.metric-chart-instance' + this.options.instance,
    width: $('.metric-chart-instance' + this.options.instance).width()
});
*/

// view is linked to collection when instantiated

var MetricView = ApiPerfView.extend({

    defaults: {
        margin: {
            top: 40,
            right: 15,
            bottom: 30,
            left: 60
        }
    },

    processOptions: function() {
        this.defaults.chartTitle = this.options.chartTitle || null;
        this.defaults.height = this.options.height || null;
        this.defaults.infoCustom = this.options.infoCustom || null;
        this.el = this.options.el;
        this.defaults.width = this.options.width || null;
        if (this.options.yAxisLabel) {
            this.defaults.yAxisLabel = this.options.yAxisLabel;
        } else {
            this.defaults.yAxisLabel = "Response Time (s)";
        }
        this.defaults.start = this.collection.reportParams.start || null;
        this.defaults.end = this.collection.reportParams.end || null;
        this.defaults.interval = this.collection.reportParams.interval || null;
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var ns = this.defaults;
        var self = this;

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        ns.chart = ns.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + ns.margin.left + "," + (ns.margin.top + 10) + ")");

        ns.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        ns.x = d3.time.scale()
            .rangeRound([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        // initialize the axes
        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .ticks(5)
            .orient("bottom");

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.colorArray = new GoldstoneColors().get('colorSets');
    },

    update: function() {
        var ns = this.defaults;
        var self = this;
        var data = this.collection.toJSON()[0];
        json = this.dataPrep(data.per_interval);
        ns.statToChart = this.collection.statistic || 'band';
        ns.standardDev = this.collection.standardDev || 0;
        var mw = ns.mw;
        var mh = ns.mh;

        this.hideSpinner();
        $(this.el).find('text').remove();
        $(this.el).find('svg').find('.chart').html('');
        // prevents 'stuck' d3-tip on svg element.
        $('body').find('#' + this.el.slice(1) + '.d3-tip').remove();

        if (this.checkReturnedDataSet(json) === false) {
            return;
        }

        // append y axis label
        ns.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (ns.height / 2))
            .attr("y", -11)
            .attr("dy", "1.5em")
        // returned by metric api call
        .text(data.units[0])
            .style("text-anchor", "middle");

        ns.y.domain([0, d3.max(json, function(d) {
            var key = _.keys(d).toString();

            if (ns.standardDev === 1) {
                // add 10% breathing room to y axis domain
                return d[key].stats.std_deviation_bounds.upper * 1.1;
            } else {
                // add 10% breathing room to y axis domain
                return d[key].stats.max * 1.1;
            }
        })]);

        json.forEach(function(d) {
            // careful as using _.keys after this
            // will return [timestamp, 'time']
            d.time = moment(+_.keys(d)[0]);

            // which is why .filter is required here:
            var key = _.keys(d).filter(function(item) {
                return item !== "time";
            }).toString();
            d.min = d[key].stats.min || 0;
            d.max = d[key].stats.max || 0;
            d.avg = d[key].stats.avg || 0;
            d.stdHigh = d[key].stats.std_deviation_bounds.upper || 0;
            d.stdLow = d[key].stats.std_deviation_bounds.lower || 0;
        });

        ns.x.domain(d3.extent(json, function(d) {
            return d.time;
        }));

        var area = d3.svg.area()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y0(function(d) {
                return ns.y(d.min);
            })
            .y1(function(d) {
                return ns.y(d.max);
            });

        var maxLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.max);
            });

        var minLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.min);
            });

        var avgLine = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.avg);
            });

        var stdHigh = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.stdHigh);
            });

        var stdLow = d3.svg.line()
            .interpolate("basis")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.stdLow);
            });

        var hiddenBar = ns.chart.selectAll(this.el + ' .hiddenBar')
            .data(json);

        var hiddenBarWidth = mw / json.length;

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return "<p>" + d.time.format() + "<br>Max: " + d.max.toFixed(2) +
                    "<br>Avg: " + d.avg.toFixed(2) + "<br>Min: " + d.min.toFixed(2) + "<p>";
            });

        // Invoke the tip in the context of your visualization

        ns.chart.call(tip);

        // initialize the chart lines

        if (ns.statToChart === 'band') {
            ns.chart.append("path")
                .datum(json)
                .attr("class", "area")
                .attr("id", "minMaxArea")
                .attr("d", area)
                .attr("fill", ns.colorArray.distinct[3][1]);
        }

        if (ns.statToChart === 'band' || ns.statToChart === 'min') {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'minLine')
                .attr('data-legend', "Min")
                .style("stroke", ns.colorArray.distinct[3][0])
                .datum(json)
                .attr('d', minLine);
        }

        if (ns.statToChart === 'band' || ns.statToChart === 'max') {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'maxLine')
                .attr('data-legend', "Max")
                .style("stroke", ns.colorArray.distinct[3][2])
                .datum(json)
                .attr('d', maxLine);
        }

        if (ns.statToChart === 'band' || ns.statToChart === 'avg') {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'avgLine')
                .attr('data-legend', "Avg")
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke", ns.colorArray.grey[0][0])
                .datum(json)
                .attr('d', avgLine);
        }

        if (ns.standardDev) {

            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'stdDevHigh')
                .attr('data-legend', "Std Dev High")
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke", ns.colorArray.distinct[4][1])
                .datum(json)
                .attr('d', stdHigh);

            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'stdDevLow')
                .attr('data-legend', "Std Dev Low")
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke", ns.colorArray.distinct[4][1])
                .datum(json)
                .attr('d', stdLow);
        }

        ns.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + mh + ')')
            .call(ns.xAxis);

        ns.chart.append('g')
            .attr('class', 'y axis')
            .call(ns.yAxis);

        var legend = ns.chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20,-38)")
            .call(d3.legend);

        // UPDATE
        // Update old elements as needed.

        // ENTER
        // Create new elements as needed.

        hiddenBar.enter()
            .append('g')
            .attr("transform", function(d, i) {
                return "translate(" + i * hiddenBarWidth + ",0)";
            });

        // ENTER + UPDATE
        // Appending to the enter selection expands the update selection to include
        // entering elements; so, operations on the update selection after appending to
        // the enter selection will apply to both entering and updating nodes.

        // hidden rectangle for tooltip tethering

        hiddenBar.append("rect")
            .attr('class', 'partialHiddenBar')
            .attr("id", function(d, i) {
                return "verticalRect" + i;
            })
            .attr("y", function(d) {
                return ns.y(d.max);
            })
            .attr("height", function(d) {
                return mh - ns.y(d.max);
            })
            .attr("width", hiddenBarWidth);

        // narrow guideline turns on when mouse enters hidden bar

        hiddenBar.append("rect")
            .attr("class", "verticalGuideLine")
            .attr("id", function(d, i) {
                return "verticalGuideLine" + i;
            })
            .attr("x", 0)
            .attr("height", mh)
            .attr("width", 1)
            .style("opacity", 0);

        // wide guideline with mouse event handling to show guide and
        // tooltip.

        hiddenBar.append("rect")
            .attr('class', 'hiddenBar')
            .attr("height", mh)
            .attr("width", hiddenBarWidth)
            .on('mouseenter', function(d, i) {
                var rectId = self.el + " #verticalRect" + i,
                    guideId = self.el + " #verticalGuideLine" + i,
                    targ = d3.select(guideId).pop().pop();
                d3.select(guideId).style("opacity", 0.8);
                tip.offset([50, 0]).show(d, targ);
            })
            .on('mouseleave', function(d, i) {
                var id = self.el + " #verticalGuideLine" + i;
                d3.select(id).style("opacity", 0);
                tip.hide();
            });
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>')

});
;
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

The nesting of this page is:

| MetricViewerPageView
|__ MetricViewerView
|____ MetricView + MetricViewCollection

At the moment /#metric will default to 6 charts.
/metric/1 will show 1 chart
/metric/2 will show 2 charts
/metric/3 will show 3 charts
...etc, up to a maximum of 6 charts.
*/

var MetricViewerPageView = GoldstoneBasePageView.extend({

    initialize: function(options) {

        // hide global lookback selector
        $("select#global-lookback-range").hide();

        // options.numCharts passed in by goldstoneRouter
        // and reflects the number n (1-6) following "/#metric/n"
        this.numCharts = options.numCharts;

        // model to hold views of chart grids
        this.metricViewGridContainer = new Backbone.Model({
            grid: {
                view: {}
            }
        });

        // instantiate initialize in GoldstoneBasePageView
        MetricViewerPageView.__super__.initialize.apply(this, arguments);
    },

    onClose: function() {
        // clear out grid of collections/views
        this.metricViewGridContainer.clear();

        // return global lookback selector to page
        $("select#global-lookback-range").show();

        MetricViewerPageView.__super__.onClose.apply(this, arguments);
    },

    renderCharts: function() {

        // defined in initialize
        var num = this.numCharts;

        var locationHash = {
            0: '#goldstone-metric-r1-c1',
            1: '#goldstone-metric-r1-c2',
            2: '#goldstone-metric-r1-c3',
            3: '#goldstone-metric-r2-c1',
            4: '#goldstone-metric-r2-c2',
            5: '#goldstone-metric-r2-c3'
        };

        //---------------------------------------------
        // instantiate as many metricViews as requested

        // Backbone getter:
        var grid = this.metricViewGridContainer.get('grid');

        for (var i = 0; i < num; i++) {

            // underscore method for producing unique integer
            var id = _.uniqueId();

            grid.view[id] = new MetricViewerView({
                width: $(locationHash[i]).width(),
                height: 360,
                // passing the instance allows for unique
                // identification of charts and elements
                instance: id
            });

            $(locationHash[i]).append(grid.view[id].el);
        }
    },

    triggerChange: function(change) {
        // upon lookbackIntervalReached, trigger all views
        // so they can be refreshed via metricViewerView
        if (change === 'lookbackIntervalReached') {
            var grid = this.metricViewGridContainer.get('grid').view;

            // trigger each chart currently in the grid that the refresh
            // interval has been reached
            _.each(grid, function(view) {
                view.trigger('globalLookbackReached');
            });
        }
    },

    template: _.template('' +
        '<div id="goldstone-metric-r1" class="row">' +
        '<div id="goldstone-metric-r1-c1" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c2" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r1-c3" class="col-md-4"></div>' +
        '</div>' +
        '<div id="goldstone-metric-r2" class="row">' +
        '<div id="goldstone-metric-r2-c1" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r2-c2" class="col-md-4"></div>' +
        '<div id="goldstone-metric-r2-c3" class="col-md-4"></div>' +
        '</div>'
    )

});
;
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
instance variable added to options hash in order to
create a custom binding between each metricViewerChart
and the associated modal menus

Instantiated on metricViewerPageView as:

this.metricViewerChartView = new MetricViewerView({
        width: $('#goldstone-metric-r1-c1').width(),
        height: $('#goldstone-metric-r1-c1').width(),
        instance: xxx
});

*/

var MetricViewerView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options;
        this.processListeners();
        this.render();
        this.chartOptions = new Backbone.Model({});
        this.getMetricNames();
        this.getResourceNames();
    },

    getResourceNames: function() {
        var ns = this.defaults;
        var self = this;

        // 'host_name' will be extracted from the returned array of host objects
        $.get("/nova/hosts/", function() {})
            .done(function(data) {
                if (data === undefined || data.length === 0) {
                    $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-text').text(' ' + goldstone.contextTranslate('No resources returned', 'metricviewer'));
                } else {
                    ns.resourceNames = data[0];
                    self.populateResources();
                }
            })
            .fail(function() {
                $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-text').text(' Resource name fetch failed');
            });
    },

    getMetricNames: function() {
        var ns = this.defaults;
        var self = this;

        $.get("/core/metric_names/", function() {})
            .done(function(data) {
                data = data.per_name;
                if (data === undefined || data.length === 0) {
                    $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-text').text(' ' + goldstone.contextTranslate('No metric reports available', 'metricviewer'));
                } else {
                    ns.metricNames = data;
                    self.populateMetrics();
                }
            })
            .fail(function() {
                $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-text').text(' ' + goldstone.contextTranslate('Metric report list fetch failed', 'metricviewer'));
            })
            .always(function() {
                self.attachModalTriggers();
            });
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.listenTo(this, 'globalLookbackReached', function() {
            if (this.metricChart) {
                this.appendChart();
            }
        });
    },

    attachModalTriggers: function() {
        var self = this;

        // attach listener to the modal submit button
        $('#gear-modal-content' + this.options.instance).find('.modal-submit').on('click', function() {

            // on submit --> update the chartOptions Model
            self.setChartOptions('#gear-modal-content' + self.options.instance);

            // and append the metric name and resource to the chart header
            $('span.metric-viewer-title' + self.options.instance).text(goldstone.contextTranslate('Metric', 'metricviewer') + ': ' +
                self.chartOptions.get('metric') +
                '.' + goldstone.contextTranslate('Resource', 'metricviewer') + ': ' +
                self.chartOptions.get('resource'));
        });

        // chartOptions will be stored as a Backbone Model
        // and will be listenTo'd for changes which can
        // trigger the rendering of a new chart
        this.listenTo(this.chartOptions, 'change', function() {
            this.appendChart();
        });
    },

    setChartOptions: function(menu) {

        // if these options change, a 'change' event will
        // be emitted by the Backbone Model and picked up
        // by the listener in this.attachModalTriggers
        // otherwise it will be ignored
        this.chartOptions.set({
            'metric': $(menu).find('.metric-dropdown-options').val(),
            'resource': $(menu).find('.resource-dropdown-options').val(),
            'statistic': $(menu).find('.statistic-dropdown-options').val(),
            'standardDev': $(menu).find('.standard-dev:checked').length,
            // if lookback is left blank, default to 1
            'lookbackValue': $(menu).find('.modal-lookback-value').val() || 1,
            'lookbackUnit': $(menu).find('.lookback-dropdown-options').val(),
            // if lookback is left blank, default to 1
            'intervalValue': $(menu).find('.modal-interval-value').val() || 1,
            'intervalUnit': $(menu).find('.interval-dropdown-options').val()
        });
    },

    populateMetrics: function() {
        var self = this;
        var ns = this.defaults;

        // clear the 'loading' text next to the dropdown
        $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-text').text('');

        // append the options within the dropdown
        _.each(ns.metricNames, function(item) {
            $('#gear-modal-content' + self.options.instance).find('.metric-dropdown-options').append('<option>' + _.keys(item)[0] + "</option>");
        });
    },

    populateResources: function() {
        var self = this;
        var ns = this.defaults;

        // clear the 'loading' text next to the dropdown
        $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-text').text('');

        // host names will be similar to: ctrl-01.c2.oak.solinea.com
        // so slice from the beginning up to the first '.'
        var resourceNames = _.uniq(_.map(ns.resourceNames, function(item) {
            return (item.host_name).slice(0, item.host_name.indexOf('.'));
        }));

        // add 'all' to the beginning of the array of resources which will
        // be appended as the first drop-down option
        resourceNames.unshift('all');

        // append the options within the dropdown
        _.each(resourceNames, function(item) {
            $('#gear-modal-content' + self.options.instance).find('.resource-dropdown-options').append('<option value="' + item + '">' + item + "</option>");
        });
    },

    constructUrlFromParams: function() {
        // chartOptions is a backbone Model instantiated in initialize:
        var options = this.chartOptions.attributes;

        var url = '/core/metrics/summarize/?name=' +
            options.metric + '&@timestamp__range={"gte":' +
            (+new Date() - (options.lookbackValue * options.lookbackUnit * 1000)) +
            '}&interval=' +
            options.intervalValue +
            options.intervalUnit;
        if (options.resource !== 'all') {
            url += '&node=' + options.resource;
        }
        return url;

        /*
            constructs a url similar to:
            /core/metrics/summarize/?name=os.cpu.user
            &@timestamp__range={'gte':1429649259172}&interval=1m
        */

    },

    appendChart: function() {

        var url = this.constructUrlFromParams();
        // if there is already a chart populating this div:
        if (this.metricChart) {
            this.metricChart.url = url;
            this.metricChart.statistic = this.chartOptions.get('statistic');
            this.metricChart.standardDev = this.chartOptions.get('standardDev');
            $(this.metricChartView.el).find('#spinner').show();
            this.metricChart.fetchWithReset();
        } else {
            this.metricChart = new MetricViewCollection({
                statistic: this.chartOptions.get('statistic'),
                url: url,
                standardDev: this.chartOptions.get('standardDev')
            });
            this.metricChartView = new MetricView({
                collection: this.metricChart,
                height: 320,
                el: '.metric-chart-instance' + this.options.instance,
                width: $('.metric-chart-instance' + this.options.instance).width()
            });
        }
    },

    render: function() {
        this.$el.html(this.template());
        var self = this;
        return this;
    },

    template: _.template(

        //-----------------------
        // START MODAL FORMATTING

        '<div class="modal fade" id="modal-filter-<%= this.options.instance %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div id="gear-modal-content<%= this.options.instance %>">' +

        '<div class="modal-header">' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Select chart parameters\', \'metricviewer\')%></h4>' +
        '</div>' + // end modal-header

        '<div class="modal-body">' +
        '<h5><%=goldstone.contextTranslate(\'Metric\', \'metricviewer\')%></h5>' +
        '<select class="metric-dropdown-options">' +
        // options will be populated by populateMetrics()
        '</select>' +

        // loading text will be removed when options are populated
        '<span class="metric-dropdown-text"> Loading...</span>' +

        // loading text will be removed when options are populated
        '<h5><%=goldstone.contextTranslate(\'Resource\', \'metricviewer\')%></h5>' +
        '<select class="resource-dropdown-options">' +
        // options will be populated by populateMetrics()
        '</select>' +
        '<span class="resource-dropdown-text"> Loading...</span>' +

        '<h5><%=goldstone.contextTranslate(\'Statistic\', \'metricviewer\')%></h5>' +
        '<select class="statistic-dropdown-options">' +
        '<option value="band" selected><%=goldstone.contextTranslate(\'band\', \'metricviewer\')%></option>' +
        '<option value="min"><%=goldstone.contextTranslate(\'min\', \'metricviewer\')%></option>' +
        '<option value="max"><%=goldstone.contextTranslate(\'max\', \'metricviewer\')%></option>' +
        '<option value="avg"><%=goldstone.contextTranslate(\'avg\', \'metricviewer\')%></option>' +
        '</select>' +

        '<h5><%=goldstone.translate(\'Standard Deviation Bands\')%> <input class="standard-dev" type="checkbox"></h5>' +

        // ES can handle s/m/h/d in the "interval" param
        '<h5><%=goldstone.contextTranslate(\'Lookback\', \'metricviewer\')%></h5>' +
        '<input class="modal-lookback-value" placeholder="<%=goldstone.contextTranslate(\'default=1\', \'metricviewer\')%>" required="required">' + ' ' +
        '<select class="lookback-dropdown-options">' +
        '<option value="1"><%=goldstone.contextTranslate(\'seconds\', \'metricviewer\')%></option>' +
        '<option value="60"><%=goldstone.contextTranslate(\'minutes\', \'metricviewer\')%></option>' +
        '<option value="3600" selected><%=goldstone.contextTranslate(\'hours\', \'metricviewer\')%></option>' +
        '<option value="86400"><%=goldstone.contextTranslate(\'days\', \'metricviewer\')%></option>' +
        '</select>' +

        // ES can handle s/m/h/d in the "interval" param
        '<h5><%=goldstone.contextTranslate(\'Charting Interval\', \'metricviewer\')%></h5>' +
        '<input class="modal-interval-value" placeholder="<%=goldstone.contextTranslate(\'default=1\', \'metricviewer\')%>" required="required">' + ' ' +
        '<select class="interval-dropdown-options">' +
        '<option value="s"><%=goldstone.contextTranslate(\'seconds\', \'metricviewer\')%></option>' +
        '<option value="m" selected><%=goldstone.contextTranslate(\'minutes\', \'metricviewer\')%></option>' +
        '<option value="h"><%=goldstone.contextTranslate(\'hours\', \'metricviewer\')%></option>' +
        '<option value="d"><%=goldstone.contextTranslate(\'days\', \'metricviewer\')%></option>' +
        '</select>' +

        '</div>' + // end modal-body

        '<div class="modal-footer">' +
        '<button data-dismiss="modal" class="pull-left btn btn-primary modal-submit"><%=goldstone.contextTranslate(\'Submit\', \'metricviewer\')%></button> ' +
        '<button data-dismiss="modal" class="pull-left btn btn-primary modal-cancel"><%=goldstone.contextTranslate(\'Cancel\', \'metricviewer\')%></button>' +
        '</div>' + // end modal-footer

        '</div>' + // end gear-modal-content

        '</div>' + // end modal-content
        '</div>' + // end modal-dialog
        '</div>' + // end modal


        // END MODAL FORMATTING
        //---------------------


        // start visible page elements
        // add trigger that will reveal modal

        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><span class="metric-viewer-title<%= this.options.instance %>"><%=goldstone.contextTranslate(\'Click gear for config\', \'metricviewer\')%></span>' +
        '<i id="menu-trigger<%= this.options.instance %>" class="pull-right fa fa-gear" data-toggle="modal" data-target="#modal-filter-<%= this.options.instance %>" ></i>' +
        '</h3></div>' +

        // add div that will contain svg for d3 chart
        '<div class="well metric-chart-instance<%= this.options.instance %>" style="height:<%= this.options.height %>px;width:<%= this.options.width %>px;">' +
        '</div>'
    )

});
;
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
View is currently implemented for Nova CPU/Memory/Disk Resource Charts

instantiated similar to:

this.cpuResourcesChart = new MultiMetricComboCollection({
    metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used']
});

this.cpuResourcesChartView = new MultiMetricBarView({
    chartTitle: "CPU Resources",
    collection: this.cpuResourcesChart,
    featureSet: 'cpu',
    height: 300,
    infoCustom: 'novaCpuResources',
    el: '#nova-report-r2-c1',
    width: $('#nova-report-r2-c1').width(),
    yAxisLabel: 'Cores'
});
*/

var MultiMetricBarView = GoldstoneBaseView.extend({
    defaults: {
        margin: {
            top: 45,
            right: 40,
            bottom: 60,
            left: 70
        }
    },

    processOptions: function() {

        // this will invoke the processOptions method of the parent view,
        // and also add an additional param of featureSet which is used
        // to create a polymorphic interface for a variety of charts
        MultiMetricBarView.__super__.processOptions.apply(this, arguments);

        this.defaults.featureSet = this.options.featureSet || null;
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.defaults.urlCollectionCount === 0) {
                self.update();
                // the collection count will have to be set back to the original count when re-triggering a fetch.
                self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
                self.collection.defaults.fetchInProgress = false;
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            this.collection.defaults.globalLookback = $('#global-lookback-range').val();
            this.collection.fetchMultipleUrls();
            $(this.el).find('#spinner').show();
        });
    },

    dataErrorMessage: function(message, errorMessage) {

        MultiMetricBarView.__super__.dataErrorMessage.apply(this, arguments);

        var self = this;

        // the collection count will have to be set back to the original count when re-triggering a fetch.
        self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
        self.collection.defaults.fetchInProgress = false;
    },

    specialInit: function() {
        var ns = this.defaults;

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        // differentiate color sets for mem and cpu charts
        if (ns.featureSet === 'mem' || ns.featureSet === 'cpu') {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct['3R']);
        }
        if (ns.featureSet === 'metric') {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct[1]);
        } else {
            // this includes "VM Spawns" and "Disk Resources" chars
            ns.color = d3.scale.ordinal()
                .range(ns.colorArray.distinct['2R']);
        }

        this.populateInfoButton();
    },

    collectionPrep: function(data) {
        var condensedData;
        var dataUniqTimes;
        var newData;

        var ns = this.defaults;
        var uniqTimestamps;
        var finalData = [];

        if (ns.featureSet === 'cpu') {

            _.each(data, function(collection) {

                // within each collection, tag the data points
                _.each(collection.per_interval, function(dataPoint) {

                    _.each(dataPoint, function(item, i) {
                        item['@timestamp'] = i;
                        item.name = collection.metricSource;
                        item.value = item.stats.max;
                    });

                });
            });

            condensedData = _.flatten(_.map(data, function(item) {
                return item.per_interval;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item[_.keys(item)[0]]['@timestamp'];
            }));

            newData = {};

            _.each(dataUniqTimes, function(item) {
                newData[item] = {
                    Physical: null,
                    Used: null,
                    eventTime: null,
                    total: null
                };
            });

            _.each(condensedData, function(item) {

                var key = _.keys(item)[0];
                var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
                newData[key][metric] = item[key].value;

            });


            finalData = [];

            _.each(newData, function(item, i) {

                item.vcpus_used = item.vcpus_used || 0;
                item.vcpus = item.vcpus || 0;

                finalData.push({
                    eventTime: i,
                    Used: item.vcpus_used,
                    Physical: item.vcpus
                });
            });

        } else if (ns.featureSet === 'disk') {

            _.each(data, function(collection) {

                // within each collection, tag the data points
                _.each(collection.per_interval, function(dataPoint) {

                    _.each(dataPoint, function(item, i) {
                        item['@timestamp'] = i;
                        item.name = collection.metricSource;
                        item.value = item.stats.max;
                    });

                });
            });

            condensedData = _.flatten(_.map(data, function(item) {
                return item.per_interval;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item[_.keys(item)[0]]['@timestamp'];
            }));

            newData = {};

            _.each(dataUniqTimes, function(item) {
                newData[item] = {
                    Total: null,
                    Used: null,
                    eventTime: null,
                    total: null
                };
            });

            _.each(condensedData, function(item) {

                var key = _.keys(item)[0];
                var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
                newData[key][metric] = item[key].value;

            });


            finalData = [];

            _.each(newData, function(item, i) {

                item.local_gb = item.local_gb || 0;
                item.local_gb_used = item.local_gb_used || 0;

                finalData.push({
                    eventTime: i,
                    Used: item.local_gb_used,
                    Total: item.local_gb
                });
            });

        } else if (ns.featureSet === 'mem') {

            _.each(data, function(collection) {

                // within each collection, tag the data points
                _.each(collection.per_interval, function(dataPoint) {

                    _.each(dataPoint, function(item, i) {
                        item['@timestamp'] = i;
                        item.name = collection.metricSource;
                        item.value = item.stats.max;
                    });

                });
            });

            condensedData = _.flatten(_.map(data, function(item) {
                return item.per_interval;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item[_.keys(item)[0]]['@timestamp'];
            }));

            newData = {};

            _.each(dataUniqTimes, function(item) {
                newData[item] = {
                    Physical: null,
                    Used: null,
                    eventTime: null,
                    total: null
                };
            });

            _.each(condensedData, function(item) {

                var key = _.keys(item)[0];
                var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
                newData[key][metric] = item[key].value;

            });


            finalData = [];

            _.each(newData, function(item, i) {

                item.memory_mb = item.memory_mb || 0;
                item.memory_mb_used = item.memory_mb_used || 0;

                finalData.push({
                    eventTime: i,
                    Used: item.memory_mb_used,
                    Physical: item.memory_mb
                });
            });

        }

        return finalData;
    },

    computeHiddenBarText: function(d) {
        var ns = this.defaults;

        /*
        filter function strips keys that are irrelevant to the d3.tip:

        converts from: {Physical: 31872, Used: 4096, Virtual: 47808,
        eventTime: "1424556000000", stackedBarPrep: [],
        total: 47808}

        to: ["Virtual", "Physical", "Used"]
        */

        // reverses result to match the order in the chart legend
        var valuesToReport = _.filter((_.keys(d)), function(item) {
            return item !== "eventTime" && item !== "stackedBarPrep" && item !== "total";
        }).reverse();

        var result = "";

        // matches time formatting of api perf charts
        result += moment(+d.eventTime).format() + '<br>';

        if (ns.featureSet === 'metric') {
            valuesToReport.forEach(function(item) {
                result += 'Value: ' + d[item] + '<br>';
            });

        } else {
            valuesToReport.forEach(function(item) {
                result += item + ': ' + d[item] + '<br>';
            });
        }

        return result;
    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // data originally returned from collection as:
        // [{"1424586240000": [6, 16, 256]}...]
        var data = this.collection.toJSON();

        // data morphed through collectionPrep into:
        // {
        //     "eventTime": "1424586240000",
        //     "Used": 6,
        //     "Physical": 16,
        //     "Virtual": 256
        // });
        data = this.collectionPrep(data);

        this.hideSpinner();

        // clear elements from previous render
        $(this.el).find('svg').find('rect').remove();
        $(this.el).find('svg').find('line').remove();
        $(this.el).find('svg').find('.axis').remove();
        $(this.el).find('svg').find('.legend').remove();
        $(this.el).find('svg').find('path').remove();
        $(this.el).find('svg').find('circle').remove();
        $(this.el + '.d3-tip').detach();

        // if empty set, append info popup and stop
        if (this.checkReturnedDataSet(data) === false) {
            return;
        }

        // maps keys such as "Used / Physical / Virtual" to a color
        // but skips mapping "eventTime" to a color
        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "eventTime";
        }));

        /*
        forEach morphs data into:
        {
            "eventTime": "1424586240000",
            "Used": 6,
            "Physical": 16,
            "Virtual": 256,
            stackedBarPrep: [
                {
                    name: "Used",
                    y0: 0,
                    y1: 6
                },
                {
                    name: "Physical",
                    y0: 6,
                    y1: 22,
                },
                {
                    name: "Virtual",
                    y0: 22,
                    y1: 278,
                },
            ],
            total: 278
        });
        */

        data.forEach(function(d) {
            var y0 = 0;

            // calculates heights of each stacked bar by adding
            // to the heights of the previous bars
            d.stackedBarPrep = ns.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });

            // this is the height of the last element, and used to
            // calculate the domain of the y-axis
            d.total = d.stackedBarPrep[d.stackedBarPrep.length - 1].y1;

            // or for the charts with paths, use the top line as the
            // total, which will inform that domain of the y-axis
            // d.Virtual and d.Total are the top lines on their
            // respective charts
            if (d.Virtual) {
                d.total = d.Virtual;
            }
            if (d.Total) {
                d.total = d.Total;
            }
        });

        // the forEach operation creates chaos in the order of the set
        // must _.sortBy to return it to an array sorted by eventTime
        data = _.sortBy(data, function(item) {
            return item.eventTime;
        });

        ns.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        // IMPORTANT: see data.forEach above to make sure total is properly
        // calculated if additional data paramas are introduced to this viz
        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        // add x axis
        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        // add y axis
        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // add primary svg g layer
        ns.event = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.eventTime) + ",0)";
            });

        // add svg g layer for solid lines
        ns.solidLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        // add svg g layer for dashed lines
        ns.dashedLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        // add svg g layer for hidden rects
        ns.hiddenBarsCanvas = ns.chart.selectAll(".hidden")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g");

        // initialize d3.tip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return self.computeHiddenBarText(d);
            });

        // Invoke the tip in the context of your visualization
        ns.chart.call(tip);

        // used below to determing whether to render as
        // a "rect" or "line" by affecting fill and stroke opacity below
        var showOrHide = {
            "Failure": true,
            "Success": true,
            "Virtual": false,
            "Physical": false,
            "Total": false,
            "Used": true
        };

        // append rectangles
        ns.event.selectAll("rect")
            .data(function(d) {
                return d.stackedBarPrep;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                var segmentWidth = (ns.mw / data.length);

                // spacing corrected for proportional
                // gaps between rects
                return segmentWidth - segmentWidth * 0.07;
            })
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return ns.color(d.name);
            })
            .attr("stroke-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 1;
                }
            })
            .attr("fill-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 0.8;
                }
            })
            .attr("stroke-width", 2)
            .style("fill", function(d) {
                return ns.color(d.name);
            });

        // append hidden bars
        ns.hiddenBarsCanvas.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("width", function(d) {
                var hiddenBarWidth = (ns.mw / data.length);
                return hiddenBarWidth - hiddenBarWidth * 0.07;
            })
            .attr("opacity", "0")
            .attr("x", function(d) {
                return ns.x(d.eventTime);
            })
            .attr("y", 0)
            .attr("height", function(d) {
                return ns.mh;
            }).on('mouseenter', function(d) {

                // coax the pointer to line up with the bar center
                var nudge = (ns.mw / data.length) * 0.5;
                var targ = d3.select(self.el).select('rect');
                tip.offset([20, -nudge]).show(d, targ);
            }).on('mouseleave', function() {
                tip.hide();
            });

        // abstracts the line generator to accept a data param
        // variable. will be used in the path generator
        var lineFunctionGenerator = function(param) {
            return d3.svg.line()
                .interpolate("linear")
                .x(function(d) {
                    return ns.x(d.eventTime);
                })
                .y(function(d) {
                    return ns.y(d[param]);
                });
        };

        // abstracts the path generator to accept a data param
        // and creates a solid line with the appropriate color
        var solidPathGenerator = function(param) {
            return ns.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        };

        // abstracts the path generator to accept a data param
        // and creates a dashed line with the appropriate color
        var dashedPathGenerator = function(param) {
            return ns.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-dasharray", "5, 2");
        };

        // lineFunction must be a named local
        // variable as it will be called by
        // the pathGenerator function that immediately follows
        var lineFunction;
        if (ns.featureSet === 'cpu') {

            // generate solid line for Virtual data points
            // uncomment if supplying virtual stat again
            // lineFunction = lineFunctionGenerator('Virtual');
            // solidPathGenerator('Virtual');

            // generate dashed line for Physical data points
            lineFunction = lineFunctionGenerator('Physical');
            dashedPathGenerator('Physical');

        } else if (ns.featureSet === 'disk') {

            // generate solid line for Total data points
            lineFunction = lineFunctionGenerator('Total');
            solidPathGenerator('Total');
        } else if (ns.featureSet === 'mem') {

            // generate solid line for Virtual data points
            // uncomment if supplying virtual stat again
            // lineFunction = lineFunctionGenerator('Virtual');
            // solidPathGenerator('Virtual');

            // generate dashed line for Physical data points
            lineFunction = lineFunctionGenerator('Physical');
            dashedPathGenerator('Physical');
        }


        // appends chart legends
        var legendSpecs = {
            metric: [
                // uncomment if supplying virtual stat again
                // ['Virtual', 2],
                ['Value', 0]
            ],
            mem: [
                // uncomment if supplying virtual stat again
                // ['Virtual', 2],
                ['Physical', 1],
                ['Used', 0]
            ],
            cpu: [
                // uncomment if supplying virtual stat again
                // ['Virtual', 2],
                ['Physical', 1],
                ['Used', 0]
            ],
            disk: [
                ['Total', 1],
                ['Used', 0]
            ],
            spawn: [
                ['Fail', 1],
                ['Success', 0]
            ]
        };

        if (ns.featureSet !== null) {
            this.appendLegend(legendSpecs[ns.featureSet]);
        } else {
            this.appendLegend(legendSpecs.spawn);
        }
    },

    populateInfoButton: function() {
        var self = this;
        // chart info button popover generator
        var infoButtonText = new InfoButtonText().get('infoText');
        var htmlGen = function() {
            var result = infoButtonText[this.defaults.infoCustom];
            result = result ? result : goldstone.translate('Set in InfoButtonText.js');
            return result;
        };

        $(this.el).find('#chart-button-info').popover({
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

    appendLegend: function(legendSpecs) {

        // abstracts the appending of chart legends based on the
        // passed in array params [['Title', colorSetIndex],['Title', colorSetIndex'],...]

        var ns = this.defaults;

        _.each(legendSpecs, function(item) {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', item[0])
                .attr('data-legend', item[0])
                .attr('data-legend-color', ns.color.range()[item[1]]);
        });

        var legend = ns.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20,-35)')
            .attr('opacity', 1.0)
            .call(d3.legend);
    }

});
;
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

    defaults: {},

    initialize: function(options) {

        this.options = options || {};

        // essential for unique chart objects,
        // as objects/arrays are pass by reference
        this.defaults = _.clone(this.defaults);

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
        '<div class="panel panel-primary multi-rsrc-panel" id="multi-rsrc-panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title multi-rsrc-title"><i class="fa fa-dashboard"></i>' +
        ' <%= this.options.chartTitle %><span class="panel-header-resource-title"></span>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '</h3>' +
        '</div>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
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
;
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

var NeutronReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.neutronApiPerfChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron'
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: "Neutron API Performance",
            collection: this.neutronApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#neutron-report-r1-c1',
            width: $('#neutron-report-r1-c1').width()
        });
    },

    template: _.template('' +
        '<div id="neutron-report-r1" class="row">' +
        '<div id="neutron-report-r1-c1" class="col-md-6"></div>' +
        '</div>'
    )

});
;
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

var NewPasswordView = GoldstoneBaseView2.extend({

    initialize: function(options) {
        this.getUidToken();
        this.addHandlers();
    },

    getUidToken: function() {
        this.uidToken = window.location.search.slice(1);
    },

    addHandlers: function() {
        var self = this;

        $('.login-form').on('submit', function(e) {
            e.preventDefault();

            var $password = $('#password');
            var $confirm_password = $('#confirm_password');

            if ($password.val() !== $confirm_password.val()) {
                goldstone.raiseWarning("Passwords don't match.");
            } else {

                // options.uidToken is passed in when the view is
                // instantiated via goldstoneRouter.js

                self.submitRequest(self.uidToken + '&' + $(this).serialize());
            }
        });
    },

    clearFields: function() {
        // clear input fields
        $('#password').val('');
        $('#confirm_password').val('');
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/password/reset/confirm/', input, function() {})
            .done(function(success) {

                // clear input fields
                self.clearFields();

                // and add a success message to the top of the screen
                goldstone.raiseInfo('Password changed. Redirecting to login.');


                setTimeout(function() {
                    location.href = '/login/';

                }, 2000);

            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call
                if (fail.non_field_errors) {
                    goldstone.raiseWarning(fail.non_field_errors);
                } else {
                    // clear input fields
                    self.clearFields();
                    goldstone.raiseWarning('Password reset failed.');
                }

            });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    }

});
;
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
openstack syslog severity levels:
0       EMERGENCY: system is unusable
1       ALERT: action must be taken immediately
2       CRITICAL: critical conditions
3       ERROR: error conditions
4       WARNING: warning conditions
5       NOTICE: normal but significant condition
6       INFO: informational messages
7       DEBUG: debug-level messages
/*

/*
View is linked to collection when instantiated

Instantiated on discoverView as:

var nodeAvailChart = new NodeAvailCollection({});

var nodeAvailChartView = new NodeAvailView({
    collection: nodeAvailChart,
    h: {
        "main": 150,
        "swim": 50
        // "main": 450,
        // "swim": 50
    },
    el: '#goldstone-discover-r1-c2',
    chartTitle: 'Node Availability',
    width: $('#goldstone-discover-r2-c2').width()
});
*/


var NodeAvailView = GoldstoneBaseView.extend({

    defaults: {
        margin: {
            top: 18,
            bottom: 25,
            right: 40,
            left: 10
        },

        filter: {
            // none must be set to false in order to not display
            // nodes that have zero associated events.
            emergency: true,
            alert: true,
            critical: true,
            error: true,
            warning: true,
            notice: true,
            info: true,
            debug: true,
            none: false,
            actualZero: true
        }
    },

    initialize: function(options) {
        NodeAvailView.__super__.initialize.apply(this, arguments);
        this.setInfoButtonPopover();
    },

    processOptions: function() {
        this.el = this.options.el;
        this.defaults.chartTitle = this.options.chartTitle;
        this.defaults.width = this.options.width;
        this.defaults.height = this.options.h;
        this.defaults.r = d3.scale.sqrt();
        this.defaults.colorArray = new GoldstoneColors().get('colorSets');

        // this will contain the results of the two seperate fetches
        // before they are zipped together in this.combineDatasets
        this.defaults.dataToCombine = [];

    },

    processListeners: function() {
        var self = this;
        var ns = this.defaults;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.defaults.urlCollectionCount === 0) {

                // if the 2nd fetch is done, store the 2nd dataset
                // in dataToCombine
                ns.dataToCombine[1] = self.collectionPrep(self.collection.toJSON()[0]);

                // restore the fetch count
                self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;

                // reset fetchInProgress so further fetches can
                // be initiated
                self.collection.defaults.fetchInProgress = false;

                // update the view
                self.update();
            } else if (self.collection.defaults.urlCollectionCount === 1) {
                // if the 1st of 2 fetches are done, store the
                // first dataset in dataToCombine
                ns.dataToCombine[0] = self.collectionPrep(self.collection.toJSON()[0]);
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            self.fetchNowWithReset();
        });

        this.on('lookbackIntervalReached', function() {
            self.fetchNowWithReset();
        });
    },

    showSpinner: function() {
        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height.main * 0.55),
                'display': ns.spinnerDisplay
            });
        });
    },

    fetchNowWithReset: function() {
        var ns = this.defaults;
        this.showSpinner();
        this.collection.fetchMultipleUrls();
    },

    standardInit: function() {
        var ns = this.defaults;
        var self = this;

        // maps between input label domain and output color range for circles
        ns.loglevel = d3.scale.ordinal()
            .domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug", "actualZero"])
        // concats darkgrey as a color for nodes
        // reported at 'actualZero'
        .range(ns.colorArray.distinct.openStackSeverity8.concat(['#A9A9A9']));

        // for 'disabled' axis
        ns.xAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(3)
            .tickFormat(d3.time.format("%m/%d %H:%M:%S"));

        ns.xScale = d3.time.scale()
            .range([ns.margin.left, ns.mw - ns.margin.right])
        // rounding
        .nice()
        // values above or below domain will be constrained to range
        .clamp(true);

        ns.yAxis = d3.svg.axis()
            .ticks(5)
            .orient("left");
        ns.swimAxis = d3.svg.axis().orient("left");
        ns.ySwimLane = d3.scale.ordinal()
            .domain(["unadmin"].concat(ns.loglevel
                .domain()
                .concat(["padding1", "padding2", "ping"])))
            .rangeRoundBands([ns.height.main, 0]);

        ns.yLogs = d3.scale.linear()
            .range([
                ns.ySwimLane("unadmin") - ns.ySwimLane.rangeBand(),
                ns.ySwimLane("ping") + ns.ySwimLane.rangeBand()
            ]);


        /*
         * The graph and axes
         */

        ns.svg = d3.select(this.el).select(".panel-body").append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height.main + (ns.height.swim * 2) + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        ns.graph = ns.svg.append("g").attr("id", "graph");

        // Visual swim lanes
        ns.swimlanes = {
            // ping: {
            //     label: "Ping Only",
            //     offset: -(ns.ySwimLane.rangeBand() / 2)
            // },
            unadmin: {
                label: "Disabled",
                offset: ns.ySwimLane.rangeBand() / 2
            }
        };

        ns.graph.selectAll(".swimlane")
            .data(d3.keys(ns.swimlanes), function(d) {
                return d;
            })
            .enter().append("g")
            .attr("class", "swimlane")
            .attr("id", function(d) {
                return d;
            })
            .attr("transform", function(d) {
                return "translate(0," + ns.ySwimLane(d) + ")";
            });

        // ns.graph.append("g")
        //     .attr("class", "xping axis")
        //     .attr("transform", "translate(0," + (ns.ySwimLane.rangeBand()) + ")");

        ns.graph.append("g")
            .attr("class", "xunadmin axis")
            .attr("transform", "translate(0," + (ns.height.main - ns.ySwimLane.rangeBand()) + ")");

        ns.graph.append("g")
            .attr("class", "y axis invisible-axis")
            .attr("transform", "translate(" + (ns.mw + 10) + ",0)");

        // nudges visible y-axis to the right
        ns.graph.append("g")
            .attr("class", "swim axis invisible-axis")
            .attr("transform", "translate(20,0)");

        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function(e) {
                if (this.getBBox().y < ns.height.swim) {
                    return 's';
                } else {
                    return 'n';
                }
            })
            .offset(function() {
                var leftOffset;
                // [top-offset, left-offset]
                var toolTipWidth = 292;
                var halfToolHeight = 65;
                if (this.getBBox().x < toolTipWidth) {
                    leftOffset = toolTipWidth - this.getBBox().x;
                } else if (this.getBBox().x > ns.width - toolTipWidth) {
                    leftOffset = -(toolTipWidth - (ns.width - this.getBBox().x));
                } else {
                    leftOffset = 0;
                }
                return [0, leftOffset];
            })
            .html(function(d) {
                return self.formatTooltip(d);
            });

        ns.graph.call(ns.tooltip);

        // Label the swim lane ticks
        ns.swimAxis
            .tickFormat(function(d) {
                // Visual swim lanes
                var swimlanes = {
                    // ping: "Ping Only",
                    unadmin: ""
                };
                var middle = ns.ySwimLane.domain()[Math.floor(ns.ySwimLane.domain().length / 2)];
                swimlanes[middle] = "";
                if (swimlanes[d]) {
                    return swimlanes[d];
                } else {
                    return "";
                }
            });

        // Draw the axis on the screen
        d3.select(this.el).select(".swim.axis")
            .call(ns.swimAxis.scale(ns.ySwimLane));

        // Transform the swim lane ticks into place
        // increases size of labels via font-size
        d3.select(this.el).select(".swim.axis").selectAll("text")
            .style('font-size', '15px')
            .style('font-weight', 'bold');
    },

    formatTooltip: function(d) {
        var ns = this.defaults;

        // Time formatted as: Wed Apr 29 2015 20:50:49 GMT-0700 (PDT)
        var tooltipText = '<div class="text-left">Host: ' + d.name + '<br>' +
            'Time: ' + moment(d.created).toDate() + '<br>';

        var levels = _.filter(_.keys(ns.filter), function(item) {
            return item !== 'actualZero' && item !== 'none';
        });

        // var levels = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];

        // iterate through levels and if defined and non-zero, append
        // to toolTip with count
        _.each(levels, function(item) {
            item += '_count';
            if (d[item]) {
                // changes 'alert_level' to 'Alert: xxx'
                tooltipText += item.charAt(0).toUpperCase() + item.slice(1, item.indexOf("_")) + ": " + d[item] + '<br>';
            }
        });

        tooltipText += '</div>';

        return tooltipText;
    },

    sums: function(datum) {
        var ns = this.defaults;
        // Return the sums for the filters that are on
        return d3.sum(ns.loglevel.domain().map(function(k) {

            if (ns.filter[k] && datum[k + "_count"]) {
                return datum[k + "_count"];
            } else {
                return 0;
            }

        }));
    },

    collectionPrep: function(data) {
        var ns = this.defaults;
        var self = this;

        var finalData = [];

        // data.hosts will equal all hosts, so
        // make an object to keep track of whether each one has been
        // found in the data.data array, and record the levels
        // and timestamp for that occurance.
        // once each host has been found, quit the iteration and
        // return the record as final data;
        var setOfHosts = {}; // ['rsrc-01', 'ctrl-01', ....]

        // prime setOfHosts object. keyed to data.hosts
        // and value all initially set to null
        _.each(data.hosts, function(item) {
            setOfHosts[item] = null;
        }); // {'rsrc-01: null, 'ctrl-01': null, ...}

        // function to return if there are any keys that have
        // a value of null in the passed in object
        // (which will be used with setOfHosts)
        var checkIfAnyNull = function(obj) {
            return _.any(obj, function(item) {
                return item === null;
            });
        };

        // reverse the data in order to encounter the
        // most recent timestamps first
        data.data.reverse();

        // sets up an iteration that will break as soon as every
        // host value is no longer set to null, or else gets
        // through the entire data set
        _.every(data.data, function(item) {

            // iterate through the timestamp
            _.each(item, function(hostsInTimestamp, timestamp) {

                // iterate through the host
                _.each(hostsInTimestamp, function(hostObject) {

                    var hostName = _.keys(hostObject)[0];
                    if (setOfHosts[hostName] === null) {

                        // don't run through this host again
                        setOfHosts[hostName] = true;
                        hostResultObject = {};

                        // add in params that are expected by current viz:
                        hostResultObject.id = hostName;
                        hostResultObject.name = hostName;
                        hostResultObject.created = +timestamp;
                        hostResultObject.updated = +timestamp;
                        hostResultObject.managed = true;
                        hostResultObject.update_method = "LOGS";

                        // iterate through host and record the values
                        _.each(hostObject, function(levels) {
                            _.each(levels, function(oneLevel) {
                                hostResultObject[_.keys(oneLevel) + '_count'] = _.values(oneLevel)[0];
                            });
                        });

                        // set each alert level to 0 if still undefined
                        _.each(ns.loglevel.domain().filter(function(item) {
                            return item !== 'actualZero';
                        }), function(level) {
                            hostResultObject[level + '_count'] = hostResultObject[level + '_count'] || 0;
                        });

                        finalData.push(hostResultObject);
                    }
                });
            });

            // if there are any remaining hosts that are set to null
            // then this return value will be true and the iteration
            // will continue. but if this returns false, it stops
            return checkIfAnyNull(setOfHosts);
        });

        return finalData;
    },

    combineDatasets: function(dataArray) {

        // take the two datasets and iterate through the first one
        // looking for '_count' attributes, and then copy them over
        // from the 2nd dataset which contains the accurate counts

        // function to locate an object in a dataset that contains a name property with the passed in name
        var findNodeToCopyFrom = function(data, name) {
            return _.find(data, function(item) {
                return item.name === name;
            });
        };

        _.each(dataArray[0], function(item, i) {
            for (var k in item) {
                if (k.indexOf('_count') > -1) {
                    var itemToCopyFrom = findNodeToCopyFrom(dataArray[1], item.name);
                    item[k] = itemToCopyFrom[k];
                }
            }
        });

        // after they are zipped together, the final result will
        // be contained in array index 0.
        return dataArray[0];
    },

    lookbackRange: function() {
        var lookbackMinutes;
        lookbackMinutes = $('.global-lookback-selector .form-control').val();
        return parseInt(lookbackMinutes, 10);
        // returns only the numerical value of the lookback range
    },

    updateLookbackMinutes: function() {
        var ns = this.defaults;
        ns.lookbackRange = this.lookbackRange();
    },

    update: function() {
        var ns = this.defaults;
        var self = this;

        this.hideSpinner();

        // includes timestamps, levels, hosts, data
        var allthelogs = this.collection.toJSON()[0];

        // get the currrent lookback to set the domain of the xAxis
        this.updateLookbackMinutes();
        xEnd = +new Date();
        xStart = xEnd - (1000 * 60 * ns.lookbackRange);

        ns.xScale = ns.xScale.domain([xStart, xEnd]);

        // if no response from server, need to assign allthelogs.data
        allthelogs = allthelogs || {};
        allthelogs.data = allthelogs.data || [];

        // If we didn't receive any valid files, append "No Data Returned"
        if (this.checkReturnedDataSet(allthelogs.data) === false) {
            return;
        }

        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        // populate the modal based on the event types.
        _.each(_.keys(ns.filter), function(item) {

            // don't put type 'none' or 'actualZero'
            // in the modal checkbox options
            if (item === 'none' || item === 'actualZero') {
                return null;
            }

            // function to determine if the html should format
            // a check box for the filter button in the modal
            var addCheckIfActive = function(item) {
                if (ns.filter[item]) {
                    return 'checked';
                } else {
                    return '';
                }
            };

            var checkMark = addCheckIfActive(item);

            $(self.el).find('#populateEventFilters').
            append(

                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div class="input-group">' +
                '<span class="input-group-addon"' +
                'style="background-color:' + ns.loglevel([item]) + ';">' +
                '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                '</span>' +
                '<span type="text" class="form-control">' + item + '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        // click listerner for check box to redraw the viz upon change
        $(this.el).find('#populateEventFilters :checkbox').on('click', function() {
            var checkboxId = this.id;
            ns.filter[checkboxId] = !ns.filter[checkboxId];
            self.redraw();

        });


        /*
         * Shape the dataset
         *   - Convert datetimes to integer
         *   - Sort by last seen (from most to least recent)
         */

        ns.dataset = this.combineDatasets(ns.dataToCombine)
            .map(function(d) {
                d.created = moment(d.created);
                d.updated = moment(d.updated);

                /*
                 * Figure out which bucket (logs, ping, or disabled)
                 * each node belongs to.
                 */

                if (d.managed === "false") {
                    d.swimlane = "unadmin";
                } else {
                    d.swimlane = d.update_method.toLowerCase();
                }
                return d;
            });


        /*
         * Axes
         *   - calculate the new domain.
         *   - adjust each axis to its new scale.
         */

        // ns.pingAxis.scale(ns.xScale);
        ns.xAxis.scale(ns.xScale);

        // ns.svg.select(".xping.axis")
        //     .call(ns.pingAxis);

        ns.svg.select(".xunadmin.axis")
            .call(ns.xAxis);

        ns.yAxis.scale(ns.yLogs);

        ns.svg.select(".y.axis")
            .transition()
            .duration(500)
            .call(ns.yAxis);


        // binds circles to dataset
        var circle = ns.graph.selectAll("circle")
            .data(ns.dataset, function(d) {
                // if changing this, also must
                // change idAttribute in backbone model

                /*
TODO: probably change this to d.timestamp
*/
                return d.id;
            });

        // 'enters' circles at far right of screen.
        // styling and location will happen in this.redraw().
        circle.enter()
            .append("circle")
            .attr("cx", function(d) {
                return ns.xScale.range()[1];
            })
            .attr("cy", function(d) {
                return ns.yLogs(self.sums(d));
            })
            .on("mouseover", ns.tooltip.show)
            .on("mouseout", ns.tooltip.hide)
            .on("click", function(d) {
                window.location.href = '#report/node/' + d.name;
            });

        this.redraw();

        circle.exit().remove();

        return;
    },

    redraw: function() {
        var ns = this.defaults;
        var self = this;

        /*
         * Figure out the higest non-filtered level.
         * That will determine its color.
         */

        _.each(ns.dataset, function(nodeObject) {

            // nonzero_levels returns an array of the node's
            // alert severities that are not filtered out

            var nonzero_levels = ns.loglevel.domain()
                .map(function(level) {
                    return [level, nodeObject[level + "_count"]];
                })
                .filter(function(level) {

                    // only consider 'active' filter buttons
                    return ns.filter[level[0]] && (level[1] > 0);
                });

            // the .level paramater will determine visibility
            // and styling of the sphere

            // if the array is empty:
            if (nonzero_levels[0] === undefined) {
                nodeObject.level = "actualZero";
            } else {

                // otherwise set it to the
                // highest alert severity
                nodeObject.level = nonzero_levels[0][0];
            }

        });

        ns.yLogs.domain([
            0,
            d3.max(ns.dataset.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(this.el).select(".swim.axis")
            .transition()
            .duration(500);

        d3.select(this.el).select(".y.axis")
            .transition()
            .duration(500)
            .call(ns.yAxis.scale(ns.yLogs));

        ns.graph.selectAll("circle")
            .transition().duration(500)
        // this determines the color of the circle
        .attr("class", function(d) {
            if (d.swimlane === "unadmin") {
                return d.swimlane;
            } else {
                return "individualNode";
            }
        })
            .attr("fill", function(d) {
                return ns.loglevel(d.level);
            })
            .attr("cx", function(d) {
                return ns.xScale(d.updated);
            })
            .attr("cy", function(d, i) {

                // add multiplier to give space between
                // multiple items reporting the same numbers
                if (d.level === 'actualZero') {
                    return (ns.yLogs(self.sums(d)) - (i * 2));
                } else {

                    // notice the [] at the end which is calling
                    // the key that matches d.swimlane

                    return {

                        // add multiplier to give space between
                        // multiple items reporting the same numbers
                        logs: ns.yLogs(self.sums(d) - (i * 2)),

                        // ping: ns.ySwimLane(d.swimlane) - 15,
                        unadmin: ns.ySwimLane(d.swimlane) + ns.ySwimLane.rangeBand() + 15
                    }[d.swimlane];


                }



            })
            .attr("r", function(d) {

                // radii at fixed size for now.
                if (d.swimlane === "logs") {
                    return ns.r(64);
                } else {
                    return ns.r(20);
                }

            })
            .style("opacity", function(d) {

                if (d.swimlane === "unadmin") {
                    return 1.0;
                }
                if (ns.filter[d.level]) {
                    return 1.0;
                } else {
                    return 0;
                }

            })
            .style("visibility", function(d) {

                // use visibility "hidden" to
                // completely remove from dom to prevent
                // tool tip hovering from still working
                if (!ns.filter[d.level]) {
                    return "hidden";
                } else {
                    return "visible";
                }
            });

    },

    render: function() {
        this.$el.html(this.template());
        // this.$el.find('#modal-container-' + this.el.slice(1)).append(this.modal1());
        this.$el.find('#modal-container-' + this.el.slice(1)).append(this.modal2());
        return this;
    },

    setInfoButtonPopover: function() {

        var infoButtonText = new InfoButtonText().get('infoText');
        var htmlGen = function() {
            var result = infoButtonText.nodeAvailability;
            return result;
        };
        // attach click listeners to chart heading info button
        $('#goldstone-node-info').popover({
            trigger: 'manual',
            content: htmlGen.apply(this),
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('toggle');
            }).on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('hide');
            });
    },

    template: _.template(
        '<div id = "goldstone-node-panel" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> ' +
        '<%= this.defaults.chartTitle %>' +

        // cog icon
        // '<i class="fa fa-cog pull-right" data-toggle="modal"' +
        // 'data-target="#modal-settings-<%= this.el.slice(1) %>' +
        // '"></i>' +

        // filter icon
        '<i class="fa fa-filter pull-right" data-toggle="modal"' +
        'data-target="#modal-filter-<%= this.el.slice(1) %>' + '" style="margin-right: 15px;"></i>' +

        // info-circle icon
        '<i class="fa fa-info-circle panel-info pull-right "  id="goldstone-node-info"' +
        'style="margin-right: 15px;"></i>' +
        '</h3></div>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="panel-body" style="height:169px">' +
        '<div id="event-filterer" class="btn-group pull-right" data-toggle="buttons" align="center">' +
        '</div>' +
        '</div>' +
        '<div id="goldstone-node-chart">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div id="modal-container-<%= this.el.slice(1) %>' +
        '"></div>'

    ),

    modal1: _.template(
        // event settings modal
        '<div class="modal fade" id="modal-settings-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title" id="myModalLabel">Chart Settings</h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="nodeAutoRefresh" class="col-sm-3 control-label">Refresh: </label>' +
        '<div class="col-sm-9">' +
        '<div class="input-group">' +
        '<span class="input-group-addon">' +
        '<input type="checkbox" class="nodeAutoRefresh" checked>' +
        '</span>' +
        '<select class="form-control" id="nodeAutoRefreshInterval">' +
        '<option value="5">5 seconds</option>' +
        '<option value="15">15 seconds</option>' +
        '<option value="30" selected>30 seconds</option>' +
        '<option value="60">1 minute</option>' +
        '<option value="300">5 minutes</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<div class="form-group">' +
        '<button type="button" id="eventSettingsUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal">Update</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    ),

    modal2: _.template(
        // event filter modal
        '<div class="modal fade" id="modal-filter-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
        '<h4 class="modal-title" id="myModalLabel"><%=goldstone.translate(\'Log Severity Filters\')%></h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5><%=goldstone.contextTranslate(\'Uncheck log-type to hide from display\', \'nodeavail\')%></h5><br>' +
        '<div id="populateEventFilters"></div>' +
        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal"><%=goldstone.contextTranslate(\'Exit\', \'nodeavail\')%></button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    )
});
;
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

var NodeReportView = GoldstoneBasePageView.extend({

    defaults: {},

    initialize: function(options) {

        // options.node_uuid passed in during View instantiation
        this.node_uuid = options.node_uuid;

        // invoke the 'superclass'
        NodeReportView.__super__.initialize.apply(this, arguments);

        // and also invoke the local method initializeChartButtons();
        this.initializeChartButtons();
    },

    triggerChange: function() {

        var ns = this.defaults;

        // triggerChange event triggered by changing the global range selector
        // or by clicking on the (services|reports|events) tab buttons.

        if (this.visiblePanel.Services) {
            this.serviceStatusChartView.trigger('lookbackSelectorChanged');
            this.cpuUsageView.trigger('lookbackSelectorChanged');
            this.memoryUsageView.trigger('lookbackSelectorChanged');
            this.networkUsageView.trigger('lookbackSelectorChanged');
        }

        if (this.visiblePanel.Reports) {
            this.reportsReport.trigger('lookbackSelectorChanged');
        }

        if (this.visiblePanel.Events) {
            this.eventsReport.trigger('lookbackSelectorChanged');
        }

        if (this.visiblePanel.Logs) {
            this.computeLookback();
            this.logAnalysisView.trigger('lookbackSelectorChanged', [ns.start, ns.end]);
        }
    },

    computeLookback: function() {
        var ns = this.defaults;
        ns.end = +new Date();
        ns.start = ns.end - (ns.globalLookback * 60 * 1000);
    },

    setGlobalLookbackRefreshTriggers: function() {
        // sets listeners on global selectors

        var self = this;

        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange();

            // changing the lookback also resets the setInterval counter
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();

            // reset the setInterval counter
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
    },

    // simple model to record which tab is currently visible
    visiblePanel: {
        Services: true,
        Reports: false,
        Events: false,
        Details: false,
        Logs: false
    },

    // function to toggle key in visiblePanel
    // to currently active tab
    flipVisiblePanel: function(selected) {
        var self = this;
        _.each(_.keys(self.visiblePanel), function(item) {
            if (item === selected) {
                self.visiblePanel[item] = true;
            } else {
                self.visiblePanel[item] = false;
            }
        });
    },

    initializeChartButtons: function() {
        var self = this;

        // initially hide the other tabs, displaying only 'Services'
        $("#reportsReport").hide();
        $("#eventsReport").hide();
        $("#detailsReport").hide();
        $("#logsReport").hide();

        // Initialize click listener on tab buttons
        $("button.headerBar").click(function() {

            // sets key corresponding to active tab to 'true'
            // on this.visiblePanel
            self.flipVisiblePanel($(this).data('title'));

            // and triggers change
            self.triggerChange();

            // unstyle formerly 'active' button to appear 'unpressed'
            $("button.headerBar.active").toggleClass("active");

            // style 'active' button to appear 'pressed'
            $(this).toggleClass("active");

            // pass the textual content of button to _.each to
            // show/hide the correct report section
            var selectedButton = ($(this).data('title').toLowerCase());
            _.each($("button.headerBar"), function(item) {
                $("#node-report-panel").find('#' + $(item).data('title') + 'Report').hide();
            });
            $("#node-report-panel").find('#' + selectedButton + 'Report').show();
        });
    },

    constructHostName: function(loc) {

        // example usage:
        // constructHostName(controller-01.lab.solinea.com) ===> controller-01
        // CAUTION:
        // if a node is keyed WITH a '.' in the name, api call
        // will return [], due to improper lookup

        locEnd = loc.slice(loc.lastIndexOf('/') + 1);
        if (locEnd.indexOf('.') === -1) {
            return locEnd;
        } else {
            return locEnd.slice(0, locEnd.indexOf('.'));
        }
    },

    renderCharts: function() {

        var ns = this.defaults;

        // ChartHeaderViews frame out chart header bars and populate info buttons

        $('#service-status-title-bar').append(new ChartHeaderView({
            chartTitle: goldstone.contextTranslate('Service Status Report', 'nodereport'),
            infoText: 'serviceStatus'
        }).el);

        $('#utilization-title-bar').append(new ChartHeaderView({
            chartTitle: goldstone.contextTranslate('Utilization', 'nodereport'),
            infoText: 'utilization'
        }).el);

        // PENDING
        // $('#hypervisor-title-bar').append(new ChartHeaderView({
        //     chartTitle: 'Hypervisor',
        //     infoText: 'hypervisor',
        // }).el);

        // construct api calls from url component
        // between the last '/' and the following '.'
        // IMPORTANT: see caveat on node naming in constructHostName function
        var hostName = this.constructHostName(location.href);

        //----------------------------
        // instantiate charts via
        // backbone collection / views

        //---------------------------
        // instantiate Service status chart
        this.serviceStatusChart = new ServiceStatusCollection({
            nodeName: hostName
        });

        this.serviceStatusChartView = new ServiceStatusView({
            collection: this.serviceStatusChart,
            el: '#node-report-main #node-report-r2',
            width: $('#node-report-main #node-report-r2').width(),
            globalLookback: ns.globalLookback
        });

        //---------------------------
        // instantiate CPU Usage chart
        this.cpuUsageChart = new MultiMetricComboCollection({
            globalLookback: ns.globalLookback,
            metricNames: ['os.cpu.sys', 'os.cpu.user', 'os.cpu.wait'],
            nodeName: hostName
        });

        this.cpuUsageView = new UtilizationCpuView({
            collection: this.cpuUsageChart,
            el: '#node-report-r3 #node-report-panel #cpu-usage',
            width: $('#node-report-r3 #node-report-panel #cpu-usage').width(),
            featureSet: 'cpuUsage'
        });

        //---------------------------
        // instantiate Memory Usage chart
        this.memoryUsageChart = new MultiMetricComboCollection({
            globalLookback: ns.globalLookback,
            metricNames: ['os.mem.total', 'os.mem.free'],
            nodeName: hostName
        });

        this.memoryUsageView = new UtilizationMemView({
            collection: this.memoryUsageChart,
            el: '#node-report-r3 #node-report-panel #memory-usage',
            width: $('#node-report-r3 #node-report-panel #memory-usage').width(),
            featureSet: 'memUsage'
        });

        //---------------------------
        // instantiate Network Usage chart

        this.networkUsageChart = new MultiMetricComboCollection({
            globalLookback: ns.globalLookback,
            metricNames: ['os.net.tx.eth0', 'os.net.rx.eth0'],
            nodeName: hostName
        });

        this.networkUsageView = new UtilizationNetView({
            collection: this.networkUsageChart,
            el: '#node-report-r3 #node-report-panel #network-usage',
            width: $('#node-report-r3 #node-report-panel #network-usage').width(),
            featureSet: 'netUsage'
        });

        //---------------------------
        // instantiate Libvirt core/vm chart
        // PENDING
        // this.hypervisorCoreChart = new HypervisorCollection({
        //     url: "/core/report_names/?node=rsrc-02&@timestamp__range={%27gte%27:1429203012258}",
        //     globalLookback: ns.globalLookback
        // });

        // this.hypervisorCoreView = new HypervisorView({
        //     collection: this.hypervisorCoreChart,
        //     el: '#node-report-r4 #node-report-panel #cores-usage',
        //     width: $('#node-report-r4 #node-report-panel #cores-usage').width(),
        //     axisLabel: "Cores"
        // });


        //---------------------------
        // instantiate Libvirt mem/vm  chart
        // PENDING
        // this.hypervisorMemoryChart = new HypervisorCollection({
        //     url: "/core/report_names/?node=rsrc-02&@timestamp__range={%27gte%27:1429203012258}",
        //     globalLookback: ns.globalLookback
        // });
        // this.hypervisorMemoryView = new HypervisorView({
        //     collection: this.hypervisorMemoryChart,
        //     el: '#node-report-r4 #node-report-panel #memory-usage',
        //     width: $('#node-report-r4 #node-report-panel #memory-usage').width(),
        //     axisLabel: "GB"
        // });

        //---------------------------
        // instantiate Libvirt top 10 CPU consumer VMs chart
        // PENDING
        // this.hypervisorVmCpuChart = new HypervisorVmCpuCollection({
        //     url: "/core/report_names/?node=rsrc-02&@timestamp__range={%27gte%27:1429203012258}",
        //     globalLookback: ns.globalLookback
        // });

        // this.hypervisorVmCpuView = new HypervisorVmCpuView({
        //     collection: this.hypervisorVmCpuChart,
        //     el: '#node-report-r4 #node-report-panel #vm-cpu-usage',
        //     width: $('#node-report-r4 #node-report-panel #vm-cpu-usage').width()
        // });

        //---------------------------
        // instantiate Reports tab

        this.reportsReportCollection = new ReportsReportCollection({
            globalLookback: ns.globalLookback,
            nodeName: hostName
        });

        this.reportsReport = new ReportsReportView({
            collection: this.reportsReportCollection,
            el: '#node-report-panel #reportsReport',
            width: $('#node-report-panel #reportsReport').width(),
            nodeName: hostName
        });

        //---------------------------
        // instantiate Events tab

        this.eventsReport = new EventsReportView({
            el: '#node-report-panel #eventsReport',
            width: $('#node-report-panel #eventsReport').width(),
            nodeName: hostName,
            globalLookback: ns.globalLookback
        });

        //---------------------------
        // instantiate Details tab

        this.detailsReport = new DetailsReportView({
            el: '#node-report-panel #detailsReport'
        });

        //---------------------------
        // instantiate Logs tab

        this.logsReportCollection = new LogAnalysisCollection({});

        this.logAnalysisView = new LogSearchPageView({
            collection: this.logAnalysisCollection,
            width: $('#logsReport').width(),
            height: 300,
            el: '#logsReport',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            specificHost: this.node_uuid,
            urlRoot: "/logging/summarize/?"
        });
    },

    template: _.template('' +
        '<div id="node-report-r1" class="row">' +
        '<div id="node-report-r1-c1" class="col-md-12">' +
        '<h1><%= this.node_uuid %></h1>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-main" class="col-md-12">' +

        // buttons
        '<div class="btn-group" role="group">' +
        '<button type="button" data-title="Services" class="headerBar servicesButton active btn btn-default"><%=goldstone.contextTranslate(\'Services\', \'nodereport\')%></button>' +
        '<button type="button" data-title="Reports" class="headerBar reportsButton btn btn-default"><%=goldstone.contextTranslate(\'Reports\', \'nodereport\')%></button>' +
        '<button type="button" data-title="Events" class="headerBar eventsButton btn btn-default"><%=goldstone.contextTranslate(\'Events\', \'nodereport\')%></button>' +
        '<button type="button" data-title="Details" class="headerBar detailsButton btn btn-default"><%=goldstone.contextTranslate(\'Details\', \'nodereport\')%></button>' +
        '<button type="button" data-title="Logs" class="headerBar logsButton btn btn-default"><%=goldstone.contextTranslate(\'Logs\', \'nodereport\')%></button>' +
        '</div><br><br>' +

        '<div id="main-container" class="col-md-12">' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div id="servicesReport">' +

        // placeholder for title bar and info popover
        '<div id="service-status-title-bar"></div>' +
        '<div class="well col-md-12">' +
        '<div style="margin-left: 14px;" id="node-report-r2" class="row">' +
        '</div>' +
        '</div>' +
        '<div id="node-report-r3" class="row">' +
        '<div id="node-report-r3-c1" class="col-md-12">' +

        // placeholder for title bar and info popover
        '<div id="utilization-title-bar"></div>' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div class="well col-md-12">' +
        '<div class="col-md-4" id="cpu-usage">' +
        '<h4 class="text-center"><%=goldstone.contextTranslate(\'CPU Usage\', \'nodereport\')%></h4>' +
        '</div>' +
        '<div class="col-md-4" id="memory-usage">' +
        '<h4 class="text-center"><%=goldstone.contextTranslate(\'Memory Usage\', \'nodereport\')%></h4>' +
        '</div>' +
        '<div class="col-md-4" id="network-usage">' +
        '<h4 class="text-center"><%=goldstone.contextTranslate(\'Network Usage\', \'nodereport\')%></h4>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-r4" class="row">' +
        '<div id="node-report-r4-c1" class="col-md-12">' +

        // PENDING
        // placeholder for title bar and info popover
        // '<div id="hypervisor-title-bar"></div>' +
        // '<div id="node-report-panel" class="panel panel-primary">' +
        // '<div class="well col-md-12">' +
        // '<div class="col-md-3 text-center" id="cores-usage">' +
        // 'Cores' +
        // '</div>' +
        // '<div class="col-md-3 text-center" id="memory-usage">' +
        // 'Memory' +
        // '</div>' +
        // '<div class="col-md-6" id="vm-cpu-usage">' +
        // 'Per VM CPU Usage' +
        // '</div>' +
        // '</div>' +
        // '</div>' +

        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="col-md-12" id="reportsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="eventsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="detailsReport">&nbsp;</div>' +
        '<div class="col-md-12" id="logsReport">&nbsp;</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
;
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

var NovaReportView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
            this.vmSpawnChartView.trigger('lookbackSelectorChanged');
            this.cpuResourcesChartView.trigger('lookbackSelectorChanged');
            this.memResourcesChartView.trigger('lookbackSelectorChanged');
            this.diskResourcesChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {
        /*
        Nova Api Perf Report
        */

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova'
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Nova API Performance"),
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: goldstone.translate("API Call"),
                value: goldstone.translate("All")
            }],
            el: '#nova-report-r1-c1',
            width: $('#nova-report-r1-c1').width()
        });

        /*
        VM Spawns Chart
        */

        this.vmSpawnChart = new SpawnsCollection({
            urlPrefix: '/nova/hypervisor/spawns/'
        });

        this.vmSpawnChartView = new SpawnsView({
            chartTitle: goldstone.translate("VM Spawns"),
            collection: this.vmSpawnChart,
            height: 300,
            infoCustom: 'novaSpawns',
            el: '#nova-report-r1-c2',
            width: $('#nova-report-r1-c2').width(),
            yAxisLabel: goldstone.translate('Spawn Events')
        });

        /*
        CPU Resources Chart
        */

        this.cpuResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used']
        });

        this.cpuResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("CPU Resources"),
            collection: this.cpuResourcesChart,
            featureSet: 'cpu',
            height: 300,
            infoCustom: 'novaCpuResources',
            el: '#nova-report-r2-c1',
            width: $('#nova-report-r2-c1').width(),
            yAxisLabel: goldstone.translate('Cores')
        });

        /*
        Mem Resources Chart
        */

        this.memResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.memory_mb', 'nova.hypervisor.memory_mb_used']
        });

        this.memResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("Memory Resources"),
            collection: this.memResourcesChart,
            featureSet: 'mem',
            height: 300,
            infoCustom: 'novaMemResources',
            el: '#nova-report-r2-c2',
            width: $('#nova-report-r2-c2').width(),
            yAxisLabel: goldstone.translate('MB')
        });

        /*
        Disk Resources Chart
        */

        this.diskResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.local_gb', 'nova.hypervisor.local_gb_used']
        });

        this.diskResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("Disk Resources"),
            collection: this.diskResourcesChart,
            featureSet: 'disk',
            height: 300,
            infoCustom: 'novaDiskResources',
            el: '#nova-report-r3-c1',
            width: $('#nova-report-r3-c1').width(),
            yAxisLabel: goldstone.translate('GB')
        });

    },

    template: _.template('' +
        '<div id="nova-report-r1" class="row">' +
        '<div id="nova-report-r1-c1" class="col-md-6"></div>' +
        '<div id="nova-report-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="nova-report-r2" class="row">' +
        '<div id="nova-report-r2-c1" class="col-md-6"></div>' +
        '<div id="nova-report-r2-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="nova-report-r3" class="row">' +
        '<div id="nova-report-r3-c1" class="col-md-6"></div>' +
        '<div id="nova-report-r3-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
;
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

var PasswordResetView = GoldstoneBaseView2.extend({

    initialize: function(options) {
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        $('.login-form').on('submit', function(e) {
            e.preventDefault();
            self.submitRequest($(this).serialize());
        });
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/password/reset/', input, function() {})
            .done(function(success) {

                // and add a message to the top of the screen that logs what
                // is returned from the call
                goldstone.raiseInfo('Password reset instructions have been emailed to you<br>Please click the link in your email');
            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call

                // TODO: change this after SMTP handling is set up
                // to reflect the proper error
                goldstone.raiseInfo(fail.responseJSON.detail);
            });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    }

});
;
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
This view makes up the "Reports" tab of nodeReportView.js
It is sub-classed from GoldstoneBaseView.

Instantiated on nodeReportView as:

this.reportsReportCollection = new ReportsReportCollection({
    globalLookback: ns.globalLookback,
    nodeName: hostName
});

this.reportsReport = new ReportsReportView({
    collection: this.reportsReportCollection,
    el: '#node-report-panel #reportsReport',
    width: $('#node-report-panel #reportsReport').width(),
    nodeName: hostName
});
*/

var ReportsReportView = GoldstoneBaseView.extend({

    defaults: {},

    urlGen: function(report) {

        // request page_size=1 in order to only
        // retrieve the latest result

        var urlRouteConstruction = '/core/reports/?name=' +
            report + '&page_size=1&node=' +
            this.defaults.hostName;
        return urlRouteConstruction;
    },

    initialize: function(options) {

        ReportsReportView.__super__.initialize.apply(this, arguments);
    },

    processOptions: function() {
        ReportsReportView.__super__.processOptions.apply(this, arguments);

        this.defaults.hostName = this.options.nodeName;
        this.defaults.globalLookback = this.options.globalLookback;

    },

    processListeners: function() {

        var ns = this.defaults;
        var self = this;

        // triggered whenever this.collection finishes fetching
        this.listenTo(this.collection, 'sync', function() {

            // removes spinner that was appended
            // during chart-load
            self.hideSpinner();

            // clears existing 'Reports Available' in dropdown
            $(self.el).find('.reports-available-dropdown-menu > li').remove();

            // if no reports available, appends 'No reports available'
            if (self.collection.toJSON()[0] === undefined || self.collection.toJSON()[0].result.length === 0) {

                $(self.el).find('.reports-available-dropdown-menu').append("<li id='report-result'>" + goldstone.contextTranslate('No reports available.', 'reportsreport') + "</li>");


            } else {
                self.populateReportsDropdown();
            }

            self.clearDataErrorMessage();
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        // this is triggered by a listener set on nodeReportView.js
        this.on('lookbackSelectorChanged', function() {

            // reconstructs the url to fetch in this.collection
            self.collection.defaults.globalLookback = $('#global-lookback-range').val();

            // fetches reports available as far back as the global lookback period
            self.collection.retrieveData();

        });
    },

    processMargins: function() {
        // overwritten so as not to conflict with super-class'
        // method that will calculate irrelevant margins.
        return null;
    },

    render: function() {
        $(this.el).append(this.template());
        $(this.el).find('.refreshed-report-container').append(this.dataTableTemplate());
        return this;
    },

    standardInit: function() {
        // overwritten so as not to conflict with super-class'
        // method that will calculate irrelevant margins.
        return null;
    },

    dataPrep: function(tableData) {

        var ns = this.defaults;
        var self = this;

        // initialize array that will be returned after processing
        var finalResults = [];

        if (typeof(tableData[0]) === "object") {

            // chained underscore function that will scan for the existing
            // object keys, and return a list of the unique keys
            // as not every object contains every key
            var uniqueObjectKeys = _.uniq(_.flatten(_.map(tableData, function(item) {
                return Object.keys(item);
            })));

            // if there is a unique key with "name" somewhere in it,
            // reorder the keys so that it is first

            var keysWithName = [];
            for (var i = 0; i < uniqueObjectKeys.length; i++) {
                var item = uniqueObjectKeys[i];
                if (item.indexOf('name') === -1) {
                    continue;
                } else {
                    var spliced = uniqueObjectKeys.splice(i, 1);
                    keysWithName.push(spliced);
                    i--;
                }
            }
            _.each(keysWithName, function(item) {
                uniqueObjectKeys.unshift(item[0]);
            });

            // append data table headers that match the unique keys
            _.each(uniqueObjectKeys, function(item) {
                $('.data-table-header-container').append('<th>' + item + '</th>');
            });

            // iterate through tableData, and push object values to results
            // array, inserting '' where there is no existing value

            _.each(tableData, function(value) {
                var subresult = [];
                _.each(uniqueObjectKeys, function(item) {
                    if (value[item] === undefined) {
                        subresult.push('');
                    } else {
                        subresult.push(value[item]);
                    }
                });
                finalResults.push(subresult);
            });

        } else {

            $('.data-table-header-container').append('<th>Result</th>');
            _.each(tableData, function(item) {
                finalResults.push([item]);
            });
        }
        return finalResults;
    },

    drawSearchTable: function(location, data) {

        if (data !== null) {
            data = [goldstone.translate('No results within selected time range.')];
        }

        var ns = this.defaults;
        var self = this;
        var oTable;

        // removes initial placeholder message
        $(this.el).find('.reports-info-container').remove();

        if ($.fn.dataTable.isDataTable(location)) {

            // if dataTable already exists:
            oTable = $(location).DataTable();

            // complete remove it from memory and the dom
            oTable.destroy({
                remove: true
            });

            // and re-append the table structure that will be repopulated
            // with the new data
            $(this.el).find('.refreshed-report-container')
                .html(this.dataTableTemplate());
        }

        data = this.dataPrep(data);
        var oTableParams = {
            "info": true,
            "processing": false,
            "lengthChange": true,
            "paging": true,
            "searching": true,
            "order": [
                [0, 'asc']
            ],
            "ordering": true,
            "data": data,
            "serverSide": false
        };
        oTable = $(location).DataTable(oTableParams);

    },

    populateReportsDropdown: function() {
        var ns = this.defaults;
        var self = this;

        _.each(self.collection.toJSON()[0].result, function(item) {
            $(self.el).find('.reports-available-dropdown-menu').append('<li style="cursor: context-menu;" id="report-result">' + _.keys(item)[0] + "</li>");
        });

        // add click listeners to dropdown entries
        $(self.el).find('.reports-available-dropdown-menu > li').on('click', function(e) {
            ns.spinnerDisplay = "inline";
            $(self.el).find('#spinner').show();

            // $.get report based on
            var reportUrl = self.urlGen(e.currentTarget.innerText);

            $.ajax({
                url: reportUrl,
                success: function(data) {
                    $(self.el).find('.panel-header-report-title').text(': ' + e.currentTarget.innerText);
                    $(self.el).find('#spinner').hide();

                    // render data table:
                    self.drawSearchTable('#reports-result-table', data.results[0].value);
                    self.clearDataErrorMessage();
                },
                error: function(data) {
                    self.dataErrorMessage(null, data);
                }
            });

        });
    },

    template: _.template(

        // render dropdown button
        '<div class="dropdown">' +
        '<button id="dLabel" type="button" class="btn btn-default" data-toggle="dropdown" aria-haspopup="true" role="button" aria-expanded="false">' +
        '<%=goldstone.contextTranslate(\'Reports Available\', \'reportsreport\')%> ' +
        '<span class="caret"></span>' +
        '</button>' +
        '<ul class="reports-available-dropdown-menu dropdown-menu" role="menu" aria-labelledby="dLabel">' +
        '<li><%=goldstone.contextTranslate(\'Reports list loading or not available.\', \'reportsreport\')%></li>' +
        '</ul>' +
        '</div><br>' +

        // spinner container
        '<div class="reports-spinner-container"></div>' +

        // render report data title bar
        '<div class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> <%=goldstone.contextTranslate(\'Report Data\', \'reportsreport\')%>' +
        '<span class="panel-header-report-title"></span>' +
        '</h3>' +
        '</div>' +

        // initially rendered message this will be overwritten by dataTable
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="reports-info-container">' +
        '<br><%=goldstone.contextTranslate(\'Selecting a report from the dropdown above will populate this area with the report results.\', \'reportsreport\')%>' +
        '</div>' +

        '</div>' +
        '<div class="refreshed-report-container"></div>'
    ),

    dataTableTemplate: _.template(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead>' +
        '<tr class="header data-table-header-container">' +

        // necessary <th> is appended here by jQuery in this.dataPrep()
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>'
    )


});
;
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
Instantiated on nodeReportView.js similar to:

this.serviceStatusChart = new ServiceStatusCollection({
    nodeName: hostName
});

this.serviceStatusChartView = new ServiceStatusView({
    collection: this.serviceStatusChart,
    el: '#node-report-main #node-report-r2',
    width: $('#node-report-main #node-report-r2').width(),
    globalLookback: ns.globalLookback
});
*/

var ServiceStatusView = GoldstoneBaseView.extend({

    processOptions: function() {
        ServiceStatusView.__super__.processOptions.call(this);

        this.defaults.spinnerPlace = '.spinnerPlace';
    },

    processListeners: function() {
        this.listenTo(this.collection, 'sync', this.update);
        this.listenTo(this.collection, 'error', this.dataErrorMessage);
        this.on('lookbackSelectorChanged', function() {
            this.defaults.spinnerDisplay = 'inline';
            $(this.el).find('#spinner').show();
            this.collection.retrieveData();
        });
    },

    standardInit: function() {},

    specialInit: function() {},

    dataErrorMessage: function(message, errorMessage) {
        ServiceStatusView.__super__.dataErrorMessage.apply(this, arguments);
    },

    classSelector: function(item) {
        if (item === "running") {
            return 'alert alert-success';
        }
        return 'alert alert-danger fa fa-exclamation-circle';
    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();

        var data = allthelogs;
        // inside 'data', the results are stored with the
        // timestamp property in descending order.
        // the set can be achieved from _.uniq + data.name;

        var uniqServiceNames = _.uniq(_.map(data, function(item) {
            return item.name;
        }));


        var novelServiceBreadcrumb = {};

        _.each(uniqServiceNames, function(item) {
            novelServiceBreadcrumb[item] = true;
        });


        // set a counter for the length of uniq(data.name);
        var uniqSetSize = _.keys(uniqServiceNames).length;

        /*
        iterate through data and as novel service
        names are located, attach the status at that
        moment to that service name and don't reapply
        it, as the next result is not the most recent.
        */

        var finalData = [];

        for (var item in data) {
            if (novelServiceBreadcrumb[data[item].name]) {
                finalData.push(data[item]);
                novelServiceBreadcrumb[data[item].name] = false;

                // when finding a novel name, decrement the set length counter.
                uniqSetSize--;

                // when the counter reaches 0, the set is
                // complete and the most recent
                // results have been assigned to each of
                // the items in the set.
                if (uniqSetSize === 0) {
                    break;
                }
            }
        }

        // final formatting of the results as
        // [{'serviceName': status}...]
        _.each(finalData, function(item, i) {
            var resultName;
            var resultObject = {};
            if (item.name && item.name.indexOf('.') !== -1) {
                resultName = item.name.slice(item.name.lastIndexOf('.') + 1);
            } else {
                resultName = item.name;
            }
            resultObject[resultName] = item.value;
            finalData[i] = resultObject;
        });

        return finalData;

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        this.hideSpinner();

        var allthelogs = this.collectionPrep();

        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        $(this.el).find('.mainContainer .toRemove').off();
        $(this.el).find('.mainContainer').empty();

        var nodeNames = [];

        _.each(allthelogs, function(item) {
            nodeNames.push(item);
        });

        this.sorter(nodeNames);

        _.each(nodeNames, function(item, i) {

            var itemKeyFull = '';
            var itemValue = _.values(nodeNames[i])[0];
            var itemKey = _.keys(nodeNames[i])[0];
            if (itemKey.length > 27) {
                itemKeyFull = _.keys(nodeNames[i])[0];
                itemKey = itemKey.slice(0, 27) + '...';
            }

            $(self.el).find('.mainContainer').append('<div style="width: 170px;' +
                'height: 22px; font-size:11px; margin-bottom: 0; ' +
                ' text-align:center; padding: 3px 0;" data-toggle="tooltip" ' +
                'data-placement="top" title="' + itemKeyFull +
                '" class="col-xs-1 toRemove ' + this.classSelector(itemValue) +
                '"> ' + itemKey + '</div>');
        }, this);

        $(this.el).find('.mainContainer .toRemove').on('mouseover', function() {
            $(this).tooltip('show');
        });
    },

    sorter: function(data) {

        return data.sort(function(a, b) {
            if (Object.keys(a) < Object.keys(b)) {
                return -1;
            }
            if (Object.keys(a) > Object.keys(b)) {
                return 1;
            } else {
                return 0;
            }
        });

    },

    render: function() {
        $(this.el).append(this.template());
        return this;
    },

    template: _.template('<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="spinnerPlace"></div>' +
        '<div class="mainContainer"></div>')

});
;
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

var SettingsPageView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.el = this.options.el;
        this.render();
        this.getUserSettings();
        this.addHandlers();
    },

    onClose: function() {
        $('#global-lookback-range').show();
        $('#global-refresh-range').show();
    },

    renderTenantSettingsPageLink: function() {
        $('#tenant-settings-button').append('' +
            '<h3>' + goldstone.translate("Additional Actions") + '</h3>' +
            '<button class="btn btn-lg btn-primary btn-block modify">' + goldstone.translate("Modify Tenant Settings") + '</button>');

        $('button.modify').on('click', function() {
            window.location.href = "#settings/tenants";
        });
    },

    // abstracted to work for both forms, and append the correct
    // message upon successful form submission
    submitRequest: function(type, url, data, message) {
        var self = this;

        // Upon clicking the submit button, the serialized
        // user input is sent via type (POST/PUT/etc).
        // If successful, invoke "done". If not, invoke "fail"

        $.ajax({
            type: type,
            url: url,
            data: data
        }).done(function(success) {
            self.dataErrorMessage(message);
        })
            .fail(function(fail) {
                try {
                    self.dataErrorMessage(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    self.dataErrorMessage(fail.responseText + e);
                }
            });
    },

    render: function() {

        $('#global-lookback-range').hide();
        $('#global-refresh-range').hide();

        this.$el.html(this.template());

        // iterate through goldstone.i18nJSON and render a dropdown
        // selector item for each of the languages present
        this.renderLanguageChoices();

        return this;
    },

    renderLanguageChoices: function() {

        // defined on router.html
        _.each(goldstone.i18nJSON, function(item, key) {
            $('#language-name').append('<option value="' + key + '">' + key + '</option>');
        });
    },

    getUserSettings: function() {
        var self = this;

        $.get('/user/')
            .done(function(result) {
                $(self.el).find('[name="username"]').val(result.username);
                $(self.el).find('[name="first_name"]').val(result.first_name);
                $(self.el).find('[name="last_name"]').val(result.last_name);
                $(self.el).find('[name="email"]').val(result.email);

                // result object contains tenant_admin field (true|false)
                if (result.tenant_admin || result.is_superuser) {

                    // if true, render link to tenant admin settings page
                    if (result.tenant_admin === true || result.is_superuser === true) {
                        self.renderTenantSettingsPageLink();
                    }
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo(goldstone.contextTranslate('Could not load user settings.', 'settingspage'));
            });

        // get current user prefs
        var userTheme = JSON.parse(localStorage.getItem('userPrefs'));

        // set dropdown for theme selection to current theme preference
        if (userTheme && userTheme.theme) {
            $('#theme-name').val(userTheme.theme);
        }

        // set dropdown for topology tree style selection
        // to current style preference
        if (userTheme && userTheme.topoTreeStyle) {
            $('#topo-tree-name').val(userTheme.topoTreeStyle);
        }

        // set dropdown for language selection to
        // current language preference
        if (userTheme && userTheme.i18n) {
            $('#language-name').val(userTheme.i18n);
        }

    },


    addHandlers: function() {
        var self = this;

        // add listener to settings form submission button
        $('.settings-form').on('submit', function(e) {
            e.preventDefault();

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="username"]');
            self.trimInputField('[name="first_name"]');
            self.trimInputField('[name="last_name"]');

            // ('[name="email"]') seems to have native .trim()
            // support based on the type="email"

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/user/', $(this).serialize(), goldstone.contextTranslate('Settings update successful', 'settingspage'));
        });

        // add listener to password form submission button
        $('.password-reset-form').on('submit', function(e) {
            e.preventDefault();
            self.submitRequest('POST', '/accounts/password/', $(this).serialize(), goldstone.contextTranslate('Password update successful', 'settingspage'));

            // clear password form after submission, success or not
            $('.password-reset-form').find('[name="current_password"]').val('');
            $('.password-reset-form').find('[name="new_password"]').val('');
        });

        // add listener to theme selection drop-down
        // userPrefsView is instantiated in router.html
        $('#theme-name').on('change', function() {
            var theme = $('#theme-name').val();
            if (theme === 'dark') {
                goldstone.userPrefsView.trigger('darkThemeSelected');
            }
            if (theme === 'light') {
                goldstone.userPrefsView.trigger('lightThemeSelected');
            }
        });

        // add listener to theme selection drop-down
        // userPrefsView is instantiated in router.html
        $('#topo-tree-name').on('change', function() {
            var topoStyle = $('#topo-tree-name').val();
            if (topoStyle === 'collapse') {
                goldstone.userPrefsView.trigger('collapseTreeSelected');
            }
            if (topoStyle === 'zoom') {
                goldstone.userPrefsView.trigger('zoomTreeSelected');
            }
        });

        // add listener to language selection drop-down
        // userPrefsView is instantiated in router.html
        $('#language-name').on('change', function() {
            var language = $('#language-name').val();
            goldstone.userPrefsView.trigger('i18nLanguageSelected', language);

            // for this page only, re-render content upon language page
            // to reflect translatable fields immediately
            self.render();
            self.getUserSettings();
            self.addHandlers();
        });

    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +
        '<div class="container">' +

        // theme switcher
        '<div class="row col-md-offset-2">' +

        '<h3><%= goldstone.translate("User Settings") %></h3>' +

        // dark/light theme selector
        '<div class="col-md-2">' +
        '<h5><%=goldstone.translate("Theme Settings")%></h5>' +
        '<form class="theme-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="theme-name">' +
        '<option value="light"><%=goldstone.contextTranslate(\'Light\', \'settingspage\')%></option>' +
        '<option value="dark"><%=goldstone.contextTranslate(\'Dark\', \'settingspage\')%></option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +


        // topology tree style
        '<div class="col-md-2">' +
        '<h5><%=goldstone.translate("Topology Tree Style")%></h5>' +
        '<form class="topo-tree-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="topo-tree-name">' +
        '<option value="collapse"><%=goldstone.contextTranslate(\'Collapse\', \'settingspage\')%></option>' +
        '<option value="zoom"><%=goldstone.contextTranslate(\'Zoom\', \'settingspage\')%></option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +

        // language preference
        '<div class="col-md-2">' +
        '<h5><%= goldstone.translate("Language") %></h5>' +
        '<form class="language-selector" role="form">' +
        '<div class="form-group">' +
        '<div class="col-xl-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="language-name">' +
        // dynamically filled in via renderLanguageChoices()
        // '<option value="English">English</option>' +
        // '<option value="Japanese">Japanese</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +

        // closes row
        '</div>' +

        '<hr>' +

        // popup message row
        '<div class="row">' +
        '<div class="col-md-8 col-md-offset-2">' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<br></div>' +
        '</div>' +

        // personal settings form
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-2">' +
        '<form class="settings-form">' +
        '<h3><%=goldstone.translate("Update Personal Settings")%></h3>' +
        '<label for="inputUsername"><%=goldstone.translate("Username")%></label>' +
        '<input id="inputUsername" name="username" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Username\', \'settingspage\')%>" required>' +
        '<label for="inputFirstname"><%=goldstone.contextTranslate(\'First Name\', \'settingspage\')%></label>' +
        '<input id="inputFirstname" name="first_name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'First Name\', \'settingspage\')%>" autofocus>' +
        '<label for="inputLastname"><%=goldstone.contextTranslate(\'Last Name\', \'settingspage\')%></label>' +
        '<input id="inputLastname" name="last_name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Last Name\', \'settingspage\')%>">' +
        '<label for="inputEmail"><%=goldstone.contextTranslate(\'Email\', \'settingspage\')%></label>' +
        '<input id="inputEmail" name="email" type="email" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Email\', \'settingspage\')%>">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.translate("Update")%></button>' +
        '</form>' +
        '</div>' +

        // password reset form
        '<div class="col-md-4">' +
        '<form class="password-reset-form">' +
        '<h3><%=goldstone.translate("Change Password")%></h3>' +
        '<label for="inputCurrentPassword"><%=goldstone.contextTranslate(\'Current Password\', \'settingspage\')%></label>' +
        '<input id="inputCurrentPassword" name="current_password" type="password" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Current Password\', \'settingspage\')%>" required>' +
        '<label for="inputNewPassword"><%=goldstone.contextTranslate(\'New Password\', \'settingspage\')%></label>' +
        '<input id="inputNewPassword" name="new_password" type="password" class="form-control" placeholder="<%=goldstone.contextTranslate(\'New Password\', \'settingspage\')%>" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.translate("Change Password")%></button>' +
        '</form>' +
        '</div>' +

        // close divs for row/container
        '</div>' +
        '</div>' +

        // tenant settings link
        '<div class="container">' +
        '<div class="row"><hr>' +
        '<div class="col-md-4 col-md-offset-2" id="tenant-settings-button">' +
        '</div>' +
        '</div>' +
        '</div>'


    )

});
;
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
View is currently directly implemented as Nova VM Spawns Viz
and extended into Nova CPU/Memory/Disk Resource Charts

instantiated on novaReportView similar to:

this.vmSpawnChart = new SpawnsCollection({
    urlPrefix: '/nova/hypervisor/spawns/'
});

this.vmSpawnChartView = new SpawnsView({
    chartTitle: "VM Spawns",
    collection: this.vmSpawnChart,
    height: 300,
    infoCustom: 'novaSpawns',
    el: '#nova-report-r1-c2',
    width: $('#nova-report-r1-c2').width(),
    yAxisLabel: 'Spawn Events'
});
*/

var SpawnsView = GoldstoneBaseView.extend({

    defaults: {
        margin: {
            top: 45,
            right: 40,
            bottom: 60,
            left: 70
        }
    },

    processOptions: function() {

        // this will invoke the processOptions method of the parent view,
        // and also add an additional param of featureSet which is used
        // to create a polymorphic interface for a variety of charts
        SpawnsView.__super__.processOptions.apply(this, arguments);

        this.defaults.featureSet = this.options.featureSet || null;
    },

    specialInit: function() {
        var ns = this.defaults;

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        ns.color = d3.scale.ordinal()
            .range(ns.colorArray.distinct['2R']);
    },

    dataPrep: function(data) {

        /*
        this is where the fetched JSON payload is transformed into a
        dataset than can be consumed by the D3 charts
        each chart may have its own perculiarities

        IMPORTANT:
        the order of items that are 'push'ed into the
        result array matters. After 'eventTime', the items
        will be stacked on the graph from the bottom of
        the graph upward. Or another way of saying it is
        the first item listed will be first one to be rendered
        from the x-axis of the graph going upward.
        */

        var ns = this.defaults;
        var uniqTimestamps;
        var result = [];

        // Spawns Resources chart data prep
        /*
            {"1429032900000":
                {"count":1,
                "success":
                    [
                        {"true":1}
                    ]
                }
            }
            */

        _.each(data, function(item) {
            var logTime = _.keys(item)[0];
            var success = _.pluck(item[logTime].success, 'true');
            success = success[0] || 0;
            var failure = _.pluck(item[logTime].success, 'false');
            failure = failure[0] || 0;
            result.push({
                "eventTime": logTime,
                "Success": success,
                "Failure": failure
            });
        });

        return result;
    },

    computeHiddenBarText: function(d) {
        var ns = this.defaults;
        /*
        filter function strips keys that are irrelevant to the d3.tip:

        converts from: {Physical: 31872, Used: 4096, Virtual: 47808,
        eventTime: "1424556000000", stackedBarPrep: [],
        total: 47808}

        to: ["Virtual", "Physical", "Used"]
        */

        // reverses result to match the order in the chart legend
        var valuesToReport = _.filter((_.keys(d)), function(item) {
            return item !== "eventTime" && item !== "stackedBarPrep" && item !== "total";
        }).reverse();

        var result = "";

        // matches time formatting of api perf charts
        result += moment(+d.eventTime).format() + '<br>';

        valuesToReport.forEach(function(item) {
            result += item + ': ' + d[item] + '<br>';
        });

        return result;
    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        var data = this.collection.toJSON();

        // data morphed through dataPrep into:
        // {
        //     "eventTime": "1424586240000",
        //     "Used": 6,
        //     "Physical": 16,
        //     "Virtual": 256
        // });
        data = this.dataPrep(data);

        this.hideSpinner();

        // clear elements from previous render
        $(this.el).find('svg').find('rect').remove();
        $(this.el).find('svg').find('line').remove();
        $(this.el).find('svg').find('.axis').remove();
        $(this.el).find('svg').find('.legend').remove();
        $(this.el).find('svg').find('path').remove();
        $(this.el).find('svg').find('circle').remove();
        $(this.el + '.d3-tip').detach();

        // if empty set, append info popup and stop
        if (this.checkReturnedDataSet(data) === false) {
            return;
        }

        // maps keys such as "Used / Physical / Virtual" to a color
        // but skips mapping "eventTime" to a color
        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "eventTime";
        }));

        /*
        forEach morphs data into:
        {
            "eventTime": "1424586240000",
            "Used": 6,
            "Physical": 16,
            "Virtual": 256,
            stackedBarPrep: [
                {
                    name: "Used",
                    y0: 0,
                    y1: 6
                },
                {
                    name: "Physical",
                    y0: 6,
                    y1: 22,
                },
                {
                    name: "Virtual",
                    y0: 22,
                    y1: 278,
                },
            ],
            total: 278
        });
        */

        data.forEach(function(d) {
            var y0 = 0;

            // calculates heights of each stacked bar by adding
            // to the heights of the previous bars
            d.stackedBarPrep = ns.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });

            // this is the height of the last element, and used to
            // calculate the domain of the y-axis
            d.total = d.stackedBarPrep[d.stackedBarPrep.length - 1].y1;

            // or for the charts with paths, use the top line as the
            // total, which will inform that domain of the y-axis
            // d.Virtual and d.Total are the top lines on their
            // respective charts
            if (d.Virtual) {
                d.total = d.Virtual;
            }
            if (d.Total) {
                d.total = d.Total;
            }
        });

        // the forEach operation creates chaos in the order of the set
        // must _.sortBy to return it to an array sorted by eventTime
        data = _.sortBy(data, function(item) {
            return item.eventTime;
        });

        ns.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        // IMPORTANT: see data.forEach above to make sure total is properly
        // calculated if additional data paramas are introduced to this viz
        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        // add x axis
        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        // add y axis
        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // add primary svg g layer
        ns.event = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.eventTime) + ",0)";
            });

        // add svg g layer for solid lines
        ns.solidLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        // add svg g layer for dashed lines
        ns.dashedLineCanvas = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        // add svg g layer for hidden rects
        ns.hiddenBarsCanvas = ns.chart.selectAll(".hidden")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g");

        // initialize d3.tip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return self.computeHiddenBarText(d);
            });

        // Invoke the tip in the context of your visualization
        ns.chart.call(tip);

        // used below to determing whether to render as
        // a "rect" or "line" by affecting fill and stroke opacity below
        var showOrHide = {
            "Failure": true,
            "Success": true,
            "Virtual": false,
            "Physical": false,
            "Total": false,
            "Used": true
        };

        // append rectangles
        ns.event.selectAll("rect")
            .data(function(d) {
                return d.stackedBarPrep;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                var segmentWidth = (ns.mw / data.length);

                // spacing corrected for proportional
                // gaps between rects
                return segmentWidth - segmentWidth * 0.07;
            })
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return ns.color(d.name);
            })
            .attr("stroke-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 1;
                }
            })
            .attr("fill-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 0.8;
                }
            })
            .attr("stroke-width", 2)
            .style("fill", function(d) {
                return ns.color(d.name);
            });

        // append hidden bars
        ns.hiddenBarsCanvas.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("width", function(d) {
                var hiddenBarWidth = (ns.mw / data.length);
                return hiddenBarWidth - hiddenBarWidth * 0.07;
            })
            .attr("opacity", "0")
            .attr("x", function(d) {
                return ns.x(d.eventTime);
            })
            .attr("y", 0)
            .attr("height", function(d) {
                return ns.mh;
            }).on('mouseenter', function(d) {

                // coax the pointer to line up with the bar center
                var nudge = (ns.mw / data.length) * 0.5;
                var targ = d3.select(self.el).select('rect');
                tip.offset([20, -nudge]).show(d, targ);
            }).on('mouseleave', function() {
                tip.hide();
            });

        // abstracts the line generator to accept a data param
        // variable. will be used in the path generator
        var lineFunctionGenerator = function(param) {
            return d3.svg.line()
                .interpolate("linear")
                .x(function(d) {
                    return ns.x(d.eventTime);
                })
                .y(function(d) {
                    return ns.y(d[param]);
                });
        };

        // abstracts the path generator to accept a data param
        // and creates a solid line with the appropriate color
        var solidPathGenerator = function(param) {
            return ns.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        };

        // abstracts the path generator to accept a data param
        // and creates a dashed line with the appropriate color
        var dashedPathGenerator = function(param) {
            return ns.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return ns.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-dasharray", "5, 2");
        };

        // lineFunction must be a named local
        // variable as it will be called by
        // the pathGenerator function that immediately follows
        var lineFunction;

        // appends chart legends
        var legendSpecs = {
            spawn: [
                ['Fail', 1],
                ['Success', 0]
            ]
        };
        this.appendLegend(legendSpecs.spawn);
    },

    appendLegend: function(legendSpecs) {

        // abstracts the appending of chart legends based on the
        // passed in array params [['Title', colorSetIndex],['Title', colorSetIndex'],...]

        var ns = this.defaults;

        _.each(legendSpecs, function(item) {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', item[0])
                .attr('data-legend', item[0])
                .attr('data-legend-color', ns.color.range()[item[1]]);
        });

        var legend = ns.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20,-35)')
            .attr('opacity', 1.0)
            .call(d3.legend);
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {

        this.$el.append(new ChartHeaderView({
            chartTitle: this.defaults.chartTitle,
            infoText: this.defaults.infoCustom
        }).el);

        $(this.el).find('.mainContainer').append(this.template());
        return this;
    }

});
;
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

var TenantSettingsPageView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function(options) {
        this.el = this.options.el;
        this.render();
        this.getTenantAndOSSettings();
        this.addHandlers();
    },

    onClose: function() {
        $('#global-lookback-range').show();
        $('#global-refresh-range').show();
    },

    addHandlers: function() {
        var self = this;

        // add listener to settings form submission button
        $('.tenant-settings-form').on('submit', function(e) {
            // prevens page jump upon pressing submit button
            e.preventDefault();

            // if there is no selected tenant, prevent ability to submit form
            if ($('#formTenantId').text() === '') {
                self.dataErrorMessage(goldstone.contextTranslate("Must select tenant from list above", "tenantsettings"));
                return;
            }

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="name"]');
            self.trimInputField('[name="owner"]');
            self.trimInputField('[name="owner_contact"]');
            var tenandId = $('#formTenantId').text();

            // email fields seem to have native .trim() support

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/tenants/' + tenandId + '/', $(this).serialize(), goldstone.contextTranslate('Tenant Settings update successful', 'tenantsettings'));
        });

        $('.openstack-settings-form').on('submit', function(e) {
            // prevens page jump upon pressing submit button
            e.preventDefault();

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="os_auth_url"]');
            self.trimInputField('[name="os_name"]');
            self.trimInputField('[name="os_password"]');
            self.trimInputField('[name="os_username"]');

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/user/', $(this).serialize(), goldstone.contextTranslate('OS Settings update successful', 'tenantsettings'));
        });
    },

    drawDataTable: function(json) {

        var self = this;

        // make a dataTable
        var location = '#tenants-single-rsrc-table';
        var oTable;
        var keys = Object.keys(json);
        var data = _.map(keys, function(k) {
            var item = json[k];
            return [item.name, item.owner, item.owner_contact, item.uuid];
        });

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "autoWidth": true,
                "info": false,
                "paging": true,
                "searching": true,
                "columns": [{
                    "title": goldstone.contextTranslate("Tenant", "tenantsettings")
                }, {
                    "title": goldstone.contextTranslate("Owner Username", "tenantsettings")
                }, {
                    "title": goldstone.contextTranslate("Owner Contact", "tenantsettings")
                }, {
                    "title": goldstone.contextTranslate("Tenant ID", "tenantsettings")
                }]
            };
            oTable = $(location).DataTable(oTableParams);
        }

        // IMPORTANT: failure to remove click listeners before appending new ones
        // will continue to create additional listeners and memory leaks.
        $("#tenants-single-rsrc-table tbody").off();

        // add click listeners to pass data values to Update Tenant Settings form.
        $("#tenants-single-rsrc-table tbody").on('click', 'tr', function() {
            var row = oTable.row(this).data();

            $(self.el).find('[name="name"]').val(row[0]);
            $(self.el).find('[name="owner"]').val(row[1]);
            $(self.el).find('[name="owner_contact"]').val(row[2]);
            $(self.el).find('#formTenantId').text(row[3]);

            self.clearDataErrorMessage();
        });
    },

    getTenantAndOSSettings: function() {
        var self = this;

        $.get('/tenants/')
            .done(function(result) {

                if (result.results) {
                    self.drawDataTable(result.results);
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo(goldstone.contextTranslate("Could not load tenant settings", "tenantsettings"));
            });

        $.get('/user/')
            .done(function(result) {
                var $form = $('.openstack-settings-form');
                $form.find('[name="username"]').val(result.username);
                $form.find('[name="os_auth_url"]').val(result.os_auth_url);
                $form.find('[name="os_name"]').val(result.os_name);
                $form.find('[name="os_password"]').val(result.os_password);
                $form.find('[name="os_username"]').val(result.os_username);

                // in case of landing on this page via is_superuser === true,
                // OpenStack settings are not a valid target for updating.
                // Check for this via presence of the OpenStack tenant name
                if(result.os_name === undefined) {

                    // disable all form fields and update button
                    $form.find('input').attr('disabled', 'true');
                    $form.find('button').attr('disabled', true);
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo(goldstone.contextTranslate("Could not load OpenStack settings", "tenantsettings"));
            });
    },

    // abstracted to work for multiple forms, and append the correct
    // message upon successful form submission
    submitRequest: function(type, url, data, message) {
        var self = this;

        // Upon clicking the submit button, the serialized
        // user input is sent via type (POST/PUT/etc).
        // If successful, invoke "done". If not, invoke "fail"

        $.ajax({
            type: type,
            url: url,
            data: data
        })
            .done(function(success) {
                self.dataErrorMessage(message);
            })
            .fail(function(fail) {
                try {
                    self.dataErrorMessage(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    self.dataErrorMessage(fail.responseText + e);
                }
            })
            .always(function() {
                self.getTenantAndOSSettings();
            });
    },

    render: function() {

        $('#global-lookback-range').hide();
        $('#global-refresh-range').hide();

        this.$el.html(this.template());
        this.dataErrorMessage(goldstone.contextTranslate('Click row above to edit', 'tenantsettings'));
        return this;
    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +

        // dataTable
        '<div class="panel panel-primary tenant_results_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> <%=goldstone.contextTranslate(\'Tenants\', \'tenantsettings\')%>' +
        '</h3>' +
        '</div>' +
        '</div>' +

        '<div class="panel-body">' +
        '<table id="tenants-single-rsrc-table" class="table"></table>' +
        '</div>' +
        // end data table


        '<div class="container">' +

        // popup message row
        '<div class="row">' +
        '<div class="col-md-8 col-md-offset-2">' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<br></div>' +
        '</div>' +

        '<div class="row">' +

        // update settings form
        '<div class="col-md-4 col-md-offset-2">' +
        '<form class="tenant-settings-form">' +
        '<h3><%=goldstone.contextTranslate(\'Goldstone Tenant Settings\', \'tenantsettings\')%></h3>' +
        '<label for="name"><%=goldstone.contextTranslate(\'Tenant Name\', \'tenantsettings\')%></label>' +
        '<input name="name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Tenant Name\', \'tenantsettings\')%>" required>' +
        '<label for="owner"><%=goldstone.contextTranslate(\'Owner Name\', \'tenantsettings\')%></label>' +
        '<input name="owner" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Owner Name\', \'tenantsettings\')%>" required>' +
        '<label for="owner_contact"><%=goldstone.contextTranslate(\'Owner Email\', \'tenantsettings\')%></label>' +
        '<input name="owner_contact" type="email" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Owner Email\', \'tenantsettings\')%>">' +
        '<br><div><%=goldstone.contextTranslate(\'Tenant ID\', \'tenantsettings\')%>: <span id="formTenantId"><%=goldstone.contextTranslate(\'select from above\', \'tenantsettings\')%></span></div>' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.contextTranslate(\'Update\', \'tenantsettings\')%></button>' +
        '</form>' +
        '</div>' +

        // update openstack settings form
        '<div class="col-md-4">' +
        '<form class="openstack-settings-form">' +
        '<h3><%=goldstone.contextTranslate(\'OpenStack Settings\', \'tenantsettings\')%></h3>' +
        '<label for="os_name"><%=goldstone.contextTranslate(\'OpenStack Tenant Name\', \'tenantsettings\')%></label>' +
        '<input name="os_name" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'OpenStack Tenant Name\', \'tenantsettings\')%>">' +
        '<label for="os_username"><%=goldstone.contextTranslate(\'OpenStack Username\', \'tenantsettings\')%></label>' +
        '<input name="os_username" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'OpenStack Username\', \'tenantsettings\')%>">' +
        '<label for="os_password"><%=goldstone.contextTranslate(\'OpenStack Password\', \'tenantsettings\')%></label>' +
        '<input name="os_password" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'OpenStack Password\', \'tenantsettings\')%>">' +
        '<label for="os_auth_url"><%=goldstone.contextTranslate(\'OpenStack Auth URL\', \'tenantsettings\')%></label>' +
        '<input name="os_auth_url" type="text" class="form-control" placeholder="http://...">' +
        // username must be submitted with request, so including as hidden
        '<input name="username" type="hidden" class="form-control" placeholder="">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.contextTranslate(\'Update\', \'tenantsettings\')%></button>' +
        '</form>' +
        '</div>' +

        // close divs for row/container
        '</div>' +
        '</div>'

    )

});
;
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
instantiated on discoverView when user prefs for topoTreeStyle === 'collapse' as

this.discoverTree = new ZoomablePartitionCollection({});

var topologyTreeView = new TopologyTreeView({
    blueSpinnerGif: blueSpinnerGif,
    collection: this.discoverTree,
    chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverCloudTopology'],
    el: '#goldstone-discover-r2-c1',
    h: 600,
    leafDataUrls: {
        "services-leaf": "/services",
        "endpoints-leaf": "/endpoints",
        "roles-leaf": "/roles",
        "users-leaf": "/users",
        "tenants-leaf": "/tenants",
        "agents-leaf": "/agents",
        "aggregates-leaf": "/aggregates",
        "availability-zones-leaf": "/availability_zones",
        "cloudpipes-leaf": "/cloudpipes",
        "flavors-leaf": "/flavors",
        "floating-ip-pools-leaf": "/floating_ip_pools",
        "hosts-leaf": "/hosts",
        "hypervisors-leaf": "/hypervisors",
        "networks-leaf": "/networks",
        "secgroups-leaf": "/security_groups",
        "servers-leaf": "/servers",
        "images-leaf": "/images",
        "volumes-leaf": "/volumes",
        "backups-leaf": "/backups",
        "snapshots-leaf": "/snapshots",
        "transfers-leaf": "/transfers",
        "volume-types-leaf": "/volume_types"
    },
    multiRsrcViewEl: '#goldstone-discover-r2-c2',
    width: $('#goldstone-discover-r2-c1').width(),
});

*/


var TopologyTreeView = GoldstoneBaseView.extend({

    defaults: {},

    // this block is run upon instantiating the object
    initialize: function(options) {

        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;

        this.defaults.blueSpinnerGif = options.blueSpinnerGif;
        this.defaults.chartHeader = options.chartHeader || null;

        this.defaults.h = options.h;

        this.defaults.multiRsrcViewEl = options.multiRsrcViewEl || null;
        this.defaults.w = options.width;
        this.defaults.leafDataUrls = options.leafDataUrls;
        this.defaults.filterMultiRsrcDataOverride = options.filterMultiRsrcDataOverride || null;

        var ns = this.defaults;
        var self = this;

        this.render();
        this.initSvg();

        this.processListeners();
    },

    processListeners: function() {
        this.listenTo(this.collection, 'sync', this.update);
    },

    filterMultiRsrcData: function(data) {

        // this allows for passing in arrays of paramaters
        // to omit from the returned data before rendering
        // as a data table in 'resource list'

        var ns = this.defaults;
        var self = this;

        if (ns.filterMultiRsrcDataOverride === null) {
            return data;
        } else {
            var newData = jQuery.extend(true, {}, data);
            newData = _.map(newData, function(item) {
                return _.omit(item, ns.filterMultiRsrcDataOverride);
            });
            return newData;
        }

    },

    initSvg: function() {
        var self = this;
        var ns = this.defaults;

        ns.margin = {
            top: 10,
            bottom: 10,
            right: 10,
            left: 35
        };
        ns.mw = ns.w - ns.margin.left - ns.margin.right;
        ns.mh = ns.h - ns.margin.top - ns.margin.bottom;
        ns.svg = d3.select(self.el).select('#topology-tree')
            .append("svg")
            .attr("width", ns.w)
            .attr("height", ns.h);
        ns.tree = d3.layout.tree()
            .size([ns.mh, ns.mw])
            .separation(function(a, b) {
                var sep = a.parent === b.parent ? 3 : 2;
                return sep;
            });
        ns.i = 0; // used in processTree for node id
        ns.diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });
        ns.chart = ns.svg.append("g")
            .attr('class', 'chart')
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");
    },
    hasRemovedChildren: function(d) {
        return d._children && _.findWhere(d._children, {
            'lifeStage': 'removed'
        });
    },
    isRemovedChild: function(d) {
        return d.lifeStage === 'removed';
    },
    toggleAll: function(d) {
        var self = this;
        if (d.children) {
            d.children.forEach(self.toggleAll, this);
            self.toggle(d);
        }
    },
    toggle: function(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    },
    drawSingleRsrcInfoTable: function(scrollYpx, json) {
        // make a dataTable
        var location = '#single-rsrc-table';
        var oTable;
        var keys = Object.keys(json);
        var data = _.map(keys, function(k) {
            if (json[k] === Object(json[k])) {
                return [k, JSON.stringify(json[k])];
            } else {
                return [k, json[k]];
            }
        });

        $("#multi-rsrc-body").popover({
            trigger: "manual",
            placement: "left",
            html: true,
            title: '<div>Resource Info<button type="button" style="color:#fff; opacity:1.0;" id="popover-close" class="close pull-right" data-dismiss="modal"' +
                'aria-hidden="true">&times;</button></div>',
            content: '<div id="single-rsrc-body" class="panel-body">' +
                '<table id="single-rsrc-table" class="table table-hover"></table>' +
                '</div>'
        });
        $("#multi-rsrc-body").popover("show");
        $("#popover-close").on("click", function() {
            $("#multi-rsrc-body").popover("hide");
        });
        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "scrollY": "300px",
                "autoWidth": true,
                "info": false,
                "paging": false,
                "searching": false,
                "columns": [{
                    "title": "Key"
                }, {
                    "title": "Value"
                }]
            };
            oTable = $(location).dataTable(oTableParams);
        }
    },

    loadLeafData: function(dataUrl) {
        var self = this;
        var ns = this.defaults;

        $(ns.multiRsrcViewEl).find('#spinner').show();

        // This .get call has been converted to take advantage of
        // the 'promise' format that it supports. The 'success' and
        // 'fail' pathways will be followed based on the response
        // from the dataUrl API call. The 'always' route pathway
        // will be followed in every case, removing the loading
        // spinner from the chart.

        $.get(dataUrl, function() {}).success(function(payload) {
            // a click listener shall be appended below which
            // will determine if the data associated with the
            // leaf contains "hypervisor_hostname" or "host_name"
            // and if so, a click will redirect, instead of
            // merely appending a resource info chart popup

            // clear any existing error message
            self.clearDataErrorMessage(ns.multiRsrcViewEl);

            // the response may have multiple lists of services for different
            // timestamps.  The first one will be the most recent.
            var firstTsData = payload[0] !== undefined ? payload[0] : [];
            var myUuid = goldstone.uuid()();
            var filteredFirstTsData;
            var keys;
            var columns;
            var columnDefs;
            var oTable;

            // firstTsData[0] if it exists, contains key/values representative
            // of table structure.
            // otherwise it will === undefined
            if (firstTsData[0] !== undefined) {
                firstTsData = _.map(firstTsData, function(e) {
                    e.datatableRecId = goldstone.uuid()();
                    return e;
                });

                if ($.fn.dataTable.isDataTable("#multi-rsrc-table")) {
                    oTable = $("#multi-rsrc-table").DataTable();
                    oTable.destroy(true);
                }

                filteredFirstTsData = self.filterMultiRsrcData(firstTsData);
                if (filteredFirstTsData.length > 0) {
                    keys = Object.keys(filteredFirstTsData[0]);
                    columns = _.map(keys, function(k) {
                        if (k === 'datatableRecId') {
                            return {
                                'data': k,
                                'title': k,
                                'visible': false,
                                'searchable': false
                            };
                        } else {
                            return {
                                'data': k,
                                'title': k
                            };
                        }
                    });

                    $("#multi-rsrc-body").prepend('<table id="multi-rsrc-table" class="table table-hover"><thead></thead><tbody></tbody></table>');
                    oTable = $("#multi-rsrc-table").DataTable({
                        "processing": true,
                        "serverSide": false,
                        "data": filteredFirstTsData,
                        "columns": columns,
                        "scrollX": true
                    });
                    $("#multi-rsrc-table tbody").on('click', 'tr', function() {
                        // we want to identify the row, find the datatable id,
                        // then find the matching element in the full data.s
                        var row = oTable.row(this).data();
                        var data = _.where(firstTsData, {
                            'datatableRecId': row.datatableRecId
                        });
                        var singleRsrcData = jQuery.extend(true, {}, data[0]);
                        if (singleRsrcData !== 'undefined') {
                            delete singleRsrcData.datatableRecId;

                            var supress;

                            var storeDataLocally = function(data) {
                                localStorage.setItem('detailsTabData', JSON.stringify(data));
                            };
                            // if hypervisor or instance with hypervisor in
                            // the name, redirect to report page
                            _.each(_.keys(data[0]), function(item) {
                                if (item.indexOf('hypervisor_hostname') !== -1) {
                                    storeDataLocally(data[0]);
                                    self.reportRedirect(data[0], item);
                                    supress = true;
                                }
                                if (item.indexOf('host_name') !== -1) {
                                    storeDataLocally(data[0]);
                                    self.reportRedirect(data[0], item);
                                    supress = true;
                                }
                            });

                            // otherwise, render usual resource info    popover
                            if (!supress) {
                                self.drawSingleRsrcInfoTable(ns.mh, data[0]);
                            }
                        }
                    });
                }
            } else {
                goldstone.raiseAlert($(ns.multiRsrcViewEl).find('.popup-message'), goldstone.translate('No data'));
            }

        }).fail(function(error) {

            // ns.multiRscsView is defined in this.render
            if (ns.multiRscsView !== undefined) {

                // there is a listener defined in the
                // multiRsrcView that will append the
                // error message to that div

                // trigger takes 2 args:
                // 1: 'triggerName'
                // 2: array of additional params to pass
                ns.multiRscsView.trigger('errorTrigger', [error]);
            }

            // TODO: if this view is instantiated in a case where there
            // is no multiRscsViewEl defined, there will be no
            // ns.multiRscsView defined. In that case, error messages
            // will need to be appended to THIS view. So there will need
            // to be a fallback instantiation of this.dataErrorMessage that will render on THIS view.

        }).always(function() {

            // always remove the spinner after the API
            // call returns
            $(ns.multiRsrcViewEl).find('#spinner').hide();
        });
    },
    reportRedirect: function(data, keyName) {

        // used to redirect to nodeReports when relevant
        // dataTable results are clicked
        var redirectNodeName = data[keyName];
        if (redirectNodeName.indexOf('.') !== -1) {
            redirectNodeName = redirectNodeName.slice(0, redirectNodeName.indexOf('.'));
        }
        window.location.href = '#report/node/' + redirectNodeName;
    },

    appendLeafNameToResourceHeader: function(text, location) {

        // appends the name of the resource list currently being displayed
        location = location || '.panel-header-resource-title';
        $(location).text(': ' + text);
    },

    processTree: function(json) {
        // not used in zoomablePartitionView
        // but must keep for old collapsable tree style viz

        var ns = this.defaults;
        var self = this;
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        var nodes = ns.tree.nodes(ns.data).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * 100;
        });

        // Update the nodes…
        var node = ns.chart.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++ns.i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", function(d) {
                if (d.rsrcType.match(/-leaf$/)) {
                    return "data-leaf node";
                } else {
                    return "node";
                }
            })
            .attr("id", function(d, i) {
                return "node-" + d.label + i;
            })
            .attr("transform", function(d) {
                return "translate(" + json.y0 + "," + json.x0 + ")";
            })
            .on("click", function(d) {

                // for appending to resource chart header
                var origClickedLabel = d.label;

                if (d.rsrcType.match(/-leaf$/) && ns.leafDataUrls !== undefined) {
                    var url = ns.leafDataUrls[d.rsrcType] + '/';
                    if (url !== undefined) {
                        var hasParam = false;
                        if (d.hasOwnProperty('region')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "region=" + d.region;
                        }
                        if (d.hasOwnProperty('zone')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "zone=" + d.zone;
                        }

                        // prepend zone to url:
                        var parentModule;
                        // traverse up the tree until the
                        // parent module is reached
                        while (d.rsrcType !== 'module') {
                            d = d.parent;
                        }
                        parentModule = d.label;

                        if (self.overrideSets[d.label]) {
                            ns.filterMultiRsrcDataOverride = self.overrideSets[d.label];
                        } else {
                            ns.filterMultiRsrcDataOverride = null;
                        }

                        url = "/" + parentModule + url;

                        // loadLeafData on TopologyTreeView
                        self.loadLeafData(url);

                        // appendLeafNameToResourceHeader on TopologyTreeView
                        self.appendLeafNameToResourceHeader(origClickedLabel);
                    }

                } else {
                    self.toggle(d);
                    self.processTree(d);
                }
            });

        // add a circle to make clicking cleaner
        nodeEnter.append("svg:circle")
            .attr("id", function(d, i) {
                return "circle" + i;
            })
            .attr("cx", 8)
            .attr("cy", 2)
            .attr("r", 15)
            .style("fill-opacity", 1e-6)
            .style("stroke-opacity", 1e-6);

        // Add the text label (initially transparent)
        nodeEnter.append("svg:text")
            .attr("x", function(d) {
                return d.children ? 0 : 40;
            })
            .attr("dy", function(d) {
                return d.children ? "-1em" : ".5em";
            })
            .attr("text-anchor", function(d) {
                return d.children ? "middle" : "left";
            })
            .text(function(d) {
                return d.label;
            })
            .style("fill-opacity", 1e-6);

        // Add the main icon (initially miniscule)
        nodeEnter
            .append("g")
            .attr("class", function(d) {
                return "icon main " + (d.rsrcType || "cloud") + "-icon";
            })
            .attr("transform", "scale(0.0000001)");

        // Map of icons to the classes in which they'll be used
        d3.map({
            icon_backup: ['backups-leaf', 'snapshots-leaf'],
            icon_cloud: ['cloud', 'region'],
            icon_endpoint: ['endpoints-leaf'],
            icon_host: ['host', 'hosts-leaf', 'hypervisors-leaf',
                'servers-leaf'
            ],
            icon_image: ['images-leaf'],
            icon_module: ['module', 'secgroups-leaf'],
            icon_role: ['roles-leaf'],
            icon_service: ['service', 'services-leaf'],
            icon_tenant: ['tenants-leaf'],
            icon_types: ['volume-types-leaf'],
            icon_user: ['users-leaf'],
            icon_volume: ['volume', 'volumes-leaf'],
            icon_vol_transfer: ['agents-leaf', 'transfers-leaf'],
            icon_zone: ['zone', 'aggregates-leaf', 'cloudpipes-leaf',
                'flavors-leaf', 'floating-ip-pools-leaf', 'networks-leaf'
            ]

        }).forEach(function(icon, classes) {
            // Acutally attach the icons to the classes
            d3.xml(imgFile(icon), "image/svg+xml", function(img) {
                classes.forEach(function(c) {
                    ns.chart.selectAll(".icon.main." + c + "-icon")
                        .each(function() {
                            d3.select(this).node().appendChild(
                                img.getElementsByTagName("svg")[0].cloneNode(true));
                        });
                });
            }); // d3.xml()
        }); // forEach

        function imgFile(icon) {
            return "/static/images/" + icon + ".svg";
        }

        // Transition nodes to their new position.
        var nodeUpdate = node;

        nodeUpdate.select(".icon.main")
            .attr("transform", 'translate(-5, -10) scale(0.05)')
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeUpdate.select("text")
            .attr("x", function(d) {
                return d.children ? 0 : 25;
            })
            .attr("dy", function(d) {
                return d.children ? "-1em" : ".5em";
            })
            .attr("text-anchor", function(d) {
                return d.children ? "middle" : "left";
            })
            .style("fill-opacity", 1)
            .style("text-decoration", function(d) {
                return (self.hasRemovedChildren(d) || self.isRemovedChild(d)) ?
                    "line-through" : "";
            });

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + json.y + "," + json.x + ")";
            })
            .remove();

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = ns.chart.selectAll("path.link")
            .data(ns.tree.links(nodes), function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: json.x0,
                    y: json.y0
                };
                return ns.diagonal({
                    source: o,
                    target: o
                });
            })
            .transition()
            .duration(duration)
            .attr("d", ns.diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", ns.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: json.x,
                    y: json.y
                };
                return ns.diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    },
    update: function() {
        var ns = this.defaults;
        var self = this;
        ns.data = self.collection.toJSON()[0];

        if (ns.data !== undefined) {
            if (Object.keys(ns.data).length === 0) {
                $(self.el).find('#topology-tree').prepend("<p> Response was empty.");
            } else {
                (function(ns) {
                    ns.data.x0 = ns.h / 2;
                    ns.data.y0 = 0;
                    self.processTree(ns.data);
                })(ns);

                // render resource url in localStorage, if any
                if (localStorage.getItem('urlForResourceList') !== null) {
                    this.loadLeafData(localStorage.getItem('urlForResourceList'));
                }
                // append stored front-page leaf name to chart header
                if (localStorage.getItem('origClickedLabel') !== null) {
                    this.appendLeafNameToResourceHeader(localStorage.getItem('origClickedLabel'));
                }

                // delete localStorage keys that have been used to pre-fetch the
                // items that were clicke to arrive at this page
                localStorage.removeItem('urlForResourceList');
                localStorage.removeItem('origClickedLabel');
            }
        } else {
            this.dataErrorMessage('Topology currently undefined');
        }
    },

    render: function() {

        var ns = this.defaults;

        // appends chart header to el with params passed in as array
        if (ns.chartHeader !== null) {

            $(ns.chartHeader[0]).append(new ChartHeaderView({
                el: ns.chartHeader[0],
                chartTitle: ns.chartHeader[1],
                infoText: ns.chartHeader[2]
            }).el);
        }

        // appends Resource List dataTable View if applicable
        if (ns.multiRsrcViewEl !== null) {
            ns.multiRscsView = new MultiRscsView({
                el: ns.multiRsrcViewEl,
                chartTitle: goldstone.translate("Resource List")
            });

            var appendSpinnerLocation = $(ns.multiRsrcViewEl).find('#spinner-container');
            $('<img id="spinner" src="' + ns.blueSpinnerGif + '">').load(function() {
                $(this).appendTo(appendSpinnerLocation).css({
                    'position': 'absolute',
                    'margin-left': (ns.w / 2),
                    'margin-top': 5,
                    'display': 'none'
                });
            });

        }

        $(this.el).append(this.template);
        return this;
    },

    overrideSets: {
        // works with filterMultiRsrcData method in topologyTreeView
        // these params will be omitted from the returned data before
        // rendering as a data table in 'resource list'

        nova: ['@timestamp',
            'metadata',
            'region',
            'links',
            'swap',
            'rxtx_factor',
            'OS-FLV-EXT-DATA:ephemeral',
            'service',
            'cpu_info',
            'hypervisor_version',
            'bridge',
            'bridge_interface',
            'broadcast',
            'cidr_v6',
            'deleted',
            'deleted_at',
            'dhcp_start',
            'dns1',
            'dns2',
            'gateway_v6',
            'host',
            'injected',
            'multi_host',
            'netmask_v6',
            'priority',
            'region',
            'rxtx_base',
            'vpn_private_address',
            'vpn_public_address',
            'vpn_public_port',
            'accessIPv4',
            'accessIPv6',
            'addresses',
            'config_drive',
            'flavor',
            'hostId',
            'image',
            'key_name',
            'links',
            'metadata',
            'OS-DCF:diskConfig',
            'OS-EXT-AZ:availability_zone',
            'OS-EXT-SRV-ATTR:hypervisor_hostname',
            'OS-EXT-STS:power_state',
            'OS-EXT-STS:task_state',
            'OS-EXT-STS:vm_state',
            'os-extended-volumes:volumes_attached',
            'OS-SRV-USG:launched_at',
            'OS-SRV-USG:terminated_at',
            'progress',
            'region',
            'security_groups',
            'rules'
        ],
        cinder: ['@timestamp',
            'metadata',
            'region',
            'extra_specs',
            'display_description',
            'os-extended-snapshot-attributes:progress',
            'links',
            'attachments',
            'availability_zone',
            'os-vol-mig-status-attr:migstat',
            'os-vol-mig-status-attr:name_id',
            'snapshot_id',
            'source_volid'
        ],
        keystone: ['@timestamp'],
        glance: ['@timestamp',
            'metadata',
            'region',
            'tags',
            'checksum',
            'owner',
            'schema',
            'file'
        ]
    },

    template: _.template('' +
        '<div class="panel-body" style="height:600px">' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div id="topology-tree">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )
});
;
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

var UserPrefsView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.initLocalStorageUserPrefs();
        this.setUpListeners();
        this.applyUserPrefs();
    },

    setUpListeners: function() {
        var self = this;

        // triggered on settingsPageView
        this.listenTo(this, 'lightThemeSelected', function() {

            self.applyLightTheme();
            self.getUserPrefs();
            self.defaults.userPrefs.theme = 'light';
            self.setUserPrefs();

        });

        // triggered on settingsPageView
        this.listenTo(this, 'darkThemeSelected', function() {

            self.applyDarkTheme();
            self.getUserPrefs();
            self.defaults.userPrefs.theme = 'dark';
            self.setUserPrefs();

        });

        // triggered on settingsPageView
        this.listenTo(this, 'collapseTreeSelected', function() {
            self.getUserPrefs();
            self.defaults.userPrefs.topoTreeStyle = 'collapse';
            self.setUserPrefs();
        });

        // triggered on settingsPageView
        this.listenTo(this, 'zoomTreeSelected', function() {
            self.getUserPrefs();
            self.defaults.userPrefs.topoTreeStyle = 'zoom';
            self.setUserPrefs();
        });

        // triggered on settingsPageView
        this.listenTo(this, 'i18nLanguageSelected', function(selection) {
            self.getUserPrefs();
            self.defaults.userPrefs.i18n = selection;
            self.setUserPrefs();
            goldstone.i18n.trigger('setLanguage', selection);
        });
    },

    initLocalStorageUserPrefs: function() {
        if (localStorage.getItem('userPrefs') === null) {
            localStorage.setItem('userPrefs', JSON.stringify({}));
        }
    },

    getUserPrefs: function() {
        this.defaults.userPrefs = JSON.parse(localStorage.getItem('userPrefs'));

        // cannot add property to null, so make sure this exists
        if (this.defaults.userPrefs === null) {
            this.defaults.userPrefs = {};
        }
    },

    setUserPrefs: function() {
        localStorage.setItem('userPrefs', JSON.stringify(this.defaults.userPrefs));
    },

    applyUserPrefs: function() {
        this.getUserPrefs();
        if (this.defaults.userPrefs && this.defaults.userPrefs.theme) {
            if (this.defaults.userPrefs.theme === 'light') {
                this.applyLightTheme();
            }
            if (this.defaults.userPrefs.theme === 'dark') {
                this.applyDarkTheme();
            }
        }
    },

    applyDarkTheme: function() {
        $('link[href="/static/css/client/scss/styleLight.css"]').attr('href', '/static/css/client/scss/styleDark.css');
    },

    applyLightTheme: function() {
        $('link[href="/static/css/client/scss/styleDark.css"]').attr('href', '/static/css/client/scss/styleLight.css');
    }
});
;
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
extends UtilizationCpuView

Instantiated on nodeReportView as:

this.memoryUsageChart = new UtilizationMemCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.memoryUsageView = new UtilizationMemView({
    collection: this.memoryUsageChart,
    el: '#node-report-r3 #node-report-panel #memory-usage',
    width: $('#node-report-r3 #node-report-panel #memory-usage').width(),
    featureSet: 'memUsage'
});
*/

var UtilizationMemView = UtilizationCpuView.extend({

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        var allthelogs = this.collection.toJSON();

        var data = allthelogs;

        if(data === undefined || data.length === 0) {
            return [];
        }

        _.each(data, function(collection) {

            // within each collection, tag the data points
            _.each(collection.per_interval, function(dataPoint) {

                _.each(dataPoint, function(item, i) {
                    item['@timestamp'] = i;
                    item.name = collection.metricSource;
                    item.value = item.stats.max;
                });

            });
        });


        var condensedData = _.flatten(_.map(data, function(item) {
            return item.per_interval;
        }));


        var dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
            return item[_.keys(item)[0]]['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                wait: null,
                sys: null,
                user: null
            };
        });


        _.each(condensedData, function(item) {

            var key = _.keys(item)[0];
            var metric = item[key].name.slice(item[key].name.lastIndexOf('.') + 1);
            newData[key][metric] = item[key].value;

        });

        finalData = [];

        // make sure to set ns.memTotal
        var key = _.keys(allthelogs[0].per_interval[1])[0];

        ns.memTotal = allthelogs[0].per_interval[1][key].stats.max; // double check

        _.each(newData, function(item, i) {

            item.total = item.total || 0;
            item.free = item.free || 0;

            finalData.push({
                used: (item.total - item.free) / ns.divisor,
                free: item.free / ns.divisor,
                // total renders a thin line at the top of the area stack
                // the actual value comes from ns.memTotal.value
                total: 0.1,
                date: i
            });
        });

        return finalData;

    }

});
;
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
Extends UtilizationCpuView

Instantiated on nodeReportView as:

this.networkUsageChart = new UtilizationNetCollection({
    nodeName: hostName,
    globalLookback: ns.globalLookback
});

this.networkUsageView = new UtilizationNetView({
    collection: this.networkUsageChart,
    el: '#node-report-r3 #node-report-panel #network-usage',
    width: $('#node-report-r3 #node-report-panel #network-usage').width(),
    featureSet: 'netUsage'
});
*/

var UtilizationNetView = UtilizationCpuView.extend({

    defaults: {
        margin: {
            top: 20,
            right: 33,
            bottom: 25,
            left: 50
        }
    },

    collectionPrep: function() {
        var allthelogs = this.collection.toJSON();
        var data = allthelogs;

        // allthelogs will have as many objects as api calls were made
        // iterate through each object to tag the data with the
        // api call that was made to produce it
        _.each(data, function(collection) {

            // within each collection, tag the data points
            _.each(collection.per_interval, function(dataPoint) {

                _.each(dataPoint, function(item, i) {
                    item['@timestamp'] = i;
                    item.name = collection.metricSource;
                    item.value = item.stats.max;
                });

            });
        });


        var condensedData = _.flatten(_.map(data, function(item) {
            return item.per_interval;
        }));


        var dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
            return item[_.keys(item)[0]]['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                wait: null,
                sys: null,
                user: null
            };
        });


        _.each(condensedData, function(item) {

            var key = _.keys(item)[0];
            var metric = item[key].name.substr((item[key].name.lastIndexOf('.net') + 5), 2);
            newData[key][metric] = item[key].value;

        });



        finalData = [];

        _.each(newData, function(item, i) {

            item.rx = item.rx || 0;
            item.tx = item.tx || 0;

            finalData.push({
                rx: item.rx,
                tx: item.tx,
                date: i
            });
        });

        return finalData;

    }

});
;
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
instantiated on discoverView when user prefs for topoTreeStyle === 'zoom' as:

this.discoverTree = new ZoomablePartitionCollection({});

this.zoomableTreeView = new ZoomablePartitionView({
    blueSpinnerGif: blueSpinnerGif,
    chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverZoomTopology'],
    collection: this.discoverTree,
    el: '#goldstone-discover-r2-c1',
    h: 600,
    leafDataUrls: {
        "services-leaf": "/services",
        "endpoints-leaf": "/endpoints",
        "roles-leaf": "/roles",
        "users-leaf": "/users",
        "tenants-leaf": "/tenants",
        "agents-leaf": "/agents",
        "aggregates-leaf": "/aggregates",
        "availability-zones-leaf": "/availability_zones",
        "cloudpipes-leaf": "/cloudpipes",
        "flavors-leaf": "/flavors",
        "floating-ip-pools-leaf": "/floating_ip_pools",
        "hosts-leaf": "/hosts",
        "hypervisors-leaf": "/hypervisors",
        "networks-leaf": "/networks",
        "secgroups-leaf": "/security_groups",
        "servers-leaf": "/servers",
        "images-leaf": "/images",
        "volumes-leaf": "/volumes",
        "backups-leaf": "/backups",
        "snapshots-leaf": "/snapshots",
        "transfers-leaf": "/transfers",
        "volume-types-leaf": "/volume_types"
    },
    multiRsrcViewEl: '#goldstone-discover-r2-c2',
    width: $('#goldstone-discover-r2-c1').width()
});

*/

var ZoomablePartitionView = TopologyTreeView.extend({

    defaults: {},

    initialize: function(options) {
        ZoomablePartitionView.__super__.initialize.apply(this, arguments);
    },

    initSvg: function() {
        var self = this;
        var ns = this.defaults;

        // ns.h = 600;
        ns.x = d3.scale.linear().range([0, ns.w]);
        ns.y = d3.scale.linear().range([0, ns.h]);

        ns.vis = d3.select(self.el).append("div")
            .attr("class", "chart")
            .style("width", ns.w + "px")
            .style("height", ns.h + "px")
            .append("svg:svg")
            .attr("width", ns.w)
            .attr("height", ns.h);

        ns.partition = d3.layout.partition()
            .value(function(d) {
                // set to constant for even sizing of nodes
                // this was originally set to d.size
                return 1;
            });
    },

    update: function() {
        var ns = this.defaults;
        var self = this;

        var root = this.collection.toJSON()[0];

        var g = ns.vis.selectAll("g")
            .data(ns.partition.nodes(root))
            .enter().append("svg:g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.y) + "," + ns.y(d.x) + ")";
            })
            .on("click", click);

        var kx = ns.w / root.dx,
            ky = ns.h / 1;

        g.append("svg:rect")
            .attr("width", root.dy * kx)
            .attr("height", function(d) {
                return d.dx * ky;
            })
            .attr("class", function(d) {
                return d.children ? "parent " + (d.rsrcType || "cloud") + "-icon" : "child" + (d.rsrcType || "cloud") + "-icon";
            })
            .attr("fill", function(d) {
                // return d.children ? "#eee" : "#ddd";
                return "#eee";
            })
            .attr("cursor", function(d) {
                return d.children ? "pointer" : "default";
            })
            .attr({
                "stroke": '#777'
            })
            .attr({
                "fill-opacity": 0.8
            });

        g.append("svg:text")
            .attr("class", "zoomable")
            .attr("transform", transform)
            .attr("x", 5)
            .attr("dy", ".35em")
            .style("opacity", function(d) {
                return d.dx * ky > 12 ? 1 : 0;
            })
            .text(function(d) {
                return d.label;
            })
            .attr({
                'font-size': '12px'
            })
            .attr({
                'pointer-events': 'none'
            });

        function imgFile(icon) {
            return "/static/images/" + icon + ".svg";
        }

        var iconMap = {
            icon_backup: ['backups-leaf', 'snapshots-leaf'],
            icon_cloud: ['cloud', 'region'],
            icon_endpoint: ['endpoints-leaf'],
            icon_host: ['host', 'hosts-leaf', 'hypervisors-leaf',
                'servers-leaf'
            ],
            icon_image: ['images-leaf'],
            icon_module: ['module', 'secgroups-leaf'],
            icon_role: ['roles-leaf'],
            icon_service: ['service', 'services-leaf'],
            icon_tenant: ['tenants-leaf'],
            icon_types: ['volume-types-leaf'],
            icon_user: ['users-leaf'],
            icon_volume: ['volume', 'volumes-leaf'],
            icon_vol_transfer: ['agents-leaf', 'transfers-leaf'],
            icon_zone: ['zone', 'aggregates-leaf', 'cloudpipes-leaf',
                'flavors-leaf', 'floating-ip-pools-leaf', 'networks-leaf'
            ]
        };

        g.append("svg:image")
            .attr('x', 2)
            .attr('y', function(d) {
                return (d.dx * ky / 2) - 10;
            })
            .attr('width', 20)
            .attr('height', 20)
            .style("opacity", function(d) {
                return d.dx * ky > 12 ? 1 : 0;
            })
            .attr('xlink:href', function(d) {
                var finalIcon;
                _.each(iconMap, function(classes, icon) {
                    if (classes.indexOf(d.rsrcType) !== -1) {
                        finalIcon = icon;
                    }
                });
                return imgFile(finalIcon);
            });

        d3.select(self.el)
            .on("click", function() {
                click(root);
            });

        function click(d) {

            // no d.children signifies a leaf which should
            // load a table of the data, otherwise zoom in

            if (!d.children) {

                // for appending to resource chart header
                var origClickedLabel = d.label;

                if (d.rsrcType.match(/-leaf$/) && ns.leafDataUrls !== undefined) {
                    var url = ns.leafDataUrls[d.rsrcType] + '/';
                    if (url !== undefined) {
                        var hasParam = false;
                        if (d.hasOwnProperty('region')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "region=" + d.region;
                        }
                        if (d.hasOwnProperty('zone')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "zone=" + d.zone;
                        }

                        // prepend zone to url:
                        var parentModule;
                        // traverse up the tree until the
                        // parent module is reached
                        while (d.rsrcType !== 'module') {
                            d = d.parent;
                        }
                        parentModule = d.label;

                        if (self.overrideSets[d.label]) {
                            ns.filterMultiRsrcDataOverride = self.overrideSets[d.label];
                        } else {
                            ns.filterMultiRsrcDataOverride = null;
                        }

                        url = "/" + parentModule + url;

                        // loadLeafData on TopologyTreeView
                        self.loadLeafData(url);

                        // appendLeafNameToResourceHeader on TopologyTreeView
                        self.appendLeafNameToResourceHeader(origClickedLabel);
                    }

                }

                d3.event.stopPropagation();
                return;
            }

            // not a child node, so zoom in:

            kx = (d.y ? ns.w - 40 : ns.w) / (1 - d.y);
            ky = ns.h / d.dx;
            ns.x.domain([d.y, 1]).range([d.y ? 40 : 0, ns.w]);
            ns.y.domain([d.x, d.x + d.dx]);

            var t = g.transition()
                .duration(d3.event.altKey ? 2500 : 750)
                .attr("transform", function(d) {
                    return "translate(" + ns.x(d.y) + "," + ns.y(d.x) + ")";
                });

            t.select("rect")
                .attr("width", d.dy * kx)
                .attr("height", function(d) {
                    return d.dx * ky;
                });

            t.select("text")
                .attr("transform", transform)
                .style("opacity", function(d) {
                    return d.dx * ky > 12 ? 1 : 0;
                });

            t.select("image")
                .style("opacity", function(d) {
                    return d.dx * ky > 12 ? 1 : 0;
                })
                .attr('x', 2)
                .attr('y', function(d) {
                    return (d.dx * ky / 2) - 10;
                });

            d3.event.stopPropagation();
        }

        function transform(d) {
            return "translate(22," + d.dx * ky / 2 + ")";
        }

    },

    template: null

});
