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

goldstone.returnAddonPresent = function(checkName) {
    var addonList = JSON.parse(localStorage.getItem('addons'));
    var result = false;
    _.each(addonList, function(item) {
        if(item.name && item.name === checkName) {
            result = true;
        }
    });
    return result;
};

goldstone.uuid = function() {
    "use strict";

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

goldstone.time = goldstone.time || {};

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
};;
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

        var noDataMessage = goldstone.translate('No Data Returned');

        if (data.length === 0) {
            this.dataErrorMessage(noDataMessage);
            return false;
        } else {
            this.clearDataErrorMessage();
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
            result += '<a href="' + route[0] + '"' + ' class="' + (route[2] === 'active' ? 'active ' : '') +
                'btn btn-default">' + goldstone.translate(route[1]) + '</a>';
        });
        result += '</div><br><br>';
        return result;
    },

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

    /*
    extra options passed in with GoldstoneRouter.switchView will be accessible via this.options
    */

    instanceSpecificInit: function() {
        this.render();
        this.processOptions();
        this.getGlobalLookbackRefresh(); // defined on GoldstoneBaseView
        this.renderCharts();
        this.setGlobalLookbackRefreshTriggers();
        this.scheduleInterval();
    },

    processOptions: function() {
        var self = this;

        // set each key-value pair passed into the options hash
        // to a property of the view instantiation
        _.each(this.options, function(item, key) {
            self[key] = item;
        });
    },


    clearScheduledInterval: function() {
        clearInterval(this.currentInterval);
    },

    // populate with the rendered charts in order to
    // remove listeners from the view
    viewsToStopListening: undefined,

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

        // if no globalLookbackRefreshSelectors, abort
        if (!goldstone.globalLookbackRefreshSelectors) {
            return;
        }

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

    defaults: {},

    initialize: function(options) {
        options = options || {};
        this.options = _.clone(options);
        this.defaults = _.clone(this.defaults);
        this.instanceSpecificInit();
    },

    instanceSpecificInit: function() {
        this.processOptions();
        this.urlGenerator();
    },

    processOptions: function() {
        var self = this;

        // set each key-value pair passed into the options hash
        // to a property of the view instantiation
        _.each(this.options, function(item, key) {
            self[key] = item;
        });
    },

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
        if (this.addCustom) {
            this.url += this.addCustom(this.custom);
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

    // addCustom: function(custom) {
    //     return custom;
    // },

    computeLookbackAndInterval: function(n) {

        // n designates the number of interval 'slices' to make
        // default ot 24
        n = n || 24;

        // compute epochNow, globalLookback, globalRefresh
        this.getGlobalLookbackRefresh();

        this.gte = (this.epochNow - (this.globalLookback * 60 * 1000));

        // set interval equal to 1/24th of time range
        this.interval = ((this.epochNow - this.gte) / 1000) / n;
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

GoldstoneBaseCollection.prototype.flattenObj = GoldstoneBaseView.prototype.flattenObj;
GoldstoneBaseCollection.prototype.getGlobalLookbackRefresh = GoldstoneBaseView.prototype.getGlobalLookbackRefresh;
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

var DataTableBaseView = GoldstoneBaseView.extend({

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
        "metrics/api_perf": "apiPerfReport",
        "metrics/topology": "topology",
        "report/node/:nodeId": "nodeReport",
        "reports/logbrowser": "logSearch",
        "reports/logbrowser/search": "savedSearchLog",
        "reports/eventbrowser": "eventsBrowser",
        "reports/eventbrowser/search": "savedSearchEvent",
        "reports/apibrowser": "apiBrowser",
        "reports/apibrowser/search": "savedSearchApi",
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
        this.switchView(ApiPerfReportPageView);
    },
    discover: function() {
        this.switchView(DiscoverPageView);
    },
    eventsBrowser: function() {
        this.switchView(EventsBrowserPageView);
    },
    logSearch: function() {
        this.switchView(LogSearchPageView);
    },
    nodeReport: function(nodeId) {
        this.switchView(NodeReportPageView, {
            node_uuid: nodeId
        });
    },
    redirect: function() {
        location.href = "#discover";
    },
    savedSearchApi: function() {
        this.switchView(SavedSearchPageView, {
            featureSet: 'api'
        });
    },
    savedSearchEvent: function() {
        this.switchView(SavedSearchPageView, {
            featureSet: 'event'
        });
    },
    savedSearchLog: function() {
        this.switchView(SavedSearchPageView, {
            featureSet: 'log'
        });
    },
    settings: function() {
        this.switchView(SettingsPageView);
    },
    tenant: function() {
        this.switchView(TenantSettingsPageView);
    },
    topology: function() {
        this.switchView(TopologyPageView);
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

var ChartSet = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        ChartSet.__super__.instanceSpecificInit.apply(this, arguments);
        this.makeChart();
    },

    processOptions: function() {

        ChartSet.__super__.processOptions.apply(this, arguments);

        this.marginLeft = this.options.marginLeft || 50;
        this.marginRight = this.options.marginRight || 120;
        this.marginTop = this.options.marginTop || 20;
        this.marginBottom = this.options.marginBottom || 80;
        this.popoverTimeLabel = this.options.popoverTimeLabel || "time";
        this.popoverUnitLabel = this.options.popoverUnitLabel || "events";
        this.shapeArray = ['rect', 'circle'];
        this.shapeCounter = 0;
        this.shape = this.options.shape || this.shapeArray[this.shapeCounter];
        this.xParam = this.options.xParam;
        this.yParam = this.options.yParam;
        this.data = [];
    },

    resetXParam: function(param) {
        param = param || 'time';
        this.xParam = param;
    },

    resetYParam: function(param) {
        param = param || 'count';
        this.yParam = param;
    },

    makeChart: function() {
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
        this.svg = d3.select(this.el).select('.panel-body').append('svg')
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
            .interpolate("monotone")
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

    instanceSpecificInit: function() {
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

        ns.colorArray = new GoldstoneColors().get('colorSets');

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
        finalResult.missing_key_callback = function(key, language) {
            if(!goldstone.skipI18nLog) {
                console.error('missing ' + language + ' .po file translation for: `' + key + '`');
            }
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

            logBrowser: function() {
                return goldstone.translate('This chart displays log stream data across your cloud.  You can adjust the displayed data with the time settings in the menu bar, and with the filter settings that double as a legend.  The table below contains the individual log entries for the time range and filter settings.');
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

            cloudTopologyResourceList: function() {
                return goldstone.translate('Click row for additional resource info.<br><br>Clicking on hypervisor or hosts reports will navigate to additional report pages.');

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

    urlBase: "/core/api-calls/",

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    preProcessData: function(data) {
        if(data) {
            return data;
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

    urlBase: '/core/api-calls/',

    // overwrite this, as the aggregation for this chart is idential on
    // the additional pages. The additional pages are only relevant to the
    // server-side paginated fetching for the log browser below the viz
    checkForAdditionalPages: function() {
        return true;
    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    addPageSize: function(n) {
        return '&page_size=1';
    },

    preProcessData: function(data) {

        var self = this;

        // initialize container for formatted results
        finalResult = [];

        // for each array index in the 'data' key
        _.each(data.aggregations.per_interval.buckets, function(item) {
            var tempObj = {};
            tempObj.time = item.key;
            tempObj.count = item.doc_count;
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

var ApiPerfCollection = GoldstoneBaseCollection.extend({

    preProcessData: function(data) {
        if (data && data.aggregations && data.aggregations.per_interval && data.aggregations.per_interval.buckets) {
            return data.aggregations.per_interval.buckets;
        } else {
            return [];
        }
    },

    checkForAdditionalPages: function() {

    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },
    addInterval: function() {
        n = Math.round(1 * this.globalLookback);
        return '&interval=' + n + 's';
    },
    addCustom: function() {
        return '&component=' + this.componentParam;
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

    urlBase: '/core/events/',

    addRange: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
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

    urlBase: '/core/events/',

    // overwrite this, as the aggregation for this chart is idential on
    // the additional pages. The additional pages are only relevant to the
    // server-side paginated fetching for the log browser below the viz
    checkForAdditionalPages: function() {
        return true;
    },

    addRange: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    addPageSize: function(n) {
        return '&page_size=1';
    },

    preProcessData: function(data) {

        var self = this;

        // initialize container for formatted results
        finalResult = [];

        // for each array index in the 'data' key
        _.each(data.aggregations.per_interval.buckets, function(item) {
            var tempObj = {};
            tempObj.time = item.key;
            tempObj.count = item.doc_count;
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

        this.logBrowserVizCollection = new LogBrowserCollection({
            urlBase: '/core/logs/',

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.logBrowserVizCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'logBrowser',
            marginLeft: 60,
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });
*/

var LogBrowserCollection = GoldstoneBaseCollection.extend({

    isZoomed: false,
    zoomedStart: null,
    zoomedEnd: null,

    addRange: function() {

        if (this.isZoomed) {
            return '?@timestamp__range={"gte":' + this.zoomedStart + ',"lte":' + this.zoomedEnd + '}';
        } else {
            return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
        }

    },

    // overwrite this, as the aggregation for this chart is idential on
    // the additional pages. The additional pages are only relevant to the
    // server-side paginated fetching for the log browser below the viz
    checkForAdditionalPages: function() {
        return true;
    },

    addInterval: function() {
        var computedInterval;
        var start;
        var end;

        if (this.isZoomed) {
            start = this.zoomedStart;
            end = this.zoomedEnd;
        } else {
            start = this.gte;
            end = this.epochNow;
        }

        // interval ratio of 1/20th the time span in seconds.
        computedInterval = ((end - start) / 20000);
        // ensure a minimum of 0.5second interval
        computedInterval = Math.max(0.5, computedInterval);
        // round to 3 decimal places
        computedInterval = Math.round(computedInterval * 1000) / 1000;
        return '&interval=' + computedInterval + 's';
    },

    addCustom: function(custom) {
        
        // specificHost applies to this chart when instantiated
        // on a node report page to scope it to that node
        return this.specificHost ? '&host=' + this.specificHost : '';
    },

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
instantiated in logSearchPageView.js as a mixin, no automatic fetch happens:

    this.logBrowserTableCollection = new LogBrowserTableCollection({
        skipFetch: true,
        specificHost: this.specificHost,
        urlBase: '/core/logs/',
        linkedCollection: this.logBrowserVizCollection
    });    

    this.logBrowserTable = new LogBrowserDataTableView({
        chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
        collectionMixin: this.logBrowserTableCollection,
        el: '#log-viewer-table',
        infoIcon: 'fa-table',
        width: $('#log-viewer-table').width()
    });

*/

var LogBrowserTableCollection = GoldstoneBaseCollection.extend({

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addCustom: function() {
        var result = '&syslog_severity__terms=[';

        levels = this.filter || {};
        for (var k in levels) {
            if (levels[k]) {
                result = result.concat('"', k.toLowerCase(), '",');
            }
        }
        result += "]";

        result = result.slice(0, result.indexOf(',]'));
        result += "]";

        if(this.specificHost) {
            result += '&host=' + this.specificHost;
        }

        return result;
    },

    computeLookbackAndInterval: function() {

        // compute epochNow, globalLookback, globalRefresh
        // this.getGlobalLookbackRefresh();
        if (this.linkedCollection.isZoomed) {
            this.gte = this.linkedCollection.zoomedStart;
            this.epochNow = this.linkedCollection.zoomedEnd;
        } else {
            this.gte = this.linkedCollection.gte;
            this.epochNow = this.linkedCollection.epochNow;
        }

    },

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

var MetricOverviewCollection = GoldstoneBaseCollection.extend({

    /*
log
/core/logs/?@timestamp__range=\{"gte":1452731730365,"lte":1452732630365\}&interval=5m

event
/core/events/?@timestamp__range=\{"gte":1452731730365,"lte":1452732630365\}&interval=5m

api
/core/api-calls/?@timestamp__range=\{"gte":1452731730365,"lte":1452732630365\}&interval=5m

*/

    // Overwriting. Additinal pages not needed.
    checkForAdditionalPages: function(data) {
        return true;
    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addRange2: function() {
        return '?timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },

    addInterval: function(n) {
        n = n || this.interval;
        return '&interval=' + n + 's';
    },

    urlGenerator: function() {
        var self = this;
        this.computeLookbackAndInterval(60);


        var coreUrlVars = ['logs/', 'events/', 'api-calls/'];
        var coreCalls = coreUrlVars.map(function(item) {
            return self.urlBase + item + (item === 'events/' ? self.addRange2() : self.addRange()) +
                self.addInterval();
        });

        $.when($.get(coreCalls[0]), $.get(coreCalls[1]), $.get(coreCalls[2]))
            .done(function(r1, r2, r3) {

                // container for combined data
                var finalResult = {};
                finalResult.logData = r1[0];
                finalResult.eventData = r2[0];
                finalResult.apiData = r3[0];

                // append start/end of timestamp__range 
                finalResult.startTime = self.gte;
                finalResult.endTime = self.epochNow;

                // reset collection
                // add aggregated and tagged api call data
                self.reset();
                self.add([finalResult]);
                self.trigger('sync');
            })
            .fail(function(err) {
                self.trigger('error', [err.status, err.statusText]);
            });
    },


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

this.cpuResourcesChart = new MultiMetricComboCollection({
    metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used'],
    nodeName: hostName (optional)
});
*/

var MultiMetricComboCollection = GoldstoneBaseCollection.extend({

    instanceSpecificInit: function() {
        this.processOptions();
        this.fetchInProgress = false;
        this.urlCollectionCountOrig = this.metricNames.length;
        this.urlCollectionCount = this.metricNames.length;
        this.urlGenerator();
    },

    parse: function(data) {
        var self = this;

        // before adding data to the collection, tag it with the metricName
        // that produced the data
        data.metricSource = this.metricNames[(this.metricNames.length) - this.urlCollectionCount];
        this.urlCollectionCount--;
        return data;
    },

    urlGenerator: function() {
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.fetchInProgress) {
            return null;
        }

        this.fetchInProgress = true;
        this.urlsToFetch = [];

        this.computeLookbackAndInterval();

        // set a lower limit to the interval of '2m'
        // in order to avoid the sawtooth effect
        this.interval = '' + Math.max(2, (this.globalLookback / 24)) + 'm';


        _.each(this.metricNames, function(prefix) {

            var urlString = '/core/metrics/?name=' + prefix;

            if (self.nodeName) {
                urlString += '&node=' + self.nodeName;
            }

            urlString += '&@timestamp__range={"gte":' +
                self.gte + ',"lte":' + self.epochNow +
                '}&interval=' + self.interval;

            self.urlsToFetch.push(urlString);
        });
        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: self.urlsToFetch[0],
            success: function() {
                // upon success: further fetches are carried out with
                // remove: false to build the collection
                _.each(self.urlsToFetch.slice(1), function(item) {
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

// define collection and link to model

var NodeServiceStatusCollection = Backbone.Collection.extend({

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

var ServiceStatusCollection = GoldstoneBaseCollection.extend({

    instanceSpecificInit: function() {
        this.processOptions();
        this.urlGenerator();
    },

    urlGenerator: function(data) {
        var self = this;

        // the call to /core/saved_seaarch/?name=service+status
        // returns the uuid required for the service aggregations

        $.get(this.urlBase + '?name=service+status', function() {})
            .done(function(data) {
                var searchUuid = self.constructAggregationUrl(data.results[0].uuid);
                self.url = searchUuid;

                // fetch return triggers 'sync' which triggers
                // update in the client with the returned data
                self.fetch();
            });
    },

    constructAggregationUrl: function(uuid) {
        return this.urlBase + uuid + '/results/';
    },

    // Overwriting. Additinal pages not needed.
    checkForAdditionalPages: function(data) {
        return true;
    },


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
Instantiated on novaReportView as:

this.vmSpawnChart = new SpawnsCollection({
    urlBase: '/nova/hypervisor/spawns/'
});

this.vmSpawnChartView = new SpawnsView({
    chartTitle: goldstone.translate("VM Spawns"),
    collection: this.vmSpawnChart,
    height: 350,
    infoText: 'novaSpawns',
    el: '#nova-report-r1-c2',
    width: $('#nova-report-r1-c2').width(),
    yAxisLabel: goldstone.translate('Spawn Events')
});


returns:
per_interval: [{
    timestamp:[count: 1, success: [{true: 1}]],
    timestamp:[count: 3, success: [{true: 2}, {false: 1}]],
    timestamp:[count: 0, success: []],
    ...
}]
*/

var SpawnsCollection = GoldstoneBaseCollection.extend({

    preProcessData: function(data) {
        if (data && data.per_interval) {
            return data.per_interval;
        } else {
            return [];
        }
    },

    addRange: function() {
        return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
    },
    addInterval: function() {
        n = Math.max(1, (this.globalLookback / 24));
        return '&interval=' + n + 'm';
    },

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

var AddonMenuView = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {

        // passing true will also dynamically generate new routes in
        // Backbone router corresponding with the .routes param in the
        // addon's .js file.
        this.refreshAddonsMenu(true);
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

            this.generateRoutesPerAddon(addNewRoute);

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

    generateRoutesPerAddon: function(addNewRoute) {
        var self = this;
        var list = localStorage.getItem('addons');
        list = JSON.parse(list);
        var result = '';

        // for each object in the array of addons in 'list', do the following:
        _.each(list, function(item) {

            if (goldstone[item.url_root]) {

                // for each sub-array in the array of 'routes' in
                // the addon's javascript file, do the following:
                _.each(goldstone[item.url_root].routes, function(route) {
                    if (addNewRoute === true) {
                        self.addNewRoute(route);
                    }
                });
            }
        });

        // initialize tooltip connected to new menu item
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover'
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
                this.switchView(routeToAdd[2], {
                    'passedValue': passedValue
                });
            } else {
                this.switchView(routeToAdd[2]);
            }
        });
    },

    template: _.template('' +
        '<a href="#compliance/opentrail/manager/">' +
        '<li data-toggle="tooltip" data-placement="right" title="" data-original-title="Compliance">' +
        '<span class="btn-icon-block"><i class="icon compliance">&nbsp;</i></span>' +
        '<span class="btn-txt i18n" data-i18n="Compliance">Compliance</span>' +
        '</li>' +
        '</a>'
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
                    "data": "_source.@timestamp",
                    "type": "date",
                    "targets": 0,
                    "render": function(data, type, full, meta) {
                        return moment(data).format();
                    }
                }, {
                    "data": "_source.host",
                    "targets": 1
                }, {
                    "data": "_source.client_ip",
                    "targets": 2
                }, {
                    "data": "_source.uri",
                    "targets": 3
                }, {
                    "data": "_source.response_status",
                    "targets": 4
                }, {
                    "data": "_source.response_time",
                    "targets": 5
                }, {
                    "data": "_source.response_length",
                    "targets": 6
                }, {
                    "data": "_source.component",
                    "targets": 7
                }, {
                    "data": "_source.type",
                    "targets": 8
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

var ApiBrowserPageView = GoldstoneBasePageView.extend({

    renderCharts: function() {

        this.apiBrowserVizCollection = new ApiHistogramCollection({});

        this.apiBrowserView = new ApiBrowserView({
            chartTitle: goldstone.contextTranslate('API Call Search', 'apibrowserpage'),
            collection: this.apiBrowserVizCollection,
            el: '#api-histogram-visualization',
            infoIcon: 'fa-tasks',
            width: $('#api-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('API Calls by Range', 'apibrowserpage'),
            marginLeft: 60
        });

        // instantiated only for access to url generation functions
        this.apiBrowserTableCollection = new ApiBrowserTableCollection({
            skipFetch: true
        });

        this.apiBrowserTable = new ApiBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('API Browser', 'apibrowserpage'),
            collectionMixin: this.apiBrowserTableCollection,
            el: '#api-browser-table',
            infoIcon: 'fa-table',
            width: $('#api-browser-table').width()
        });

        // render predefinedSearch Dropdown
        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: new GoldstoneBaseCollection({
                skipFetch: true,
                urlBase: '',
                addRange: function() {
                    return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
                },
                addInterval: function(interval) {
                    return '&interval=' + interval + 's';
                },
            }),
            index_prefix: 'api_stats-*',
            settings_redirect: '/#reports/apibrowser/search'

        });

        this.apiBrowserView.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [this.apiBrowserVizCollection, this.apiBrowserView, this.apiBrowserTableCollection, this.apiBrowserTable, this.predefinedSearchDropdown];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.apiBrowserView.trigger('lookbackSelectorChanged');
            this.apiBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer'],
        ['/#reports/eventbrowser', 'Event Viewer'],
        ['/#reports/apibrowser', 'API Call Viewer', 'active'],
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

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

var ApiPerfReportPageView = GoldstoneBasePageView.extend({

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

        //----------------------------
        // instantiate charts via
        // backbone collection / views


        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova',
            urlBase: '/core/api-calls/'
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Nova API Performance"),
            collection: this.novaApiPerfChart,
            height: 350,
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });


        //------------------------------
        // instantiate neutron api chart

        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron',
            urlBase: '/core/api-calls/'
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Neutron API Performance"),
            collection: this.neutronApiPerfChart,
            height: 350,
            el: '#api-perf-report-r1-c2',
            width: $('#api-perf-report-r1-c2').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        //-------------------------------
        // instantiate keystone api chart

        this.keystoneApiPerfChart = new ApiPerfCollection({
            componentParam: 'keystone',
            urlBase: '/core/api-calls/'
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Keystone API Performance"),
            collection: this.keystoneApiPerfChart,
            height: 350,
            el: '#api-perf-report-r2-c1',
            width: $('#api-perf-report-r2-c1').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        //-----------------------------
        // instantiate glance api chart

        this.glanceApiPerfChart = new ApiPerfCollection({
            componentParam: 'glance',
            urlBase: '/core/api-calls/'
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Glance API Performance"),
            collection: this.glanceApiPerfChart,
            height: 350,
            el: '#api-perf-report-r2-c2',
            width: $('#api-perf-report-r2-c2').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        //-----------------------------
        // instantiate cinder api chart

        this.cinderApiPerfChart = new ApiPerfCollection({
            componentParam: 'cinder',
            urlBase: '/core/api-calls/'
        });

        this.cinderApiPerfChartView = new ApiPerfView({
            chartTitle: goldstone.translate("Cinder API Performance"),
            collection: this.cinderApiPerfChart,
            height: 350,
            el: '#api-perf-report-r3-c1',
            width: $('#api-perf-report-r3-c1').width(),
            yAxisLabel: goldstone.translate("Response Time (s)")
        });

        this.viewsToStopListening = [this.novaApiPerfChart, this.novaApiPerfChartView, this.neutronApiPerfChart, this.neutronApiPerfChartView, this.keystoneApiPerfChart, this.keystoneApiPerfChartView, this.glanceApiPerfChart, this.glanceApiPerfChartView, this.cinderApiPerfChart, this.cinderApiPerfChartView];

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

    margin: {
        top: 35,
        right: 40,
        bottom: 100,
        left: 70
    },

    instanceSpecificInit: function() {

        ApiPerfView.__super__.instanceSpecificInit.apply(this, arguments);

        // basic assignment of variables to be used in chart rendering
        this.standardInit();
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var self = this;

        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;

        self.svg = d3.select(this.el).select('.panel-body').append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        self.chart = self.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        // initialized the axes
        self.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (self.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(self.yAxisLabel)
            .style("text-anchor", "middle");

        self.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        self.x = d3.time.scale()
            .rangeRound([0, self.mw]);

        self.y = d3.scale.linear()
            .range([self.mh, 0]);

        self.xAxis = d3.svg.axis()
            .scale(self.x)
            .ticks(5)
            .orient("bottom");

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left");
    },

    update: function() {
        var self = this;
        var json = this.collection.toJSON();
        json = this.dataPrep(json);
        var mw = self.mw;
        var mh = self.mh;
        this.hideSpinner();

        if (this.checkReturnedDataSet(json) === false) {
            return;
        }

        $(this.el).find('svg').find('.chart').html('');
        $(this.el + '.d3-tip').detach();

        self.y.domain([0, d3.max(json, function(d) {
            return d.statistics.max;
        })]);

        json.forEach(function(d) {
            d.time = moment(d.key);
            d.min = d.statistics.min || 0;
            d.max = d.statistics.max || 0;
            d.avg = d.statistics.avg || 0;
        });

        self.x.domain(d3.extent(json, function(d) {
            return d.time;
        }));

        var area = d3.svg.area()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return self.x(d.time);
            })
            .y0(function(d) {
                return self.y(d.min);
            })
            .y1(function(d) {
                return self.y(d.max);
            });

        var maxLine = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return self.x(d.time);
            })
            .y(function(d) {
                return self.y(d.max);
            });

        var minLine = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return self.x(d.time);
            })
            .y(function(d) {
                return self.y(d.min);
            });

        var avgLine = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return self.x(d.time);
            })
            .y(function(d) {
                return self.y(d.avg);
            });

        var hiddenBar = self.chart.selectAll(this.el + ' .hiddenBar')
            .data(json);

        var hiddenBarWidth = mw / json.length;

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return "<p>" + d.time.format() +
                 "<br>Max: " +d.max.toFixed(3) + ' ' + goldstone.translate('seconds') +
                "<br>Avg: " + d.avg.toFixed(3) + ' ' + goldstone.translate('seconds') +
                "<br>Min: " + d.min.toFixed(3) + ' ' + goldstone.translate('seconds') +
                "<p>";
            });

        // Invoke the tip in the context of your visualization

        self.chart.call(tip);

        // initialize the chart lines

        self.chart.append("path")
            .datum(json)
            .attr("class", "area")
            .attr("id", "minMaxArea")
            .attr("d", area)
            .attr("fill", self.colorArray.distinct[3][1])
            .style("opacity", 0.8);

        self.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'minLine')
            .attr('data-legend', "Min")
            .style("stroke", self.colorArray.distinct[3][0])
            .datum(json)
            .attr('d', minLine);

        self.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'maxLine')
            .attr('data-legend', "Max")
            .style("stroke", self.colorArray.distinct[3][2])
            .datum(json)
            .attr('d', maxLine);

        self.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'avgLine')
            .attr('data-legend', "Avg")
            .style("stroke-dasharray", ("3, 3"))
            .style("stroke", self.colorArray.grey[0][0])
            .datum(json)
            .attr('d', avgLine);

        self.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + mh + ')')
            .call(self.xAxis);

        self.chart.append('g')
            .attr('class', 'y axis')
            .call(self.yAxis);

        var legend = self.chart.append("g")
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
                return self.y(d.max);
            })
            .attr("height", function(d) {
                return mh - self.y(d.max);
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
This view will be invoked upon initial site load, as it is
baked into dashboard.html, but not for every backbone router view load.

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

    instanceSpecificInit: function() {

        // prune old unused localStorage keys
        this.pruneLocalStorage();

        // if auth token present, hijack all subsequent ajax requests
        // with an auth header containing the locally stored token
        this.setAJAXSendRequestHeaderParams();

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

    setLogoutButtonHandler: function() {
        var self = this;
        $('.logout-btn').on('click', function() {

            // clicking logout button => submit userToken to
            // remove userToken. Upon success, remove token
            // and redirect to /login
            // if failed, raise alert and don't redirect

            $.post('/accounts/logout/')
                .done(function() {
                    goldstone.raiseSuccess('Logout Successful');
                    self.clearToken();
                    self.redirectToLogin();
                })
                .fail(function() {
                    goldstone.raiseWarning('Logout Failed');
                });
        });
    },

    clearToken: function() {
        localStorage.removeItem('userToken');
    },

    redirectToLogin: function() {
        location.href = "login/";
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

        // instantiate with infoText = 'hide' for option
        // to hide info button and skip attaching click listener
        if (this.infoText === undefined) {
            $(this.el).find('#info-button').hide();
            return;
        }

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
    },

    template: _.template('' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><%= this.chartTitle %>' +
        '<span class="pull-right special-icon-post"></span>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '<span class="pull-right special-icon-pre"></span>' +
        '</h3></div>' +
        '<div class="mainContainer"></div>'),

    templateOld: _.template('' +
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

/*
This view makes up the "Details" tab of nodeReportView.js
It is sub-classed from GoldstoneBaseView.

Instantiated on nodeReportView as:

this.detailsReport = new DetailsReportView({
    el: '#node-report-panel #detailsReport'
});
*/

var DetailsReportView = GoldstoneBaseView.extend({

    instanceSpecificInit: function(options) {
        this.render();

        // node data was stored in localStorage before the
        // redirect from the discover page
        var data = JSON.parse(localStorage.getItem('detailsTabData'));

        // clear after using
        localStorage.removeItem('detailsTabData');

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

var DiscoverPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.serviceStatusChartView.trigger('lookbackSelectorChanged');
            this.metricOverviewChartView.trigger('lookbackSelectorChanged');
            this.cpuResourcesChartView.trigger('lookbackSelectorChanged');
            this.memResourcesChartView.trigger('lookbackSelectorChanged');
            this.diskResourcesChartView.trigger('lookbackSelectorChanged');
            this.vmSpawnChartView.trigger('lookbackSelectorChanged');
        }
    },

    renderCharts: function() {

        /*
        Service Status Chart
        */

        this.serviceStatusChart = new ServiceStatusCollection({
            urlBase: '/core/saved_search/'
        });

        this.serviceStatusChartView = new ServiceStatusView({
            chartTitle: goldstone.translate("Service Status"),
            collection: this.serviceStatusChart,
            el: '#discover-view-r1-c1',
            width: $('#discover-view-r1-c1').width()
        });

        /*
        Metric Overview Chart
        */

        this.metricOverviewChart = new MetricOverviewCollection({
            urlBase: '/core/'
        });

        this.metricOverviewChartView = new MetricOverviewView({
            chartTitle: goldstone.translate("Metric Overview"),
            collection: this.metricOverviewChart,
            el: '#discover-view-r1-c2',
            width: $('#discover-view-r1-c2').width(),
            yAxisLabel: goldstone.translate("Count"),
            marginRight: 60
        });

        /*
        CPU Resources Chart
        */

        this.cpuResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.vcpus', 'nova.hypervisor.vcpus_used']
        });

        this.cpuResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("CPU"),
            collection: this.cpuResourcesChart,
            featureSet: 'cpu',
            height: 350,
            infoText: 'novaCpuResources',
            el: '#discover-view-r2-c1',
            width: $('#discover-view-r2-c1').width(),
            yAxisLabel: goldstone.translate('Cores')
        });

        /*
        Mem Resources Chart
        */

        this.memResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.memory_mb', 'nova.hypervisor.memory_mb_used']
        });

        this.memResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("Memory"),
            collection: this.memResourcesChart,
            featureSet: 'mem',
            height: 350,
            infoText: 'novaMemResources',
            el: '#discover-view-r2-c2',
            width: $('#discover-view-r2-c2').width(),
            yAxisLabel: goldstone.translate('MB')
        });

        /*
        Disk Resources Chart
        */

        this.diskResourcesChart = new MultiMetricComboCollection({
            metricNames: ['nova.hypervisor.local_gb', 'nova.hypervisor.local_gb_used']
        });

        this.diskResourcesChartView = new MultiMetricBarView({
            chartTitle: goldstone.translate("Storage"),
            collection: this.diskResourcesChart,
            featureSet: 'disk',
            height: 350,
            infoText: 'novaDiskResources',
            el: '#discover-view-r2-c3',
            width: $('#discover-view-r2-c3').width(),
            yAxisLabel: goldstone.translate('GB')
        });

        /*
        VM Spawns Chart
        */

        this.vmSpawnChart = new SpawnsCollection({
            urlBase: '/nova/hypervisor/spawns/'
        });

        this.vmSpawnChartView = new SpawnsView({
            chartTitle: goldstone.translate("VM Spawns"),
            collection: this.vmSpawnChart,
            height: 350,
            infoText: 'novaSpawns',
            el: '#discover-view-r2-c4',
            width: $('#discover-view-r2-c4').width(),
            yAxisLabel: goldstone.translate('Spawn Events')
        });

        this.viewsToStopListening = [this.serviceStatusChartView, this.metricOverviewChartView, this.cpuResourcesChartView, this.memResourcesChartView, this.diskResourcesChartView, this.vmSpawnChartView];

    },

    template: _.template('' +

        // service status
        '<div class="row">' +
        '<div id="discover-view-r1" class="row">' +
        '<div id="discover-view-r1-c1" class="col-md-2"></div>' +
        '<div id="discover-view-r1-c2" class="col-md-10"></div>' +
        '</div>' +

        // extra row for spacing
        '<div class="row">&nbsp;</div>' +

        // cpu / mem / disk
        // '<div class="row">' +
        '<h4>Resource Usage</h4>' +
        '<div id="discover-view-r2" class="row">' +
        '<div id="discover-view-r2-c1" class="col-md-3"></div>' +
        '<div id="discover-view-r2-c2" class="col-md-3"></div>' +
        '<div id="discover-view-r2-c3" class="col-md-3"></div>' +
        '<div id="discover-view-r2-c4" class="col-md-3"></div>' +
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

this.eventsBrowserVizCollection = new EventsHistogramCollection({});

this.eventsBrowserView = new ChartSet({
    chartTitle: goldstone.contextTranslate('Events vs Time', 'eventsbrowser'),
    collection: this.eventsBrowserVizCollection,
    el: '#events-histogram-visualization',
    infoIcon: 'fa-tasks',
    width: $('#events-histogram-visualization').width(),
    yAxisLabel: goldstone.contextTranslate('Number of Events', 'eventsbrowser')
});

*/

var EventsBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        EventsBrowserDataTableView.__super__.instanceSpecificInit.apply(this, arguments);
        this.processListenersForServerSide();
        this.renderFreshTable();
        this.initializeSearchTableServerSide('#reports-result-table');
    },

    update: function() {
        this.currentTop = $(document).scrollTop();
        this.oTable.ajax.reload();
    },

    oTableParamGeneratorBase: function() {
        var self = this;
        var standardAjaxOptions = {

            // corresponds to 'show xx entries' selector
            "iDisplayLength": self.cachedPageSize,

            // corresponds to 'showing x to y of z entries' display
            // and affects which pagination selector is active
            "iDisplayStart": self.cachedPaginationStart,
            "lengthChange": true,

            // populate search input box with string, if present
            "oSearch": {
                sSearch: self.cachedSearch
            },
            "ordering": false,
            "processing": false,
            "paging": true,
            "scrollX": true,
            "searching": true,
            "serverSide": true,
            "ajax": {
                beforeSend: function(obj, settings) {
                    self.hideSpinner();

                    // having the results of the last render that fit the
                    // current heading structure will allow to return it to 
                    // the table that is about to be destroyed and overwritten.
                    // just returning an empty set will cause a disorienting
                    // flash when the table is destroyed, prior to the next
                    // one being constructed.
                    self.mockForAjaxReturn = self.cachedResults;

                    // store the browser page height to restore it post-render
                    self.currentTop = $(document).scrollTop();

                    self.collectionMixin.urlGenerator();

                    // the pageSize and searchQuery are jQuery values and 
                    // will be stored as strings, even if numerical
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

                    // cache values for next serverside deferred rendering
                    self.cachedSearch = searchQuery;

                    // convert strings to numbers for both
                    self.cachedPageSize = parseInt(pageSize, 10); 
                    self.cachedPaginationStart = parseInt(paginationStart, 10);

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
                    /*if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

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
                    */

                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = self.serverSideDataPrep(data);

                    // add to JavaScript engine event loop to be handled
                    // after the function returns and the table
                    // renders the 'throw-away' version of the table
                    setTimeout(function() {
                        self.createNewDataTableFromResults(self.cachedTableHeadings, self.cachedResults);

                    }, 0);

                    // make the 'throw-away' version identical to the
                    // currently rendered table for better UX
                    if(self.mockForAjaxReturn) {
                        return JSON.stringify(
                            self.mockForAjaxReturn
                        );
                    } else {

                        // upon instantiation, just render empty dataTable
                        return JSON.stringify({
                            results: []
                        });
                    }
                },
            }
        }; // end standardAjaxOptions

        // in the case of their being cached data from the last call,
        // deferLoading will skip the ajax call and use the 
        // data already present in the dom
        if (self.cachedResults) {

            // sets 'z' in 'showing x to y of z records'
            standardAjaxOptions.deferLoading = self.cachedResults.recordsTotal;
        }

        // will be used as the 'options' when instantiating dataTable
        return standardAjaxOptions;
    },

    createNewDataTableFromResults: function(headings, results) {

        // at least one <th> required or else dataTables will error
        headings = headings || '<th></th>';

        // removes dataTable handling of table (sorting/searching/pagination)
        // but visible data remaions in DOM
        this.oTableApi.fnDestroy();

        // cache updated headings
        this.serverSideTableHeadings = headings;
        this.renderFreshTable();

        // construct table html from results matrix
        var constructedResults = '';
        _.each(results.results, function(line) {
            constructedResults += '<tr><td>';
            constructedResults += line.join('</td><td>');
            constructedResults += '</td></tr>';
        });

        // insert constructed table html into DOM target
        this.$el.find('.data-table-body').html(constructedResults);

        // 'turn on' dataTables handling of table in DOM.
        this.initializeSearchTableServerSide('#reports-result-table');

    },

    serverSideDataPrep: function(data) {
        data = JSON.parse(data);
        var result = {

            // run results through pre-processing step
            results: this.extractUniqAndDataSet(data.results),
            recordsTotal: data.count,
            recordsFiltered: data.count
        };
        this.cachedResults = result;
        result = JSON.stringify(result);
        return result;
    },

    // just an empty <th> element for initial render.
    serverSideTableHeadings: '' +
        '<th></th>',

    extractUniqAndDataSet: function(data) {
        var self = this;
        
        // strip object down to things in 'traits' and then
        // flatten object before returning it to the dataPrep function
        
        var result = data.map(function(record) {
            return record._source.traits;
        });

        var uniqueObjectKeys = _.uniq(_.flatten(result.map(function(record) {
            return _.keys(record);
        })));


        // START SORT

        // sort uniqueHeadings to favor order defined
        // by the hash in this.headingsToPin

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

        // keysWithName have been pulled out, now remove artifacts
        keysWithName = this.pruneUndefinedValues(keysWithName);

        // and sort remaining uniqueObjectKeys (sans keysWithName)
        uniqueObjectKeys = this.sortRemainingKeys(uniqueObjectKeys);

        // now put the keysWithName back at the beginning of the
        // uniqueObjectKeys array
        _.each(keysWithName, function(item) {
            uniqueObjectKeys.unshift(item[0]);
        });

        // END SORT

        // now use the uniqueObjectKeys to construct the table header
        // for the upcoming render
        var headerResult = '';
        _.each(uniqueObjectKeys, function(heading) {
            headerResult += '<th>' + heading + '</th>';
        });

        // and store for later
        self.cachedTableHeadings = headerResult;

        // make nested arrays of the final data to return
        // any undefined values will be replaced with empty string
        var finalResult = result.map(function(unit) {
            return _.map(uniqueObjectKeys, function(heading) {
                return unit[heading] || '';
            });
        });

        return finalResult;
    },

    // keys will be pinned in ascending value order of key:value pair
    headingsToPin: {
        'eventTime': 0,
        'eventType': 1,
        'id': 2,
        'action': 3,
        'outcome': 4,
    },

    // main template with placeholder for table
    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="refreshed-report-container"></div>'
    ),

    // table to be used with dataTables
    // dynamic headers to be inserted in the 'data-table-header-container'
    dataTableTemplate: _.template(
        '<table id="reports-result-table" class="table table-hover">' +
        '<thead class="data-table-thead">' +
        '<tr class="header data-table-header-container">' +

        // <th> elements will be dynamically inserted
        '</tr>' +
        '</thead>' +
        '<tbody class="data-table-body"></tbody>' +
        '</table>'
    ),

    renderFreshTable: function() {

        // the main table template only needs to be added once, to avoid 
        // poor UX from erasing and re-rendering entire table.
        if (!$('.data-table-body').length) {
            $(this.el).find('.refreshed-report-container').html(this.dataTableTemplate());
        }

        // add the default or generated table headings
        $(this.el).find('.data-table-header-container').html(this.serverSideTableHeadings);

        return this;
    },

    initializeSearchTableServerSide: function(location) {
        // params will include "deferLoading" after initial table rendering
        // in order for table to be able to recursively spawn itself
        // without infinite loop
        var oTableParams = this.oTableParamGeneratorBase();

        // initialize dataTable
        this.oTable = $(location).DataTable(oTableParams);

        // set reference to dataTable api to be used for fnDestroy();
        this.oTableApi = $(location).dataTable();

        // bring focus to search box
        if ($('input.form-control').val() !== undefined) {
            $('input.form-control').focus();

            // firefox puts the cursor at the beginning of the search box
            // after re-focus. Use the native 'input' element method
            // setSelectionRange to force cursor position to end of input box
            if($('input')[0].setSelectionRange) {
                var len = $('input.form-control').val().length * 2; // ensure end
                $('input.form-control')[0].setSelectionRange(len, len);
            } else {

                // IE hack, replace input with itself, hopefully to 
                // end up with cursor at end of input element
                $('input.form-control').val($('input.form-control').val());
            }

            // in case input element is a text field
            $('input.form-control').scrollTop = 1e6;
        }

        // reposition page to pre-refresh height
        if (this.currentTop !== undefined) {
            $(document).scrollTop(this.currentTop);
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

var EventsBrowserPageView = GoldstoneBasePageView.extend({

    renderCharts: function() {

        this.eventsBrowserVizCollection = new EventsHistogramCollection({});

        this.eventsBrowserView = new ChartSet({
            chartTitle: goldstone.contextTranslate('Event Search', 'eventsbrowser'),
            collection: this.eventsBrowserVizCollection,
            el: '#events-histogram-visualization',
            infoIcon: 'fa-tasks',
            marginLeft: 60,
            width: $('#events-histogram-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Number of Events', 'eventsbrowser')
        });

        // for access to url generation functions
        this.eventsBrowserTableCollection = new EventsBrowserTableCollection({
            skipFetch: true
        });

        this.eventsBrowserTable = new EventsBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Events Browser', 'eventsbrowser'),
            collectionMixin: this.eventsBrowserTableCollection,
            el: '#events-browser-table',
            infoIcon: 'fa-table',
            width: $('#events-browser-table').width()
        });

        // render predefinedSearch Dropdown
        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: new GoldstoneBaseCollection({
                skipFetch: true,
                urlBase: '',
                addRange: function() {
                    return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
                },
                addInterval: function(interval) {
                    return '&interval=' + interval + 's';
                },
            }),
            index_prefix: 'events_*',
            settings_redirect: '/#reports/eventbrowser/search'

        });

        this.eventsBrowserView.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // triggered on GoldstoneBasePageView2, itereates through array
        // and calls stopListening() and off() for memory management
        this.viewsToStopListening = [
            this.eventsBrowserVizCollection, this.eventsBrowserView, this.eventsBrowserTableCollection, this.eventsBrowserTable, this.predefinedSearchDropdown
        ];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.eventsBrowserView.trigger('lookbackSelectorChanged');
            this.eventsBrowserTable.trigger('lookbackSelectorChanged');
        }
    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer'],
        ['/#reports/eventbrowser', 'Event Viewer', 'active'],
        ['/#reports/apibrowser', 'API Call Viewer'],
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

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

    instanceSpecificInit: function() {

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
                result += '<option class="i18n" data-i18n="'+ item[1] +'" value="' + item[0] + '"';
                if (item[2] && item[2] === 'selected') {
                    result += ' selected';
                }
                result += '>' + item[1] + '</option>';
            });
            return result;
        } else {
            return '<option class="i18n" data-i18n="lookback 15m" value="15" selected>lookback 15m</option>' +
                '<option class="i18n" data-i18n="lookback 1h" value="60">lookback 1h</option>' +
                '<option class="i18n" data-i18n="lookback 6h" value="360">lookback 6h</option>' +
                '<option class="i18n" data-i18n="lookback 1d" value="1440">lookback 1d</option>' +
                '<option class="i18n" data-i18n="lookback 3d" value="4320">lookback 3d</option>' +
                '<option class="i18n" data-i18n="lookback 7d" value="10080">lookback 7d</option>';
        }
    },

    customRefresh: function() {
        if (this.defaults.lookbackValues && this.defaults.lookbackValues.refresh && this.defaults.lookbackValues.refresh.length) {
            result = '';
            _.each(this.defaults.lookbackValues.refresh, function(item) {
                result += '<option class="i18n" data-i18n="'+ item[1] +'" value="' + item[0] + '"';
                if (item[2] && item[2] === 'selected') {
                    result += ' selected';
                }
                result += '>' + item[1] + '</option>';
            });
            return result;
        } else {
            return '<option class="i18n" data-i18n="refresh 30s" value="30" selected>refresh 30s</option>' +
                '<option class="i18n" data-i18n="refresh 1m" value="60">refresh 1m</option>' +
                '<option class="i18n" data-i18n="refresh 5m" value="300">refresh 5m</option>' +
                '<option class="i18n" data-i18n="refresh off" value="-1">refresh off</option>';
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

var LogBrowserDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        LogBrowserDataTableView.__super__.instanceSpecificInit.apply(this, arguments);
        this.drawSearchTableServerSide('#reports-result-table');
    },

    processListenersForServerSide: function() {
        // overwriting so that dataTable only renders as a result of actions
        // from viz above
    },

    predefinedSearchUrl: null,

    predefinedSearch: function(uuid) {
        var self = this;

        // turn off refresh range as a signal to the user that refreshes
        // will no longer be occuring without changing the lookback
        // or refresh. setZoomed will block the action of the cached refresh
        $('#global-refresh-range').val(-1);
        this.trigger('setZoomed', true);

        // the presence of a predefinedSearchUrl will take precidence
        // when creating a fetch url in the ajax.beforeSend routine.
        this.predefinedSearchUrl = uuid;
        oTable = $("#reports-result-table").DataTable();
        oTable.ajax.reload(function() {
            setTimeout(function() {

                // manually retrigger column auto adjust which was not firing
                oTable.columns.adjust().draw();
            }, 10);

        });
    },

    update: function() {
        var oTable;

        // clear out the saved search url so next time the viz is
        // triggered it will not return the previously saved url
        this.predefinedSearchUrl = null;

        if ($.fn.dataTable.isDataTable("#reports-result-table")) {
            oTable = $("#reports-result-table").DataTable();
            oTable.ajax.reload(function() {
                setTimeout(function() {

                    // manually retrigger column auto adjust which was not firing
                    oTable.columns.adjust().draw();
                }, 10);

            });
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
            }],
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

                    // if a predefined search url has been set
                    // use that instead of the generated url
                    settings.url = (self.predefinedSearchUrl ? self.predefinedSearchUrl + '?' : self.collectionMixin.url + '&') + "page_size=" + pageSize +
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

        _.each(data.results, function(item) {

            // if any field is undefined, dataTables throws an alert
            // so set to empty string if otherwise undefined
            item['@timestamp'] = item._source['@timestamp'] || '';
            item.syslog_severity = item._source.syslog_severity || '';
            item.component = item._source.component || '';
            item.log_message = item._source.log_message || '';
            item.host = item._source.host || '';
        });

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
        '<th><%=goldstone.contextTranslate(\'Timestamp\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Syslog Severity\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Component\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Host\', \'logbrowserdata\')%></th>' +
        '<th><%=goldstone.contextTranslate(\'Message\', \'logbrowserdata\')%></th>' +
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

            this.logBrowserVizCollection = new LogBrowserCollection({
            urlBase: '/logging/summarize/',

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.logBrowserVizCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'searchLogAnalysis',
            marginLeft: 60,
            urlRoot: "/logging/summarize/?",
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });

        this.logBrowserTableCollection = new GoldstoneBaseCollection({
            skipFetch: true
        });    
        this.logBrowserTableCollection.urlBase = "/logging/search/";
        this.logBrowserTableCollection.addRange = function() {
            return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
        };

        this.logBrowserTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.logBrowserTableCollection,
            el: '#log-viewer-table',
            infoIcon: 'fa-table',
            width: $('#log-viewer-table').width()
        });


*/

var LogBrowserViz = GoldstoneBaseView.extend({

    margin: {
        top: 20,
        right: 40,
        bottom: 80,
        left: 70
    },

    // IMPORTANT: the order of the entries in the
    // Log Severity Filters modal is set by the order
    // of the event types in self.filter

    filter: {
        EMERGENCY: true,
        ALERT: true,
        CRITICAL: true,
        ERROR: true,
        WARNING: true,
        NOTICE: true,
        INFO: true,
        DEBUG: true
    },

    // will prevent updating when zoom is active
    isZoomed: false,

    predefinedSearch: function(payload) {
        this.collection.reset();
        this.collection.add(payload);
        this.update();
    },

    setZoomed: function(bool) {
        this.isZoomed = bool;
        this.collection.isZoomed = bool;
    },

    instanceSpecificInit: function() {
        LogBrowserViz.__super__.instanceSpecificInit.call(this, arguments);

        this.standardInit();
        this.specialInit();
    },

    constructUrl: function() {
        this.collection.urlGenerator();
    },

    processListeners: function() {
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            self.update();
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            self.showSpinner();
            self.setZoomed(false);
            self.constructUrl();
            this.trigger('chartUpdate');
        });

        this.listenTo(this, 'refreshSelectorChanged', function() {
            self.showSpinner();
            self.setZoomed(false);
            self.constructUrl();
            this.trigger('chartUpdate');
        });

        this.listenTo(this, 'lookbackIntervalReached', function() {
            if (self.isZoomed === true) {
                return;
            }
            this.showSpinner();
            this.constructUrl();
            this.trigger('chartUpdate');
        });

    },

    standardInit: function() {

        var self = this;

        self.mw = self.width - self.margin.left - self.margin.right;
        self.mh = self.height - self.margin.top - self.margin.bottom;

        self.svg = d3.select(this.el).select('.panel-body').append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        self.chart = self.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        // initialized the axes
        self.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (self.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(self.yAxisLabel)
            .style("text-anchor", "middle");

        self.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        self.x = d3.time.scale()
            .rangeRound([0, self.mw]);

        self.y = d3.scale.linear()
            .range([self.mh, 0]);

        self.colorArray = new GoldstoneColors().get('colorSets');

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left");

        self.color = d3.scale.ordinal().domain(["EMERGENCY", "ALERT", "CRITICAL", "ERROR", "WARNING", "NOTICE", "INFO", "DEBUG"])
            .range(self.colorArray.distinct.openStackSeverity8);

        self.area = d3.svg.area()
            .interpolate("monotone")
            .x(function(d) {
                return self.x(d.date);
            })
            .y0(function(d) {
                return self.y(d.y0);
            })
            .y1(function(d) {
                return self.y(d.y0 + d.y);
            });

        self.stack = d3.layout.stack()
            .values(function(d) {
                return d.values;
            });

        self.xAxis = d3.svg.axis()
            .scale(self.x)
            .orient("bottom")
            .ticks(7);
    },

    specialInit: function() {
        var self = this;

        // ZOOM IN
        this.$el.find('.fa-search-plus').on('click', function() {
            self.paintNewChart([self.width, 0], 4);
        });

        // ZOOM IN MORE
        this.$el.find('.fa-forward').on('click', function() {
            self.paintNewChart([self.width, 0], 12);
        });

        // ZOOM OUT
        this.$el.find('.fa-search-minus').on('click', function() {
            self.paintNewChart([self.width * 0.7, 0], 0.45);
        });

        // ZOOM OUT MORE
        this.$el.find('.fa-backward').on('click', function() {
            self.paintNewChart([self.width * 0.7, 0], 0.25);
        });
    },

    paintNewChart: function(coordinates, mult) {
        var self = this;

        this.showSpinner();
        self.setZoomed(true);

        var $gls = $('.global-refresh-selector select');
        if ($gls.length) {
            $('.global-refresh-selector select').val(-1);
        }

        var zoomedStart;
        var zoomedEnd;

        var leftMarginX = 67;
        var rightMarginX = 26;

        var adjustedClick = Math.max(0, Math.min(coordinates[0] - leftMarginX, (self.width - leftMarginX - rightMarginX)));

        var fullDomain = [+self.x.domain()[0], +self.x.domain()[1]];

        var domainDiff = fullDomain[1] - fullDomain[0];

        var clickSpot = +self.x.invert(adjustedClick);

        var zoomMult = mult || 4;

        zoomedStart = Math.floor(clickSpot - (domainDiff / zoomMult));
        zoomedEnd = Math.floor(clickSpot + (domainDiff / zoomMult));


        // avoids getting stuck with times greater than now.
        if (zoomedEnd - zoomedStart < 2000) {
            zoomedStart -= 2000;
        }

        this.collection.zoomedStart = zoomedStart;
        this.collection.zoomedEnd = Math.min(+new Date(), zoomedEnd);

        this.constructUrl();
        this.trigger('chartUpdate');
        return;
    },

    dblclicked: function(coordinates) {
        this.paintNewChart(coordinates);
    },

    collectionPrep: function() {

        var self = this;

        // this.collection.toJSON() returns the collection data
        var collectionDataPayload = this.collection.toJSON()[0];
        // we use only the 'data' for the construction of the chart
        var data = collectionDataPayload.aggregations.per_interval.buckets;

        // prepare empty array to return at end
        finalData = [];

        // layers of nested _.each calls
        // the first one iterates through each object
        // in the 'data' array as 'item':

        // {
        //     "per_level": {
        //         "buckets": [{
        //             "key": "INFO",
        //             "doc_count": 112
        //         }, {
        //             "key": "NOTICE",
        //             "doc_count": 17
        //         }, {
        //             "key": "ERROR",
        //             "doc_count": 5
        //         }, {
        //             "key": "WARNING",
        //             "doc_count": 2
        //         }],
        //         "sum_other_doc_count": 0,
        //         "doc_count_error_upper_bound": 0
        //     },
        //     "key_as_string": "2016-01-07T22:24:45.000Z",
        //     "key": 1452205485000,
        //     "doc_count": 190
        // },

        // the next _.each iterates through the array of
        // nested objects that are keyed to the timestamp
        // as 'subItem'
        // [{
        //     "key": "INFO",
        //     "doc_count": 112
        // }, {
        //     "key": "NOTICE",
        //     "doc_count": 17
        // }, {
        //     "key": "ERROR",
        //     "doc_count": 5
        // }, {
        //     "key": "WARNING",
        //     "doc_count": 2
        // }],

        _.each(data, function(item) {

            var tempObject = {};

            _.each(item.per_level.buckets, function(subItem) {
                _.each(subItem, function() {

                    // each key/value pair of the subSubItems is added to tempObject
                    var key = subItem.key;
                    var value = subItem.doc_count;
                    tempObject[key] = value;
                });
            });

            // and then after tempObject is populated
            // it is standardized for chart consumption
            // by making sure to add '0' for unreported
            // values, and adding the timestamp

            _.each(self.filter, function(item, i) {
                tempObject[i] = tempObject[i] || 0;
            });
            tempObject.date = item.key;
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
        return finalData;

    },

    sums: function(datum) {
        var self = this;

        // Return the sums for the filters that are on
        return d3.sum(self.color.domain().map(function(k) {

            if (self.filter[k]) {
                return datum[k];
            } else {
                return 0;
            }
        }));
    },

    update: function() {

        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        this.hideSpinner();

        // define allthelogs and self.data even if
        // rendering is halted due to empty data set
        var allthelogs = this.collectionPrep();
        self.data = allthelogs;
        self.loglevel = d3.scale.ordinal()
            .domain(["EMERGENCY", "ALERT", "CRITICAL", "ERROR", "WARNING", "NOTICE", "INFO", "DEBUG"])
            .range(self.colorArray.distinct.openStackSeverity8);

        // clear viz
        self.chart.selectAll('.component')
            .remove();

        // If we didn't receive any valid files, append "No Data Returned" and halt
        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

        self.color.domain(d3.keys(self.data[0]).filter(function(key) {

            return (self.filter[key] && key !== "date" && key !== "total" && key !== "time");
        }));

        var components;
        var curr = false;
        var anyLiveFilter = _.reduce(self.filter, function(curr, status) {
            return status || curr;
        });

        if (!anyLiveFilter) {
            self.chart.selectAll('.component')
                .remove();
            return;
        }

        components = self.stack(self.color.domain().map(function(name) {
            return {
                name: name,
                values: self.data.map(function(d) {
                    return {
                        date: d.date,
                        y: d[name]
                    };
                })
            };
        }));

        $(this.el).find('.axis').remove();

        self.x.domain(d3.extent(self.data, function(d) {
            return d.date;
        }));

        self.y.domain([
            0,
            d3.max(self.data.map(function(d) {
                return self.sums(d);
            }))
        ]);

        var component = self.chart.selectAll(".component")
            .data(components)
            .enter().append("g")
            .attr("class", "component");

        component.append("path")
            .attr("class", "area")
            .attr("d", function(d) {
                return self.area(d.values);
            })
            .style("stroke", function(d) {
                return self.loglevel(d.name);
            })
            .style("stroke-width", function(d) {
                return 1.5;
            })
            .style("stroke-opacity", function(d) {
                return 1;
            })
            .style("fill", function(d) {
                return self.loglevel(d.name);
            });

        component.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + self.x(d.value.date) + "," + self.y(d.value.y0 + d.value.y / 2) + ")";
            })
            .attr("x", 1)
            .attr("y", function(d, i) {
                // make space between the labels
                return 0;
            })
            .style("font-size", ".8em");

        self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.mh + ")")
            .call(self.xAxis);

        self.chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis);

        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in self.filter

        // populate the modal based on the event types.
        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(_.keys(self.filter), function(item) {

            if (item === 'none') {
                return null;
            }

            var addCheckIfActive = function(item) {
                if (self.filter[item]) {
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
                'style="opacity: 0.8; background-color:' + self.loglevel([item]) + '">' +
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
            self.filter[checkboxId] = !self.filter[checkboxId];
            self.update();
        });

        this.redraw();

    },

    redraw: function() {

        var self = this;

        self.y.domain([
            0,
            d3.max(self.data.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(this.el).select('.x.axis')
            .transition()
            .duration(500)
            .call(self.xAxis.scale(self.x));

        d3.select(this.el).select('.y.axis')
            .transition()
            .duration(500)
            .call(self.yAxis.scale(self.y));

        // this.trigger('chartUpdate');
    },

    filterModal: _.template(
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

    addModalAndHeadingIcons: function() {
        $(this.el).find('.special-icon-pre').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 15px;"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-forward pull-right" style="margin: 0 4px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-plus pull-right" style="margin: 0 5px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-minus pull-right" style="margin: 0 20px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-backward pull-right" style="margin: 0 5px 0 0"></i>');
        this.$el.append(this.filterModal());
        return this;
    },

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
The intelligence/search page is composed of a LogBrowserViz on top,
and a LogBrowserDataTableView on the bottom. The global lookback/refresh
listeners are listenTo()'d by each view. Changes to what is rendered
in the top also affect the table on the bottom via a 'trigger'.
*/

var LogSearchPageView = GoldstoneBasePageView.extend({

    triggerChange: function(change) {
        this.logBrowserViz.trigger(change);
        this.logBrowserTable.trigger(change);
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    renderCharts: function() {

        var self = this;
        this.logBrowserVizCollection = new LogBrowserCollection({
            urlBase: '/core/logs/',

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Log Search', 'logbrowserpage'),
            collection: this.logBrowserVizCollection,
            el: '#log-viewer-visualization',
            infoText: 'logBrowser',
            marginLeft: 70,
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });

        this.logBrowserTableCollection = new LogBrowserTableCollection({
            skipFetch: true,
            specificHost: this.specificHost,
            urlBase: '/core/logs/',
            linkedCollection: this.logBrowserVizCollection
        });

        this.logBrowserTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.logBrowserTableCollection,
            el: '#log-viewer-table',
            infoIcon: 'fa-table',
            width: $('#log-viewer-table').width()
        });

        // initial rendering of logBrowserTable:
        this.logBrowserTableCollection.filter = this.logBrowserViz.filter;
        this.logBrowserTable.update();

        // set up listener between viz and table to setZoomed to 'true'
        // when user triggers a saved search
        this.logBrowserViz.listenTo(this.logBrowserTable, 'setZoomed', function(trueFalse) {
            this.setZoomed(trueFalse);
        });

        // render predefinedSearch Dropdown
        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: new GoldstoneBaseCollection({
                skipFetch: true,
                urlBase: '',
                addRange: function() {
                    return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
                },
                addInterval: function(interval) {
                    return '&interval=' + interval + 's';
                },
            }),
            index_prefix: 'logstash-*',
            settings_redirect: '/#reports/logbrowser/search'

        });

        this.logBrowserViz.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        // subscribe logBrowserViz to click events on predefined
        // search dropdown to fetch results.
        this.listenTo(this.predefinedSearchDropdown, 'clickedUuidViz', function(uuid) {
            // self.logBrowserTable.predefinedSearch(uuid[1]);
            self.logBrowserViz.predefinedSearch(uuid[0]);
        });
        this.listenTo(this.predefinedSearchDropdown, 'clickedUuidTable', function(uuid) {
            self.logBrowserTable.predefinedSearch(uuid[1]);
            // self.logBrowserViz.predefinedSearch(uuid[0]);
        });

        // set up a chain of events between viz and table to uddate
        // table when updating viz.
        this.listenTo(this.logBrowserViz, 'chartUpdate', function() {
            self.logBrowserTableCollection.filter = self.logBrowserViz.filter;
            self.logBrowserTable.update();
        });

        // destroy listeners and views upon page close
        this.viewsToStopListening = [this.logBrowserVizCollection, this.logBrowserViz, this.logBrowserTableCollection, this.logBrowserTable, this.predefinedSearchDropdown];

    },

    templateButtonSelectors: [
        ['/#reports/logbrowser', 'Log Viewer', 'active'],
        ['/#reports/eventbrowser', 'Event Viewer'],
        ['/#reports/apibrowser', 'API Call Viewer'],
    ],

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors) %>' +
        // end tabbed nav selectors

        // divs for log viewer viz on top and dataTable below
        '<div class="row">' +
        '<div id="log-viewer-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="log-viewer-table" class="col-md-12"></div>' +
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

var LoginPageView = GoldstoneBaseView.extend({

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
        var self = this;

        // this call returns BEFORE redirecting to '/' to avoid async
        // issue with firefox/safari where the addons dict wasn't
        // added to localStorage

        $.ajax({
            type: 'get',
            url: '/addons/'
        }).done(function(success) {
            localStorage.setItem('addons', JSON.stringify(success));

            self.redirectPostSuccessfulAuth();    
        }).fail(function(fail) {
            self.redirectPostSuccessfulAuth();    
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

                // after a successful login, check for installed apps BEFORE 
                // redirecting to dashboard. Chrome can handle the async
                // request to /addons/ but firefox/safari fail.

                // must follow storing token otherwise call will fail with 401
                self.checkForInstalledApps();
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

// ChartSet extends from GoldstoneBaseView

var MetricOverviewView = ChartSet.extend({

    makeChart: function() {
        this.colorSet = d3.scale.ordinal().domain(['api', 'event', 'log']).range(this.colorArray.distinct['3R']);
        this.svgAdder(this.width, this.height);
        this.initializePopovers();
        this.chartAdder();

        this.setXDomain();
        this.setYDomain();

        this.setXAxis();
        this.callXAxis();
        this.setYAxisLabel();

        // added
        this.setLines();
        this.setLegend();
    },

    setLegend: function() {
        var self = this;

        var legendText = [{
            text: goldstone.translate('API'),
            colorSet: 'api'
        }, {
            text: goldstone.translate('Events'),
            colorSet: 'event'
        }, {
            text: goldstone.translate('Logs'),
            colorSet: 'log'
        }];

        var legend = this.svg.selectAll('g')
            .data(legendText)
            .append('g');

        legend.append('rect')
            .attr('x', function(d, i) {
                return i * 70;
            })
            .attr('y', -20)
            .attr('width', '10px')
            .attr('height', '10px')
            .attr('fill', function(d) {
                return self.colorSet(d.colorSet);
            });

        legend.append('text')
            .text(function(d) {
                return d.text;
            })
            .attr('color', 'black')
            .attr('x', function(d, i) {
                return i * 70 + 14;
            })
            .attr('y', -10)
            .attr('font-size', '15px');

    },

    chartAdder: function() {
        this.chart = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');

        this.chartApi = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');

        this.chartEvent = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');

        this.chartLog = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');
    },

    initializePopovers: function() {
        var self = this;
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0]);

        // .html set in this.mouseoverAction

        this.svg.call(this.tip);
    },

    setLines: function() {
        var self = this;

        this.apiLine = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yApi(d.doc_count);
            });

        this.eventLine = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yEvent(d.doc_count);
            });

        this.logLine = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yLog(d.doc_count);
            });
    },

    resetAxes: function() {
        var self = this;
        d3.select(this.el).select('.axis.x')
            .transition()
            .call(this.xAxis.scale(self.x));
    },

    update: function() {
        this.setData(this.collection.toJSON());
        this.updateWithNewData();
    },

    updateWithNewData: function() {
        this.setXDomain();
        this.setYDomain();
        this.resetAxes();
        this.linesUpdate();
        this.shapeUpdate();
        this.shapeEnter();
        this.shapeExit();
        this.hideSpinner();
    },

    svgAdder: function() {
        this.svg = d3.select(this.el).select('.panel-body').append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
    },

    setXDomain: function() {
        var self = this;
        this.x = d3.time.scale()
        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        .domain(self.data.length ? [moment(self.data[0].startTime), moment(self.data[0].endTime)] : [1, 1])
            .range([0, (this.width - this.marginLeft - this.marginRight)]);

    },

    setYDomain: function() {
        var param = this.yParam || 'count';
        var self = this;

        var oneThird = (this.height - this.marginTop - this.marginBottom)/3;
        var rangePadding = 10;

        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        this.yLog = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(self.data[0].logData.aggregations.per_interval.buckets, function(d) {
                return d.doc_count;
            }) : 0])
            .range([oneThird * 3, oneThird * 2 + rangePadding]);

        this.yEvent = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(self.data[0].eventData.aggregations.per_interval.buckets, function(d) {
                return d.doc_count;
            }) : 0])
            .range([oneThird * 2, oneThird + rangePadding]);

        this.yApi = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(self.data[0].apiData.aggregations.per_interval.buckets, function(d) {
                return d.doc_count;
            }) : 0])
            .range([oneThird, 0 + rangePadding]);

    },

    linesUpdate: function() {

        var self = this;
        var existingLines = this.chart.select('path');

        if (existingLines.empty()) {
            this.apiLineRendered = this.chart.append('path')
                .attr('class', 'apiLine')
                .attr('d', this.apiLine(this.data[0].apiData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke-width', '2px')
                .style('shape-rendering', 'geometricPrecision')
                .style('stroke', self.colorSet('api'));

            this.eventLineRendered = this.chart.append('path')
                .attr('class', 'eventLine')
                .attr('d', this.eventLine(this.data[0].eventData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke-width', '2px')
                .style('shape-rendering', 'geometricPrecision')
                .style('stroke', self.colorSet('event'));

            this.logLineRendered = this.chart.append('path')
                .attr('class', 'logLine')
                .attr('d', this.logLine(this.data[0].logData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke-width', '2px')
                .style('shape-rendering', 'geometricPrecision')
                .style('stroke', self.colorSet('log'));
        }

        this.apiLineRendered
            .transition()
            .attr('d', this.apiLine(this.data[0].apiData.aggregations.per_interval.buckets));

        this.eventLineRendered
            .transition()
            .attr('d', this.eventLine(this.data[0].eventData.aggregations.per_interval.buckets));

        this.logLineRendered
            .transition()
            .attr('d', this.logLine(this.data[0].logData.aggregations.per_interval.buckets));
    },

    shapeUpdate: function() {
        var self = this;

        this.chartApiCircles = this.chartApi.selectAll('circle')
            .data(this.data[0].apiData.aggregations.per_interval.buckets);

        this.chartApiCircles
            .transition()
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yApi(d.doc_count);
            });


        this.chartEventCircles = this.chartEvent.selectAll('circle')
            .data(this.data[0].eventData.aggregations.per_interval.buckets);

        this.chartEventCircles
            .transition()
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yEvent(d.doc_count);
            });

        this.chartLogCircles = this.chartLog.selectAll('circle')
            .data(this.data[0].logData.aggregations.per_interval.buckets);

        this.chartLogCircles
            .transition()
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yLog(d.doc_count);
            });

    },

    shapeEnter: function() {
        var self = this;

        this.chartApiCircles
            .enter().append('circle')
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yApi(d.doc_count);
            })
            .attr('class', 'apiCircle')
            .attr('r', function(d) {

                // response_ranges need to be pushed into an array
                var responseRangeArray = [];
                _.each(d.response_ranges.buckets, function(item) {
                    responseRangeArray.push(item);
                });

                var radiusByResponseRange = responseRangeArray.filter(function(item) {
                        // filter for 4 and 500's
                        return item.from === 400 || item.from === 500;
                    })
                    .reduce(function(pre, next) {
                        // add up 4 and 500's
                        return pre + next.doc_count;
                    }, 0);

                // return proportional radius
                return radiusByResponseRange === 0 ? 2 : (radiusByResponseRange / d.doc_count) * 2 + 2;
            })
            .style('stroke', this.colorSet('api'))
            .style('fill', this.colorSet('api'))
            .on('mouseover', function(d) {
                self.mouseoverAction(d, 'Api Events');
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            });

        this.chartEventCircles
            .enter().append('circle')
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yEvent(d.doc_count);
            })
            .attr('class', 'eventCircle')
            .attr('r', function(d) {
                var radiusByOutcome = d.per_outcome.buckets.filter(function(item) {

                        // filter out success/pending
                        return item.key !== "success" && item.key !== "pending";
                    })
                    .reduce(function(pre, next) {

                        // sum non success/pending counts
                        return pre + next.doc_count;
                    }, 0);

                // return proportional radius
                return d.doc_count === 0 ? 2 : (radiusByOutcome / d.doc_count) * 2 + 2;
            })
            .style('stroke', this.colorSet('event'))
            .style('fill', this.colorSet('event'))
            .on('mouseover', function(d) {
                self.mouseoverAction(d, 'Events');
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            });

        this.chartLogCircles
            .enter().append('circle')
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yLog(d.doc_count);
            })
            .attr('class', 'logCircle')
            .attr('r', function(d) {

                var radiusByLevel = d.per_level.buckets.filter(function(item) {

                        // filter out debug through error
                        return self.severityHash[item] === true;
                    })
                    .reduce(function(pre, next) {

                        // sum counts
                        return pre + next.doc_count;
                    }, 0);

                // return proportional radius
                return d.doc_count === 0 ? 2 : (radiusByLevel / d.doc_count) * 2 + 2;
            })
            .style('stroke', this.colorSet('log'))
            .style('fill', this.colorSet('log'))
            .on('mouseover', function(d) {
                self.mouseoverAction(d, 'Logs');
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            });
    },

    shapeExit: function() {
        this.chartApiCircles.exit().remove();
        this.chartEventCircles.exit().remove();
        this.chartLogCircles.exit().remove();
    },

    mouseoverAction: function(d, setName) {
        var self = this;

        // variably set this.tip.html based on the line set that is passed in
        this.tip.html(function(d, setName) {

            var extraContent;
            if (setName === 'Events') {
                extraContent = '<br>' +

                'Success: ' + (d.per_outcome.buckets.filter(function(item) {
                        return item.key === "success";
                    })
                    .reduce(function(pre, next) {
                        return pre + next.doc_count;
                    }, 0)) + '<br>' +
                    'Pending: ' + (d.per_outcome.buckets.filter(function(item) {
                            return item.key === "pending";
                        })
                        .reduce(function(pre, next) {
                            return pre + next.doc_count;
                        }, 0)) + '<br>' +
                    'Failure: ' + (d.per_outcome.buckets.filter(function(item) {
                            return item.key !== "pending" &&
                                item.key !== "success";
                        })
                        .reduce(function(pre, next) {
                            return pre + next.doc_count;
                        }, 0)) + '<br>';

            } else if (setName === 'Logs') {

                extraContent = '';

                // iterate through the severity levels
                _.each(self.severityHash, function(item, name) {

                    // filter for nonZero values against the severity level
                    var nonZero = d.per_level.buckets.filter(function(bucket) {
                        return bucket.key === name;
                    }).reduce(function(pre, next) {
                        return pre + next.doc_count;
                    }, 0);


                    // and append a popup value for that nonZero filter level
                    if (nonZero > 0) {
                        extraContent += '<br>' + name + ': ' + (d.per_level.buckets.filter(function(level) {
                                return level.key === name;
                            })
                            .reduce(function(pre, next) {
                                return pre + next.doc_count;
                            }, 0));
                    }
                });

            } else if (setName === 'Api Events') {
                var responseRangeArray = [];
                _.each(d.response_ranges.buckets, function(item) {
                    responseRangeArray.push(item);
                });

                extraContent = '<br>' +


                '400 errors: ' + responseRangeArray.filter(function(item) {
                    // filter for 4 and 500's
                    return item.from === 400;
                })
                    .reduce(function(pre, next) {
                        // add up 400's
                        return pre + next.doc_count;
                    }, 0) + '<br>' +
                    '500 errors: ' + responseRangeArray.filter(function(item) {
                        // filter for 4 and 500's
                        return item.from === 500;
                    })
                    .reduce(function(pre, next) {
                        // add up 500's
                        return pre + next.doc_count;
                    }, 0);

            } else {
                extraContent = '';
            }

            return moment(d.key).format('ddd MMM D YYYY') + "<br>" +
                moment(d.key).format('h:mm:ss a') + "<br>" +
                d.doc_count + ' ' + setName + extraContent;
        });

        this.tip.show(d, setName);
    },

    mouseoutAction: function(d) {
        this.tip.hide();
    },

    severityHash: {
        EMERGENCY: true,
        ALERT: true,
        CRITICAL: true,
        ERROR: false,
        WARNING: false,
        NOTICE: false,
        INFO: false,
        DEBUG: false,
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

    margin: {
        top: 55,
        right: 80,
        bottom: 90,
        left: 70
    },

    instanceSpecificInit: function() {

        MultiMetricBarView.__super__.instanceSpecificInit.apply(this, arguments);

        this.standardInit();
        this.specialInit();
    },

    processOptions: function() {

        MultiMetricBarView.__super__.processOptions.apply(this, arguments);
        this.featureSet = this.options.featureSet || null;
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var self = this;

        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;

        self.svg = d3.select(this.el).select('.panel-body').append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        self.chart = self.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        // initialized the axes
        self.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (self.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(self.yAxisLabel)
            .style("text-anchor", "middle");

        self.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        self.x = d3.time.scale()
            .rangeRound([0, self.mw]);

        self.y = d3.scale.linear()
            .range([self.mh, 0]);

        self.xAxis = d3.svg.axis()
            .scale(self.x)
            .ticks(2)
            .orient("bottom");

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left");

        self.colorArray = new GoldstoneColors().get('colorSets');
    },

    processListeners: function() {
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.urlCollectionCount === 0) {
                self.update();
                // the collection count will have to be set back to the original count when re-triggering a fetch.
                self.collection.urlCollectionCount = self.collection.urlCollectionCountOrig;
                self.collection.fetchInProgress = false;
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            $(this.el).find('#spinner').show();
            this.collection.fetchMultipleUrls();
        });
    },

    dataErrorMessage: function(message, errorMessage) {

        MultiMetricBarView.__super__.dataErrorMessage.apply(this, arguments);

        var self = this;

        // the collection count will have to be set back to the original count when re-triggering a fetch.
        self.collection.urlCollectionCount = self.collection.urlCollectionCountOrig;
        self.collection.fetchInProgress = false;
    },

    specialInit: function() {
        var self = this;

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left")
            .tickFormat(d3.format("d"));

        // differentiate color sets for mem and cpu charts
        if (self.featureSet === 'mem' || self.featureSet === 'cpu') {
            self.color = d3.scale.ordinal().range(self.colorArray.distinct['3R']);
        }
        if (self.featureSet === 'metric') {
            self.color = d3.scale.ordinal().range(self.colorArray.distinct[1]);
        } else {
            // this includes "VM Spawns" and "Disk Resources" chars
            self.color = d3.scale.ordinal()
                .range(self.colorArray.distinct['2R']);
        }

    },

    collectionPrep: function(data) {
        var self = this;

        var condensedData;
        var dataUniqTimes;
        var newData;

        var uniqTimestamps;
        var finalData = [];

        if (self.featureSet === 'cpu') {
        // data morphed through collectionPrep into:
        // {
        //     "eventTime": "1424586240000",
        //     "Used": 6,
        //     "Physical": 16,
        //     "Virtual": 256
        // });

            _.each(data, function(collection) {
                // within each collection, tag the data points
                _.each(collection.aggregations.per_interval.buckets, function(dataPoint) {
                    dataPoint['@timestamp'] = dataPoint.key;
                    dataPoint.name = collection.metricSource;
                    dataPoint.value = dataPoint.statistics.max;
                });
            });

            condensedData = _.flatten(_.map(data, function(item) {
                return item.aggregations.per_interval.buckets;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item['@timestamp'];
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
                var key = item.key;
                var metric = item.name.slice(item.name.lastIndexOf('.') + 1);
                newData[key][metric] = item.value;
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

        } else if (self.featureSet === 'disk') {

            _.each(data, function(collection) {
                // within each collection, tag the data points
                _.each(collection.aggregations.per_interval.buckets, function(dataPoint) {
                    dataPoint['@timestamp'] = dataPoint.key;
                    dataPoint.name = collection.metricSource;
                    dataPoint.value = dataPoint.statistics.max;
                });
            });

            condensedData = _.flatten(_.map(data, function(item) {
                return item.aggregations.per_interval.buckets;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item['@timestamp'];
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
                var key = item.key;
                var metric = item.name.slice(item.name.lastIndexOf('.') + 1);
                newData[key][metric] = item.value;
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

        } else if (self.featureSet === 'mem') {

            _.each(data, function(collection) {

                // within each collection, tag the data points
                _.each(collection.aggregations.per_interval.buckets, function(dataPoint) {
                    dataPoint['@timestamp'] = dataPoint.key;
                    dataPoint.name = collection.metricSource;
                    dataPoint.value = dataPoint.statistics.max;
                });
            });

            condensedData = _.flatten(_.map(data, function(item) {
                return item.aggregations.per_interval.buckets;
            }));

            dataUniqTimes = _.uniq(_.map(condensedData, function(item) {
                return item['@timestamp'];
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
                var key = item.key;
                var metric = item.name.slice(item.name.lastIndexOf('.') + 1);
                newData[key][metric] = item.value;

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

        var self = this;

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

        if (self.featureSet === 'metric') {
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
        self.color.domain(d3.keys(data[0]).filter(function(key) {
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
            d.stackedBarPrep = self.color.domain().map(function(name) {
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

        self.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        // IMPORTANT: see data.forEach above to make sure total is properly
        // calculated if additional data paramas are introduced to this viz
        self.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        // add x axis
        self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.mh + ")")
            .call(self.xAxis);

        // add y axis
        self.chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // add primary svg g layer
        self.event = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + self.x(d.eventTime) + ",0)";
            });

        // add svg g layer for solid lines
        self.solidLineCanvas = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        // add svg g layer for dashed lines
        self.dashedLineCanvas = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        // add svg g layer for hidden rects
        self.hiddenBarsCanvas = self.chart.selectAll(".hidden")
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
        self.chart.call(tip);

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
        self.event.selectAll("rect")
            .data(function(d) {
                return d.stackedBarPrep;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                var segmentWidth = (self.mw / data.length);

                // spacing corrected for proportional
                // gaps between rects
                return segmentWidth - segmentWidth * 0.07;
            })
            .attr("y", function(d) {
                return self.y(d.y1);
            })
            .attr("height", function(d) {
                return self.y(d.y0) - self.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return self.color(d.name);
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
                return self.color(d.name);
            });

        // append hidden bars
        self.hiddenBarsCanvas.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("width", function(d) {
                var hiddenBarWidth = (self.mw / data.length);
                return hiddenBarWidth - hiddenBarWidth * 0.07;
            })
            .attr("opacity", "0")
            .attr("x", function(d) {
                return self.x(d.eventTime);
            })
            .attr("y", 0)
            .attr("height", function(d) {
                return self.mh;
            }).on('mouseenter', function(d) {

                // coax the pointer to line up with the bar center
                var nudge = (self.mw / data.length) * 0.5;
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
                    return self.x(d.eventTime);
                })
                .y(function(d) {
                    return self.y(d[param]);
                });
        };

        // abstracts the path generator to accept a data param
        // and creates a solid line with the appropriate color
        var solidPathGenerator = function(param) {
            return self.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return self.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        };

        // abstracts the path generator to accept a data param
        // and creates a dashed line with the appropriate color
        var dashedPathGenerator = function(param) {
            return self.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return self.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke-dasharray", "5, 2");
        };

        // lineFunction must be a named local
        // variable as it will be called by
        // the pathGenerator function that immediately follows
        var lineFunction;
        if (self.featureSet === 'cpu') {

            // generate solid line for Virtual data points
            // uncomment if supplying virtual stat again
            // lineFunction = lineFunctionGenerator('Virtual');
            // solidPathGenerator('Virtual');

            // generate dashed line for Physical data points
            lineFunction = lineFunctionGenerator('Physical');
            dashedPathGenerator('Physical');

        } else if (self.featureSet === 'disk') {

            // generate solid line for Total data points
            lineFunction = lineFunctionGenerator('Total');
            solidPathGenerator('Total');
        } else if (self.featureSet === 'mem') {

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

        if (self.featureSet !== null) {
            this.appendLegend(legendSpecs[self.featureSet]);
        } else {
            this.appendLegend(legendSpecs.spawn);
        }
    },

    appendLegend: function(legendSpecs) {

        var self = this;

        // abstracts the appending of chart legends based on the
        // passed in array params [['Title', colorSetIndex],['Title', colorSetIndex'],...]


        _.each(legendSpecs, function(item) {
            self.chart.append('path')
                .attr('class', 'line')
                .attr('id', item[0])
                .attr('data-legend', item[0])
                .attr('data-legend-color', self.color.range()[item[1]]);
        });

        var legend = self.chart.append('g')
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

        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><%= this.chartTitle %>' +
        '<span class="title-extra"></span>' +
        '<span class="pull-right special-icon-post"></span>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '<span class="pull-right special-icon-pre"></span>' +
        '</h3></div>' +
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

var NodeReportPageView = GoldstoneBasePageView.extend({

    defaults: {},

    instanceSpecificInit: function() {
        // options.node_uuid passed in during View instantiation
        this.node_uuid = this.options.node_uuid;

        // invoke the 'superclass'
        NodeReportPageView.__super__.instanceSpecificInit.apply(this, arguments);

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
            this.logBrowserViz.trigger('lookbackSelectorChanged');
            this.logBrowserTable.trigger('lookbackSelectorChanged');

            // this.computeLookback();
            // this.logAnalysisView.trigger('lookbackSelectorChanged', [ns.start, ns.end]);
        }
    },

    computeLookback: function() {
        var ns = this.defaults;
        ns.end = +new Date();
        ns.start = ns.end - (ns.globalLookback * 60 * 1000);
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
        this.serviceStatusChart = new NodeServiceStatusCollection({
            nodeName: hostName
        });

        this.serviceStatusChartView = new NodeServiceStatusView({
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

        // this.logAnalysisView = new LogSearchPageView({
        //     collection: this.logAnalysisCollection,
        //     width: $('#logsReport').width(),
        //     height: 300,
        //     el: '#logsReport',
        //     featureSet: 'logEvents',
        //     chartTitle: 'Log Analysis',
        //     specificHost: this.node_uuid,
        //     urlRoot: "/logging/summarize/?"
        // });

        var self = this;
        this.logBrowserVizCollection = new LogBrowserCollection({
            urlBase: '/logging/summarize/',

            // specificHost applies to this chart when instantiated
            // on a node report page to scope it to that node
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.logBrowserVizCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'searchLogAnalysis',
            marginLeft: 60,
            urlRoot: "/logging/summarize/?",
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });

        this.logBrowserTableCollection = new LogBrowserTableCollection({
            skipFetch: true,
            specificHost: this.specificHost,
            urlBase: '/logging/search/',
            linkedCollection: this.logBrowserVizCollection
        });

        this.logBrowserTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.logBrowserTableCollection,
            el: '#log-viewer-table',
            infoIcon: 'fa-table',
            width: $('#log-viewer-table').width()
        });

        this.listenTo(this.logBrowserViz, 'chartUpdate', function() {
            self.logBrowserTableCollection.filter = self.logBrowserViz.filter;
            self.logBrowserTable.update();
        });

        // end of logs tab
        //----------------------------------

        this.viewsToStopListening = [this.serviceStatusChart, this.serviceStatusChartView, this.cpuUsageChart, this.cpuUsageView, this.memoryUsageChart, this.memoryUsageView, this.networkUsageChart, this.networkUsageView, this.reportsReportCollection, this.reportsReport, this.eventsReport, this.detailsReport, this.logBrowserVizCollection, this.logBrowserViz, this.logBrowserTableCollection, this.logBrowserTable];
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
        '<div class="col-md-12" id="logsReport">' +

        // LOGS REPORT TAB
        // divs for log viewer viz on top and dataTable below
        '<div class="row">' +
        '<div id="log-viewer-visualization" class="col-md-12"></div>' +
        '</div>' +
        '<div class="row">' +
        '<div id="log-viewer-table" class="col-md-12"></div>' +
        '</div>' +
        // end log viewer
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

var NodeServiceStatusView = GoldstoneBaseView.extend({

    defaults: {
        margin: {
            top: 30,
            right: 30,
            bottom: 60,
            left: 70
        }
    },

    instanceSpecificInit: function() {
        this.processOptions();
        // sets page-element listeners, and/or event-listeners
        this.processListeners();
        // creates the popular mw / mh calculations for the D3 rendering
        this.processMargins();
        // Appends this basic chart template, usually overwritten
        this.render();
        // appends spinner to el
        this.showSpinner();
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

    processMargins: function() {
        this.defaults.mw = this.defaults.width - this.defaults.margin.left - this.defaults.margin.right;
        this.defaults.mh = this.defaults.height - this.defaults.margin.top - this.defaults.margin.bottom;
    },

    dataErrorMessage: function(message, errorMessage) {
        NodeServiceStatusView.__super__.dataErrorMessage.apply(this, arguments);
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
 */

/*
compliance/defined_search/ results structure:

{
    "uuid": "4ed7499e-d0c6-4d0b-be67-0418cd4b5d60",
    "name": "failed authorization",
    "owner": "compliance",
    "description": "Defined Search",
    "query": "{ \"query\": { \"bool\": { \"must\": [ { \"match\": { \"component\": \"keystone\" } }, { \"match_phrase\": { \"openstack_message\": \"authorization failed\" } } ] } } }",
    "protected": true,
    "index_prefix": "logstash-*",
    "doc_type": "syslog",
    "timestamp_field": "@timestamp",
    "last_start": null,
    "last_end": null,
    "target_interval": 0,
    "created": null,
    "updated": null
}

instantiated on logSearchPageView as:

    this.predefinedSearchDropdown = new PredefinedSearchView({
        collection: new GoldstoneBaseCollection({
            skipFetch: true,
            urlBase: '',
            addRange: function() {
                return '?@timestamp__range={"gte":' + this.gte + ',"lte":' + this.epochNow + '}';
            },
            addInterval: function(interval) {
                return '&interval=' + interval + 's';
            },
        }),
        index_prefix: 'logstash-*',
        settings_redirect: '/#reports/logbrowser/search'

    });

    this.logBrowserViz.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

    also instantiated on eventsBrowserPageView and apiBrowserPageView

*/

PredefinedSearchView = GoldstoneBaseView.extend({

    // bootstrap classes for dropdown menu heading
    className: 'nav nav-pills predefined-search-container',

    instanceSpecificInit: function() {
        // index_prefix and settings_redirect defined on instantiation
        this.processOptions();
        this.render();

        // adds listeners to <li> elements inside dropdown container
        this.processListeners();
        this.getPredefinedSearches();
    },

    getPredefinedSearches: function() {
        var self = this;

        // fallbacks for incompatible API return, or failed ajax call
        var failAppend = [{
            uuid: null,
            name: goldstone.translate('No predefined searches.')
        }];
        var serverError = [{
            uuid: null,
            name: goldstone.translate('Server error.')
        }];

        $.get('/core/saved_search/?page_size=1000&index_prefix=' + this.index_prefix)
            .done(
                function(result) {
                    if (result.results && result.results.length) {
                        self.predefinedSearches = result.results;
                    } else {
                        self.predefinedSearches = failAppend;
                    }
                    self.renderUpdatedResultList();
                })
            .fail(function(result) {
                self.predefinedSearches = serverError;
                self.renderUpdatedResultList();
            });
    },

    populatePredefinedSearches: function(arr) {
        var result = '';

        // add 'none' as a method of returning to the default search
        result += '<li data-uuid="null">' + goldstone.translate("None (reset to default)") + '</li>';

        _.each(arr, function(item) {
            result += '<li data-uuid=' + item.uuid + '>' + goldstone.translate(item.name) + '</li>';
        });

        return result;
    },

    processListeners: function() {
        var self = this;

        // dropdown to reveal predefined search list
        this.$el.find('.dropdown-menu').on('click', 'li', function(item) {

            var clickedUuid = $(this).data('uuid');
            if (clickedUuid === null) {

                // append original name to predefined search dropdown title
                // calls function that will provide accurate translation
                // if in a different language environment
                $('#predefined-search-title').text(self.generateDropdownName());
            } else {

                // append search name to predefined search dropdown title
                $('#predefined-search-title').text($(this).text());
            }

            var constructedUrlForTable = '/core/saved_search/' + clickedUuid + '/results/';

            self.collection.urlBase = '/core/saved_search/' + clickedUuid + '/results/';
            self.collection.urlGenerator();
            var constructedUrlforViz = self.collection.url;
            self.fetchResults(constructedUrlforViz, constructedUrlForTable);
        });

    },

    fetchResults: function(vizUrl, tableUrl) {
        var self = this;
        $.get(vizUrl)
            .done(function(res) {
                self.trigger('clickedUuidViz', [res, vizUrl]);
            })
            .fail(function(err) {
                console.error(err);
            });

        $.get(tableUrl)
            .done(function(res) {
                self.trigger('clickedUuidTable', [res, tableUrl]);
            })
            .fail(function(err) {
                console.error(err);
            });
    },

    generateDropdownName: function() {

        // enclosing in a function to handle the i18n compliant
        // generation of the original dropdown name when resetting
        // to the default search
        return goldstone.translate("Predefined Searches");
    },

    template: _.template('' +
        '<li role="presentation" class="dropdown">' +
        '<a class = "droptown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">' +
        '<span id="predefined-search-title"><%= this.generateDropdownName() %></span> <span class="caret"></span>' +
        '</a>' +
        '<ul class="dropdown-menu">' +
        // populated via renderUpdatedResultList()
        '</ul>' +
        '</li>' +
        '<a href=<%= this.settings_redirect %>><i class="setting-btn">&nbsp</i></a>'
    ),

    updatedResultList: _.template('<%= this.populatePredefinedSearches(this.predefinedSearches) %>'),

    render: function() {
        $(this.el).html(this.template());
        return this;
    },

    renderUpdatedResultList: function() {
        this.$el.find('.dropdown-menu').html(this.updatedResultList());
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

    urlGen: function(report) {

        // request page_size=1 in order to only
        // retrieve the latest result

        var urlRouteConstruction = '/core/reports/?name=' +
            report + '&page_size=1&node=' +
            this.defaults.hostName;
        return urlRouteConstruction;
    },

    instanceSpecificInit: function(options) {

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
 */

/*
implemented on SavedSearchLogPageView as:

    this.savedSearchLogCollection = new GoldstoneBaseCollection({
            skipFetch: true
        });
        this.savedSearchLogCollection.urlBase = "/core/saved_search/";

        this.savedSearchLogView = new savedSearchDataTableView({
            chartTitle: goldstone.translate('Saved Searches: Log Browser'),
            collectionMixin: this.savedSearchLogCollection,
            el: "#saved-search-viz",
            infoIcon: 'fa-table',
            width: $('#saved-search-viz').width()
        });

*/

SavedSearchDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        SavedSearchDataTableView.__super__.instanceSpecificInit.apply(this, arguments);

        // initialize with serverSide dataTable defined on DataTableBaseView
        this.drawSearchTableServerSide('#reports-result-table');
    },

    // form_index_prefix: 'logstash-*',
    // form_doc_type: 'syslog',
    // form_timestamp_field: '@timestamp',
    // urlRoot: '/core/saved_search/',
    // iDisplayLengthOverride: 25,

    render: function() {
        this.$el.html(this.template());
        $(this.el).find('.refreshed-report-container').append(this.dataTableTemplate());

        // append modals for new search / update search / delete search
        $('#create-modal-container').append(this.createModal());
        $('#update-modal-container').append(this.updateModal());
        $('#delete-modal-container').append(this.deleteModal());

        // add event/click handlers to add/update/delete
        this.createModalHandlers();
        this.updateModalHandlers();
        this.deleteModalHandlers();

        return this;
    },

    createModalHandlers: function() {
        var self = this;

        // add /user/'s uuid to hidden form field to be submitted as
        // owner of search
        var populateOwnerUuid = function() {
            $.ajax({
                type: 'GET',
                url: '/user/'
            })
                .done(function(res) {
                    $('.create-form #owner').val(res.uuid);
                })
                .fail(function(err) {
                    goldstone.raiseInfo(err);
                });
        };

        // click listener on add trail plus button to reset modal form
        $('.add-button').on('click', function() {
            $('.create-form')[0].reset();
            populateOwnerUuid();
        });

        // if cancelling add trail dialog, just close modal
        $('#cancel-create-button').on('click', function() {
            $('#create-modal').modal('hide');
        });

        // when submitting data in modal form for add swift trail
        $('.create-form').on('submit', function(e) {
            e.preventDefault();
            var data = $('.create-form').serialize();
            self.createNewSearchAjax(data);
        });

    },

    createNewSearchAjax: function(data) {
        var self = this;

        $.ajax({
            type: "POST",
            url: self.urlRoot,
            data: data
        })
            .done(function() {

                var updateMessage = goldstone.contextTranslate('Creation of %s successful', 'savedsearch');
                var successMessage = goldstone.sprintf(updateMessage, $('.create-form #new-search-name').val());

                // show success message at top of screen
                // uses sprintf string interpolation to create a properly
                // formatted message such as "Creation of trail1 successful"
                goldstone.raiseInfo(successMessage);

            })
            .fail(function(err) {
                var failMessage = goldstone.contextTranslate('Failure to create %s', 'savedsearch');
                var failureWarning = goldstone.sprintf(failMessage, $('.create-form #new-search-name').val());

                // show failure message at top of screen
                // uses sprintf string interpolation to create a properly
                // formatted message such as "Failure to create trail1"
                self.dataErrorMessage(err.responseJSON ? err.responseJSON : failureWarning);

            }).always(function() {
                // close modal
                $('#create-modal').modal('hide');
                // reload table
                self.oTable.ajax.reload();
            });
    },

    updateModalHandlers: function() {
        var self = this;

        // if cancelling update trail dialog, just close modal
        $('#cancel-submit-update-search').on('click', function() {
            $('#update-modal').modal('hide');
        });

        // when submitting data in modal form for updating trail
        $('.update-form').on('submit', function(e) {
            e.preventDefault();

            var data = $('.update-form').serialize();


            $.ajax({
                type: "PATCH",
                url: self.urlRoot + $('#updateUUID').val() + "/",
                data: data
            })
                .done(function() {

                    var updateMessage = goldstone.contextTranslate('Update of %s successful', 'savedsearch');
                    var successMessage = goldstone.sprintf(updateMessage, $('.update-search-form #updateTrailName').val());

                    // success message
                    // uses sprintf string interpolation to create a properly
                    // formatted message such as "Update of trail1 successful"
                    goldstone.raiseInfo(successMessage);

                })
                .fail(function(err) {

                    var failedTrailName = goldstone.contextTranslate('Failure to update %s', 'savedsearch');
                    var failureWarning = goldstone.sprintf(failedTrailName, $('.update-form #updateTrailName').val());

                    // failure message
                    // uses sprintf string interpolation to create a properly
                    // formatted message such as "Failure to update trail1"
                    self.dataErrorMessage(err.responseJSON ? err.responseJSON : failureWarning);

                }).always(function() {
                    // close modal and reload list
                    $('#update-modal').modal('hide');
                    self.oTable.ajax.reload();
                });
        });
    },

    deleteModalHandlers: function() {
        var self = this;

        // if cancelling delete trail dialogue, just close modal
        $('#cancel-delete-search').on('click', function() {
            $('#delete-modal').modal('hide');
        });

        // when submitting data in modal for delete trail
        $('#confirm-delete').on('click', function(e) {
            e.preventDefault();

            var serializedData = $('.delete-form').serialize();

            $.ajax({
                type: "DELETE",
                url: self.urlRoot + $('.delete-form').find('#deleteUUID').val() + "/"
            })
                .done(function() {

                    var deletedTrailName = goldstone.contextTranslate('Deletion of %s complete', 'savedsearch');
                    var deleteSuccess = goldstone.sprintf(deletedTrailName, $('.delete-form #deleteName').val());

                    // success message
                    // uses sprintf string interpolation to create a properly
                    // formatted message such as "Deletion of trail1 complete"
                    goldstone.raiseInfo(deleteSuccess);

                })
                .fail(function(err) {

                    var deletedTrailName = goldstone.contextTranslate('Failure to delete %s', 'savedsearch');
                    var deleteFailure = goldstone.sprintf(deletedTrailName, $('.delete-form #deleteName').val());

                    // failure message
                    self.dataErrorMessage(err.responseJSON ? err.responseJSON : deleteFailure);

                })
                .always(function() {
                    // close modal and reload list
                    $('#delete-modal').modal('hide');
                    self.oTable.ajax.reload();
                });

        });

    },

    update: function() {

        /*
        update is inactive unless set up with triggers on
        OpenTrailManagerPageView. The usual implementation is to trigger
        update upon reaching a refresh interval, if that becomes implemented.
        */

        var oTable;

        if ($.fn.dataTable.isDataTable("#reports-result-table")) {
            oTable = $("#reports-result-table").DataTable();
            oTable.ajax.reload();
        }
    },

    dataTableRowGenerationHooks: function(row, data) {

        var self = this;

        /*
        these hooks are activated once per row when rendering the dataTable.
        each hook has access to the row, and the data specific to that row
        */

        // depending on logging status, grey out row
        $(row).addClass(data.protected === true ? 'paused' : null);

        // set click listeners on row symbols

        $(row).on('click', '.fa-trash-o', function() {

            var deleteWarningText = goldstone.contextTranslate('"%s" will be permanently deleted. Are you sure?', 'savedsearch');
            var deleteWarningMessage = goldstone.sprintf(deleteWarningText, data.name);

            // delete trail modal - pass in row data details
            // uses sprintf string interpolation to create a properly
            // formatted message such as "Trail1 will be permanently deleted."
            $('#delete-modal #delete-name-span').text(deleteWarningMessage);

            // fill in hidden fields for Name and UUID to be
            // submitted via API call as form data
            $('#delete-modal #deleteName').val(data.name);
            $('#delete-modal #deleteUUID').val(data.uuid);
        });

        $(row).on('click', '.fa-gear', function() {

            // clear modal
            $('.update-form')[0].reset();

            // update trail modal - pass in row data details
            // name / isLogging/UUID
            $('#update-modal #update-search-name').val(data.name);
            $('#update-modal #update-search-description').val(data.description);
            $('#update-modal #update-search-query').val('' + data.query);
            $('#update-modal #updateUUID').val('' + data.uuid);

            // shut off input on protected searches
            if (data.protected === true) {
                $('#update-modal #update-search-name').attr('disabled', true);
                $('#update-modal #update-search-query').attr('disabled', true);
            } else {

                // must disable when clicking non-protected or else it will
                // persist after viewing a persisted search
                $('#update-modal #update-search-name').attr('disabled', false);
                $('#update-modal #update-search-query').attr('disabled', false);
            }
        });
    },

    // function to add additional initialization paramaters, as dataTables
    // options can't be changed post-init without the destroy() method.
    addOTableParams: function(options) {
        var self = this;
        options.createdRow = function(row, data) {
            self.dataTableRowGenerationHooks(row, data);
        };

        return options;
    },

    oTableParamGeneratorBase: function() {
        var self = this;
        return {
            "scrollX": "100%",
            "processing": false,
            "lengthChange": true,
            "iDisplayLength": self.iDisplayLengthOverride ? self.iDisplayLengthOverride : 10,
            "paging": true,
            "searching": true,
            "ordering": true,
            "order": [
                [0, 'desc']
            ],
            "columnDefs": [{
                    "data": "name",
                    "targets": 0,
                    "sortable": true
                }, {
                    "data": "description",
                    "targets": 1,
                    "sortable": true
                }, {
                    "targets": 2,
                    "data": null,

                    // add icons to dataTable cell
                    "render": function(data) {
                        if (data.protected === true) {
                            return "<i class='fa fa-gear fa-2x fa-fw' data-toggle='modal' data-target='#update-modal'></i> " +
                                "<div class='saved-search-no-delete'>system search - can not delete</div>";
                        } else {
                            return "<i class='fa fa-gear fa-2x fa-fw' data-toggle='modal' data-target='#update-modal'></i> " +
                                "<i class='fa fa-trash-o fa-2x fa-fw text-danger' data-toggle='modal' data-target='#delete-modal'></i>";
                        }
                    },
                    "sortable": false
                }, {
                    "data": "uuid",
                    "visible": false
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
                    settings.url = self.collectionMixin.url + "?page_size=" + pageSize +
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
                            0: 'name',
                            1: 'description'
                        };

                        var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

                        var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

                        var ascDec;
                        if (orderByDirection === 'asc') {
                            ascDec = '';
                        } else {
                            ascDec = '-';
                        }

                        // uncomment if sorting is in place
                        settings.url = settings.url + "&ordering=" +
                            ascDec + columnLabelHash[orderByColumn];
                    }


                    // add filter for log/event/api
                    settings.url += self.finalUrlMods();

                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = self.serverSideDataPrep(data);
                    return data;
                }
            }
        };
    },

    finalUrlMods: function() {
        return '&index_prefix=' + this.form_index_prefix;
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
        '<th>Name</th>' +
        '<th>Description</th>' +
        '<th>Controls</th>' +
        '</tr>'
    ),

    createModal: _.template("" +
        '<div class="modal fade" id="create-modal" tabindex="-1" role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Create New Search\', \'savedsearch\')%></h4>' +
        '</div>' +

        '<div class="modal-body">' +

        '<form class="create-form">' +

        // Search name
        '<div class="form-group">' +
        '<label for="new-search-name"><%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%></label>' +
        '<input name="name" type="text" class="form-control"' +
        'id="new-search-name" placeholder="<%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%>" required>' +
        '</div>' +

        // Search Description
        '<div class="form-group">' +
        '<label for="new-search-description"><%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%></label>' +
        '<input name="description" type="text" class="form-control"' +
        'id="new-search-description" placeholder="<%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%>">' +
        '</div>' +

        // Search Query
        '<div class="form-group">' +
        '<label for="new-search-query"><%=goldstone.contextTranslate(\'Search Query\', \'savedsearch\')%></label>' +
        '<textarea cols="40" rows="20" name="query" type="text" class="form-control"' +
        'id="new-search-query" placeholder="<%=goldstone.contextTranslate(\'ElasticSearch Query (omit surrounding quotes)\', \'savedsearch\')%>" required></textarea>' +
        '</div>' +

        // hidden owner
        // populate with uuid via call to /user/
        '<input name="owner" id="owner" hidden type="text">' +

        // hidden index_prefix
        '<input name="index_prefix" id="index_prefix" hidden type="text" value="<%= this.form_index_prefix  %>">' +

        // hidden doc_type
        '<input name="doc_type" id="doc_type" hidden type="text" value="<%= this.form_doc_type %>">' +

        // hidden timestamp_field
        '<input name="timestamp_field" id="timestamp_field" hidden type="text" value="<%= this.form_timestamp_field %>">' +

        // submit button
        '<button id="submit-create-button" type="submit"' +
        ' class="btn btn-default"><%=goldstone.contextTranslate(\'Submit Search\', \'savedsearch\')%></button> ' +

        // cancel button
        '<button id="cancel-create-button" type="button"' +
        ' class="btn btn-danger"><%=goldstone.contextTranslate(\'Cancel\', \'savedsearch\')%></button>' +

        '</form>' +

        '</div>' + // modal body

        '</div>' + // modal content
        '</div>' + // modal dialogue
        '</div>' // modal container
    ),

    updateModal: _.template("" +
        '<div class="modal fade" id="update-modal" tabindex="-1" ' +
        'role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" ' +
        'aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Update Search Details\', \'savedsearch\')%></h4>' +
        '</div>' +

        '<div class="modal-body">' +

        '<form class="update-form">' +

        // Search name
        '<div class="form-group">' +
        '<label for="update-search-name"><%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%></label>' +
        '<input name="name" type="text" class="form-control"' +
        'id="update-search-name" placeholder="<%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%>" required>' +
        '</div>' +

        // Search description
        '<div class="form-group">' +
        '<label for="update-search-description"><%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%></label>' +
        '<input name="description" type="text" class="form-control"' +
        'id="update-search-description" placeholder="<%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%>">' +
        '</div>' +

        // Search query
        '<div class="form-group">' +
        '<label for="update-search-query"><%=goldstone.contextTranslate(\'Search Query\', \'savedsearch\')%></label>' +
        '<textarea cols="40" rows="20" name="query" type="text" class="form-control"' +
        'id="update-search-query" placeholder="<%=goldstone.contextTranslate(\'Search Query (omit surrounding quotes)\', \'savedsearch\')%>" required></textarea>' +
        '</div>' +

        // hidden UUID
        '<input name="uuid" id="updateUUID" hidden type="text">' +

        // ui submit / cancel button
        '<button id="submit-update-search" type="submit" class="btn btn-default"><%=goldstone.contextTranslate(\'Submit\', \'savedsearch\')%></button>' +
        ' <button id="cancel-submit-update-search" type="button" class="btn btn-danger"><%=goldstone.contextTranslate(\'Cancel\', \'savedsearch\')%></button><br><br>' +

        '</form>' +

        '</div>' + // modal body

        '</div>' + // modal content
        '</div>' + // modal dialogue
        '</div>' // modal container
    ),

    deleteModal: _.template("" +
        '<div class="modal fade" id="delete-modal" tabindex="-1" role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Delete Search Confirmation\', \'savedsearch\')%></h4>' +
        '</div>' +

        '<div class="modal-body">' +

        '<form class="delete-form">' +

        // hidden UUID to be submitted with delete request
        '<input id="deleteUUID" hidden type="text">' +

        // hidden name to be submitted with delete request
        '<input id="deleteName" hidden type="text">' +

        // <h4> will be filled in by handler in dataTableRowGenerationHooks with
        // warning prior to deleting a trail
        '<h4><span id="delete-name-span"></span></h4>' +

        '<button id="confirm-delete" type="button" class="btn btn-danger"><%=goldstone.contextTranslate(\'Confirm\', \'savedsearch\')%></button>' +
        ' <button id="cancel-delete-search" type="button" class="btn btn-info"><%=goldstone.translate(\'Cancel\')%></button>' +
        '</form>' +
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
 */

/*
    called via goldstoneRouter.js as one of three 'flavors'
    via `this.featureSet` = (api|event|log)
*/

SavedSearchPageView = GoldstoneBasePageView.extend({

    featureSetAttributes: {
        'api': {
            chartTitle: 'Saved Searches: API Browser',
            form_index_prefix: 'api_stats-*',
            form_timestamp_field: '@timestamp',
            templateButtonSelectors: [
                ['/#reports/logbrowser/search', 'Saved Search: Log'],
                ['/#reports/eventbrowser/search', 'Saved Search: Event'],
                ['/#reports/apibrowser/search', 'Saved Search: API', 'active']
            ]
        },
        'event': {
            chartTitle: 'Saved Searches: Event Browser',
            form_index_prefix: 'events_*',
            form_timestamp_field: 'timestamp',
            templateButtonSelectors: [
                ['/#reports/logbrowser/search', 'Saved Search: Log'],
                ['/#reports/eventbrowser/search', 'Saved Search: Event', 'active'],
                ['/#reports/apibrowser/search', 'Saved Search: API']
            ]
        },
        'log': {
            chartTitle: 'Saved Searches: Log Browser',
            form_index_prefix: 'logstash-*',
            form_timestamp_field: '@timestamp',
            templateButtonSelectors: [
                ['/#reports/logbrowser/search', 'Saved Search: Log', 'active'],
                ['/#reports/eventbrowser/search', 'Saved Search: Event'],
                ['/#reports/apibrowser/search', 'Saved Search: API']
            ]
        }
    },

    renderCharts: function() {

        var fsa = this.featureSetAttributes;
        var fs = this.featureSet;
        var urlBase = '/core/saved_search/';

        $("select#global-lookback-range").hide();

        this.savedSearchLogCollection = new GoldstoneBaseCollection({
            skipFetch: true,
        });
        this.savedSearchLogCollection.urlBase = urlBase;
        this.savedSearchLogView = new SavedSearchDataTableView({
            chartTitle: goldstone.translate(fsa[fs].chartTitle),
            collectionMixin: this.savedSearchLogCollection,
            el: "#saved-search-viz",
            form_index_prefix: fsa[fs].form_index_prefix,
            form_doc_type: 'syslog',
            form_timestamp_field: fsa[fs].form_timestamp_field,
            urlRoot: urlBase,
            iDisplayLengthOverride: 25,
            width: $('#saved-search-viz').width()
        });

        this.viewToStopListening = [this.savedSearchLogCollection, this.savedSearchLogView];
    },

    triggerChange: function(change) {
        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.savedSearchLogView.trigger('lookbackSelectorChanged');
        }
    },

    onClose: function() {

        // return global lookback/refresh selectors to page
        $("select#global-lookback-range").show();
        $("select#global-refresh-range").show();
        SavedSearchPageView.__super__.onClose.apply(this, arguments);
    },

    templateButtonSelectors: function() {

        // this.processOptions hasn't happened yet
        // on base class, so "this.options" is required
        // prior to selecting 'featureSet' as
        // an attribute when invoked in 'template'.
        return this.featureSetAttributes[this.options.featureSet].templateButtonSelectors;
    },

    template: _.template('' +

        // tabbed nav selectors
        // references this.templateButtonSelectors
        '<%=  this.templateButtonConstructor(this.templateButtonSelectors()) %>' +
        // end tabbed nav selectors

        '<h3><%=goldstone.translate(\'Saved Search Manager\')%></h3>' +
        '<i class="fa fa-plus-square fa-3x add-button" data-toggle="modal" data-target="#create-modal"></i><br><br>' +
        '<div class="row">' +
        '<div id="saved-search-viz" class="col-md-12"></div>' +
        '</div>' +
        '<div id="create-modal-container"></div>' +
        '<div id="update-modal-container"></div>' +
        '<div id="delete-modal-container"></div>'
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

// this chart provides the base methods that
// are extended into almost all other Views

var ServiceStatusView = GoldstoneBaseView.extend({

    setModel: function() {
        this.model = new Backbone.Model({
            'cinder': 'unknown',
            'glance': 'unknown',
            'keystone': 'unknown',
            'neutron': 'unknown',
            'nova': 'unknown',
        });
    },

    instanceSpecificInit: function() {
        // processes the hash of options passed in when object is instantiated
        this.setModel();
        this.processOptions();
        this.processListeners();
        this.render();
        this.appendChartHeading();
        this.addModalAndHeadingIcons();
        this.setSpinner();
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

        this.listenTo(this.model, 'change', function() {
            this.updateChart();
        });
    },

    convertStatus: function(value) {
        /*
        online = green
        offline = red
        intermittent = orange
        unknown = grey
        */

        // screen out non-numbers
        if (+value !== value) {
            return 'unknown';
        }
        if (value > 0) {
            return 'online';
        } else {
            return 'offline';
        }
    },

    update: function() {
        var self = this;

        // grab data from collection
        var data = this.collection.toJSON();
        this.hideSpinner();

        // append 'no data returned if so'
        // or else hide spinner
        this.checkReturnedDataSet(data);

        // otherwise extract statuses from buckets
        data = data[0].aggregations.per_component.buckets;

        /*
        {
            doc_count: 75
            key: "neutron"
        }
        */

        // set model attributes based on hash of statuses
        _.each(data, function(bucket) {
            var value = self.convertStatus(bucket.doc_count);
            self.model.set(bucket.key, value);
        });

    },

    render: function() {
        $(this.el).html(this.template());
        $(this.el).find('.fill-in').html(this.statusTemplate());
        return this;
    },

    updateChart: function() {
        $(this.el).find('.fill-in').html(this.statusTemplate());
    },

    statusTemplate: _.template('' +
        '<li>' +
        '<span class="service"><%= goldstone.translate("Cinder") %></span>' +
        '<span class="sf"><i class=<%= this.model.get("cinder") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service"><%= goldstone.translate("Glance") %></span>' +
        '<span class="sf"><i class=<%= this.model.get("glance") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service"><%= goldstone.translate("Keystone") %></span>' +
        '<span class="sf"><i class=<%= this.model.get("keystone") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service"><%= goldstone.translate("Neutron") %></span>' +
        '<span class="sf"><i class=<%= this.model.get("neutron") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service"><%= goldstone.translate("Nova") %></span>' +
        '<span class="sf"><i class=<%= this.model.get("nova") %>>&nbsp;</i></span>' +
        '</li>'),

        template: _.template('' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<ul class="service-status-table shadow-block">' +
        '<li class="table-header">' +
        '<span class="service"><%= goldstone.translate("Service") %></span>' +
        '<span class="sf"><%= goldstone.translate("Status") %></span>' +
        '</li>' +
        '<div class="fill-in"></div>' +
        '</ul>')

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

var SettingsPageView = GoldstoneBaseView.extend({

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

        // commented out pending definition of themes.
        // dark/light theme selector

        // '<div class="col-md-2">' +
        // '<h5><%=goldstone.translate("Theme Settings")%></h5>' +
        // '<form class="theme-selector" role="form">' +
        // '<div class="form-group">' +
        // '<div class="col-xl-5">' +
        // '<div class="input-group">' +
        // '<select class="form-control" id="theme-name">' +
        // '<option value="light"><%=goldstone.contextTranslate(\'Light\', \'settingspage\')%></option>' +
        // '<option value="dark"><%=goldstone.contextTranslate(\'Dark\', \'settingspage\')%></option>' +
        // '</select>' +
        // '</div>' +
        // '</div>' +
        // '</div>' +
        // '</form>' +
        // '</div>' +

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
        '<div class="alert alert-info popup-message" hidden="true"></div>' +
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
    urlBase: '/nova/hypervisor/spawns/'
});

this.vmSpawnChartView = new SpawnsView({
    chartTitle: goldstone.translate("VM Spawns"),
    collection: this.vmSpawnChart,
    height: 350,
    infoText: 'novaSpawns',
    el: '#nova-report-r1-c2',
    width: $('#nova-report-r1-c2').width(),
    yAxisLabel: goldstone.translate('Spawn Events')
});
*/

var SpawnsView = GoldstoneBaseView.extend({

    margin: {
        top: 55,
        right: 70,
        bottom: 100,
        left: 70
    },

    instanceSpecificInit: function() {

        SpawnsView.__super__.instanceSpecificInit.apply(this, arguments);

        // basic assignment of variables to be used in chart rendering
        this.standardInit();
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var self = this;

        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;

        self.svg = d3.select(this.el).select('.panel-body').append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        self.chart = self.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        // initialized the axes
        self.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (self.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(self.yAxisLabel)
            .style("text-anchor", "middle");

        self.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        self.x = d3.time.scale()
            .rangeRound([0, self.mw]);

        self.y = d3.scale.linear()
            .range([self.mh, 0]);

        self.xAxis = d3.svg.axis()
            .scale(self.x)
            .ticks(5)
            .orient("bottom");

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        self.colorArray = new GoldstoneColors().get('colorSets');

        self.color = d3.scale.ordinal()
            .range(self.colorArray.distinct['2R']);
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
        this.color.domain(d3.keys(data[0]).filter(function(key) {
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
            d.stackedBarPrep = self.color.domain().map(function(name) {
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

        this.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        // IMPORTANT: see data.forEach above to make sure total is properly
        // calculated if additional data paramas are introduced to this viz
        this.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        // add x axis
        this.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.mh + ")")
            .call(self.xAxis);

        // add y axis
        this.chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // add primary svg g layer
        this.event = this.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + self.x(d.eventTime) + ",0)";
            });

        // add svg g layer for solid lines
        this.solidLineCanvas = self.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "solid-line-canvas");

        // add svg g layer for dashed lines
        this.dashedLineCanvas = this.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("class", "dashed-line-canvas");

        // add svg g layer for hidden rects
        this.hiddenBarsCanvas = this.chart.selectAll(".hidden")
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
        this.chart.call(tip);

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
        this.event.selectAll("rect")
            .data(function(d) {
                return d.stackedBarPrep;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                var segmentWidth = (self.mw / data.length);

                // spacing corrected for proportional
                // gaps between rects
                return segmentWidth - segmentWidth * 0.07;
            })
            .attr("y", function(d) {
                return self.y(d.y1);
            })
            .attr("height", function(d) {
                return self.y(d.y0) - self.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return self.color(d.name);
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
                return self.color(d.name);
            });

        // append hidden bars
        this.hiddenBarsCanvas.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("width", function(d) {
                var hiddenBarWidth = (self.mw / data.length);
                return hiddenBarWidth - hiddenBarWidth * 0.07;
            })
            .attr("opacity", "0")
            .attr("x", function(d) {
                return self.x(d.eventTime);
            })
            .attr("y", 0)
            .attr("height", function(d) {
                return self.mh;
            }).on('mouseenter', function(d) {

                // coax the pointer to line up with the bar center
                var nudge = (self.mw / data.length) * 0.5;
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
                    return self.x(d.eventTime);
                })
                .y(function(d) {
                    return self.y(d[param]);
                });
        };

        // abstracts the path generator to accept a data param
        // and creates a solid line with the appropriate color
        var solidPathGenerator = function(param) {
            return self.solidLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return self.color(param);
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        };

        // abstracts the path generator to accept a data param
        // and creates a dashed line with the appropriate color
        var dashedPathGenerator = function(param) {
            return self.dashedLineCanvas.append("path")
                .attr("d", lineFunction(data))
                .attr("stroke", function() {
                    return self.color(param);
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

        var self = this;

        _.each(legendSpecs, function(item) {
            self.chart.append('path')
                .attr('class', 'line')
                .attr('id', item[0])
                .attr('data-legend', item[0])
                .attr('data-legend-color', self.color.range()[item[1]]);
        });

        var legend = self.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20,-35)')
            .attr('opacity', 1.0)
            .call(d3.legend);
    },

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

var TenantSettingsPageView = GoldstoneBaseView.extend({

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
        '<div class="alert alert-info popup-message" hidden="true"></div>' +
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

var TopologyPageView = GoldstoneBasePageView.extend({

    // overwritten as there is not trigger functionality to topology
    triggerChange: function(change) {
        return true;
    },

    renderCharts: function() {

        //---------------------------
        // instantiate Cloud Topology chart

        this.discoverTreeCollection = new GoldstoneBaseCollection({
            urlBase: "/core/topology/"
        });

        this.topologyTreeView = new TopologyTreeView({
            blueSpinnerGif: blueSpinnerGif,
            collection: this.discoverTreeCollection,
            chartTitle: goldstone.translate('Cloud Topology'),
            el: '#goldstone-discover-r1-c1',
            height: 600,
            infoText: 'discoverCloudTopology',
            multiRsrcViewEl: '#goldstone-discover-r1-c2',
            width: $('#goldstone-discover-r1-c2').width(),
        });

    },

    template: _.template('' +
        '<div id="goldstone-discover-r1" class="row">' +
        '<div id="goldstone-discover-r1-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r1-c2" class="col-md-6"></div>' +
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
    multiRsrcViewEl: '#goldstone-discover-r2-c2',
    width: $('#goldstone-discover-r2-c1').width(),
});

*/


var TopologyTreeView = GoldstoneBaseView.extend({

    // this block is run upon instantiating the object
    // and called by 'initialize' on the parent object
    instanceSpecificInit: function() {
        TopologyTreeView.__super__.instanceSpecificInit.apply(this, arguments);
        this.initSvg();
        this.hideSpinner();
    },

    filterMultiRsrcData: function(data) {

        // this allows for passing in arrays of paramaters
        // to omit from the returned data before rendering
        // as a data table in 'resource list'

        var self = this;

        if (self.filterMultiRsrcDataOverride === null) {
            return data;
        } else {
            var newData = jQuery.extend(true, {}, data);
            newData = _.map(newData, function(item) {
                return _.omit(item, self.filterMultiRsrcDataOverride);
            });
            return newData;
        }

    },

    initSvg: function() {
        var self = this;

        self.margin = {
            top: 10,
            bottom: 45,
            right: 10,
            left: 35
        };
        self.mw = self.width - self.margin.left - self.margin.right;
        self.mh = self.height - self.margin.top - self.margin.bottom;
        self.svg = d3.select(self.el).select('.panel-body')
            .append("svg")
            .attr("width", self.width)
            .attr("height", self.height);
        self.tree = d3.layout.tree()
            .size([self.mh, self.mw])
            .separation(function(a, b) {
                var sep = a.parent === b.parent ? 3 : 2;
                return sep;
            });
        self.i = 0; // used in processTree for node id
        self.diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });
        self.chart = self.svg.append("g")
            .attr('class', 'chart')
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
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
    drawSingleRsrcInfoTable: function(json, click) {
        // make a dataTable
        var self = this;
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

        $(self.multiRsrcViewEl).find(".panel-heading").popover({
            trigger: "manual",
            placement: "left",
            html: true,
            title: '<div>Resource Info<button type="button" style="color:#000; opacity:1.0;" id="popover-close" class="close pull-right" data-dismiss="modal"' +
                'aria-hidden="true">&times;</button></div>',
            content: '<div id="single-rsrc-body" class="panel-body">' +
                '<table id="single-rsrc-table" class="table table-hover"></table>' +
                '</div>'
        });
        $(self.multiRsrcViewEl).find('.panel-heading').popover('show');

        // shift popover to the left
        $(self.multiRsrcViewEl).find('.popover').css('margin-left', '-172px');

        $('#popover-close').on("click", function() {
            $(self.multiRsrcViewEl).find(".panel-heading").popover("hide");
        });
        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "scrollY": "400px",
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

        $(self.multiRsrcViewEl).find('#spinner').show();

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
            self.clearDataErrorMessage(self.multiRsrcViewEl);

            // the response may have multiple lists of services for different
            // timestamps.  The first one will be the most recent.
            var firstTsData = payload[0] !== undefined ? payload[0] : [];
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
                    e.datatableRecId = goldstone.uuid();
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

                    $(self.multiRsrcViewEl).find(".mainContainer").html('<table id="multi-rsrc-table" class="table table-hover"><thead></thead><tbody></tbody></table>');
                    oTable = $(self.multiRsrcViewEl).find("#multi-rsrc-table").DataTable({
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
                                self.drawSingleRsrcInfoTable(data[0], $(this));
                            }
                        }
                    });
                }
            } else {
                goldstone.raiseAlert($(self.multiRsrcViewEl).find('.popup-message'), goldstone.translate('No data'));
            }

        }).fail(function(error) {

            // self.multiRscsView is defined in this.render
            if (self.multiRscsView !== undefined) {

                // there is a listener defined in the
                // multiRsrcView that will append the
                // error message to that div

                // trigger takes 2 args:
                // 1: 'triggerName'
                // 2: array of additional params to pass
                self.multiRscsView.trigger('errorTrigger', [error]);
            }

            // NOTE: if this view is instantiated in a case where there
            // is no multiRscsViewEl defined, there will be no
            // self.multiRscsView defined. In that case, error messages
            // will need to be appended to THIS view. So there will need
            // to be a fallback instantiation of this.dataErrorMessage that will render on THIS view.

        }).always(function() {

            // always remove the spinner after the API
            // call returns
            $(self.multiRsrcViewEl).find('#spinner').hide();
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
        location = location || $(this.multiRsrcViewEl).find('.title-extra');
        $(location).text(': ' + text);
    },

    processTree: function(json) {
        // not used in zoomablePartitionView
        // but must keep for old collapsable tree style viz

        var self = this;
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        var nodes = self.tree.nodes(self.data).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * 100;
        });

        // Update the nodes…
        var node = self.chart.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++self.i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", function(d) {
                if (d.children === null && d._children === undefined) {
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

                if (d.children === undefined && d._children === undefined && d.resource_list_url !== undefined) {
                    var url = d.resource_list_url;
                    if (url !== undefined) {

                        if (self.overrideSets[d.integration.toLowerCase()]) {
                            self.filterMultiRsrcDataOverride = self.overrideSets[d.integration.toLowerCase()];
                        } else {
                            self.filterMultiRsrcDataOverride = null;
                        }

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

                // append icon based on resourcetype, mapped to the d3.map
                return "icon main " + (d.resourcetype || "cloud") + "-icon";
            })
            .attr("transform", "scale(0.0000001)");

        // Map of icons to the classes in which they'll be used
        d3.map({
            icon_backup: ['backups', 'snapshots'],
            icon_cloud: ['cloud'],
            icon_endpoint: ['endpoints', 'internal', 'public', 'admin'],
            icon_host: ['host', 'hosts', 'hypervisors',
                'servers', 'nova', 'glance', 'neutron', 'keystone', 'cinder', 'region', 'regions'
            ],
            icon_image: ['images'],
            icon_module: ['module', 'secgroups', 'interfaces', 'add-ons'],
            icon_role: ['roles'],
            icon_service: ['service', 'services'],
            icon_tenant: ['tenants'],
            icon_types: ['types'],
            icon_user: ['users'],
            icon_volume: ['volume', 'volumes'],
            icon_vol_transfer: ['agents', 'transfers'],
            icon_zone: ['zone', 'aggregates', 'cloudpipes',
                'flavors', 'floating-ip-pools', 'networks', 'zones'
            ]

        }).forEach(function(icon, classes) {
            // Acutally attach the icons to the classes
            d3.xml(imgFile(icon), "image/svg+xml", function(img) {
                classes.forEach(function(c) {
                    self.chart.selectAll(".icon.main." + c + "-icon")
                        .each(function() {
                            d3.select(this).node().appendChild(
                                img.getElementsByTagName("svg")[0].cloneNode(true));
                        });
                });
            }); // d3.xml()
        }); // forEach

        function imgFile(icon) {
            return "/static/discover-tree-icons/" + icon + ".svg";
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
        var link = self.chart.selectAll("path.link")
            .data(self.tree.links(nodes), function(d) {
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
                return self.diagonal({
                    source: o,
                    target: o
                });
            })
            .transition()
            .duration(duration)
            .attr("d", self.diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", self.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: json.x,
                    y: json.y
                };
                return self.diagonal({
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
        var self = this;
        self.data = self.collection.toJSON();

        // append error message if no data returned
        this.checkReturnedDataSet(self.data);

        // convert after checking array length
        self.data = self.data[0];
        if (self.data !== undefined) {
            if (Object.keys(self.data).length === 0) {
                $(self.el).find('.panel-body').prepend("<p> Response was empty.");
            } else {
                self.data.x0 = self.height / 2;
                self.data.y0 = 0;
                self.processTree(self.data);

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
        }
    },

    render: function() {

        var self = this;

        // appends Resource List dataTable View if applicable
        if (self.multiRsrcViewEl !== null) {
            self.multiRscsView = new MultiRscsView({
                el: self.multiRsrcViewEl,
                chartTitle: goldstone.translate("Resource List"),
                height: self.height
            });

            var appendSpinnerLocation = $(self.multiRsrcViewEl);
            $('<img id="spinner" src="' + self.blueSpinnerGif + '">').load(function() {
                $(this).appendTo(appendSpinnerLocation).css({
                    'position': 'absolute',
                    'margin-left': (self.width / 2),
                    'margin-top': self.height / 2,
                    'display': 'none'
                });
            });

        }

        $(this.el).append(this.template());
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
        keystone: ['@timestamp', 'links'],
        glance: ['@timestamp',
            'metadata',
            'region',
            'tags',
            'checksum',
            'owner',
            'schema',
            'file'
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
