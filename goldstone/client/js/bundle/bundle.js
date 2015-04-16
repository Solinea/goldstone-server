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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

    $(selector).fadeIn("slow");

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
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            this.defaults.yAxisLabel = "Response Time (s)";
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

            if ($(this.el).find('#api-perf-info').length) {
                $(this.el).find('#api-perf-info').popover({
                    content: this.htmlGen.apply(this),
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
            this.dataErrorMessage('No Data Returned');
            return false;
        } else {
            this.clearDataErrorMessage();
        }
    },

    update: function() {},

    template: _.template(
        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="api-perf-info"></i>' +
        '</h3></div><div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

    defaults: {},

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
        this.listenTo(app.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(app.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
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
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        "api_perf/report": "apiPerfReport",
        "cinder/report": "cinderReport",
        "discover": "discover",
        "glance/report": "glanceReport",
        "help": "help",
        "intelligence/search": "logSearch",
        "keystone/report": "keystoneReport",
        "login": "login",
        "password": "password",
        "settings": "settings",
        "settings/tenants": "tenant",
        "neutron/report": "neutronReport",
        "nova/report": "novaReport",
        "report/node/:nodeId": "nodeReport",
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

        // prevent multiple successive calls to the same page
        if (app.switchTriggeredBy && app.switchTriggeredBy === view) {
            return;
        }
        app.switchTriggeredBy = view;

        if (app.currentLauncherView) {

            // app.currentView is instantiated below
            if (app.currentView.onClose) {

                // this is defined in goldstoneBaseView and
                // removes any setIntervals which would continue
                // to trigger events even after removing the view
                app.currentView.onClose();
            }

            // Backbone's remove() calls this.$el.remove() and
            // this.stopListening() which removes any events that
            // are subscribed to with listenTo()
            app.currentView.remove();
            app.currentLauncherView.remove();
        }

        // instantiate wrapper view that can be removed upon page
        // change and store the current launcher and view so it
        // can be remove()'d
        app.currentLauncherView = new LauncherView({});

        // append the launcher to the page div
        // .router-content-container is a div set in router.html
        $('.router-content-container').append(app.currentLauncherView.el);

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
        app.currentView = new view(options);

    },

    /*
    Define additional view launching functions below.
    Additional params that need to be passed to 'options' can
    be added as an object. The extra options will be extended


    */

    nodeReport: function(nodeId) {
        this.switchView(NodeReportView, {
            node_uuid: nodeId
        });
    },
    keystoneReport: function() {
        this.switchView(KeystoneReportView);
    },
    login: function() {
        this.switchView(LoginPageView);
    },
    password: function() {
        this.switchView(PasswordResetView);
    },
    settings: function() {
        this.switchView(SettingsPageView);
    },
    tenant: function() {
        this.switchView(TenantSettingsPageView);
    },
    apiPerfReport: function() {
        this.switchView(ApiPerfReportView);
    },
    novaReport: function() {
        this.switchView(NovaReportView);
    },
    neutronReport: function() {
        this.switchView(NeutronReportView);
    },
    cinderReport: function() {
        this.switchView(CinderReportView);
    },
    glanceReport: function() {
        this.switchView(GlanceReportView);
    },
    logSearch: function() {
        this.switchView(LogSearchView);
    },
    discover: function() {
        this.switchView(DiscoverView);
    },
    help: function() {
        this.switchView(HelpView);
    },
    redirect: function() {
        location.href = "#/discover";
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct[3]);
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
        allthelogs = this.collection.toJSON();

        var data = allthelogs;

        _.each(data, function(item) {
            item['@timestamp'] = moment(item['@timestamp']).valueOf();
        });

        var dataUniqTimes = _.uniq(_.map(data, function(item) {
            return item['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                wait: null,
                sys: null,
                user: null
            };
        });


        _.each(data, function(item) {

            var metric = item.name.slice(item.name.lastIndexOf('.') + 1);

            newData[item['@timestamp']][metric] = item.value;

        });


        finalData = [];

        _.each(newData, function(item, i) {
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
            ns.y.domain([0, ns.memTotal.value / ns.divisor]);
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

            })
            .style("opacity", function() {
                return ns.featureSet === "logEvents" ? 0.3 : 0.8;
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
                return;

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
                        return 'Total: ' + ((Math.round(ns.memTotal.value / ns.divisor * 100)) / 100) + 'GB';
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

*/

var GoldstoneColors = GoldstoneBaseModel.extend({
    defaults: {
        colorSets: {
            // distinct = colorBlindFriendly
            distinct: {
                1: ['#4477AA'],
                2: ['#4477AA', '#CC6677'],
                3: ['#4477AA', '#DDCC77', '#CC6677'],
                4: ['#4477AA', '#117733', '#DDCC77', '#CC6677'],
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

                // EMERGENCY: system is unusable
                // ALERT: action must be taken immediately
                // CRITICAL: critical conditions
                // ERROR: error conditions
                // WARNING: warning conditions
                // NOTICE: normal but significant condition
                // INFO: informational messages
                // DEBUG: debug-level messages

            },
            grey: {
                0: ['#bdbdbd']
            }
        }
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

            discoverCloudTopology: 'This is the OpenStack topology map.  You ' +
                'can use leaf nodes to navigate to specific types of resources.',

            discoverZoomTopology: 'This is the OpenStack topology map.  Clicking ' +
                'branches will zoom in, clicking on leaf nodes will bring up information about resources. Click on the far left section to zoom out.',

            eventTimeline: 'The event timeline displays key events that have occurred ' +
                'in your cloud.  You can adjust the displayed data with the filter and ' +
                'time settings in the menu bar.  Hovering on an event brings up the ' +
                'event detail.',

            nodeAvailability: 'The node presence chart keeps track of the last time each ' +
                'node in the cloud was seen.  Nodes on the right have been seen more recently ' +
                'than nodes on the left.  The center lane shows nodes that have been detected ' +
                'in the log stream.  The top lane shows nodes that are not logging, but can be ' +
                'pinged.',

            serviceStatus: 'The service status panel shows the last known state of all OS services ' +
                'on the node.',

            utilization: 'The utilization charts show the OS level utilization of the node.',

            hypervisor: 'The hypervisor charts show the last known allocation and usage of resources ' +
                'across all of the VMs on the node.',

            novaTopologyDiscover: 'This is the OpenStack Nova topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'such as hypervisors, clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            cinderTopologyDiscover: 'This is the OpenStack Cinder topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            glanceTopologyDiscover: 'This is the OpenStack Glance topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            keystoneTopologyDiscover: 'This is the OpenStack Keystone topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            novaSpawns: 'This chart displays VM spawn success and failure counts ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            novaCpuResources: 'This chart displays aggregate CPU core allocation ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            novaMemResources: 'This chart displays aggregate memory allocation ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            novaDiskResources: 'This chart displays aggregate disk allocation ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            searchLogAnalysis: 'This chart displays log stream data ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar, and with the filter settings that double ' +
                'as a legend.  The table below contains the individual log entries for ' +
                'the time range and filter settings.',

            cloudTopologyResourceList: 'Click row for additional resource info.<br><br>' +
            'Clicking on hypervisor or hosts reports will navigate to additional report pages.'
        }
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        this.url = '/api_perf/stats?@timestamp__range={"gte":' + ns.reportParams.start +
            '}&interval=' + ns.reportParams.interval +
            '&component=' + this.defaults.componentParam;

        // generates url string similar to:
        // /api_perf/stats?timestamp__range={%22gte%22:1428556490}&interval=60s&component=glance

    }
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
This collection is currently direclty implemented in the
Nova CPU Resources viz
JSON payload format:
{
    timestamp: [used, total_phys, total_virt],
    timestamp: [used, total_phys, total_virt],
    timestamp: [used, total_phys, total_virt],
    ...
}
*/

// define collection and link to model

var CpuResourceCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.results) {
            return data.results;
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
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {

        // a listener in the parent page container triggers an event picked up
        // by GoldstoneBaseView which adjusts ns.globalLookback to match
        // the number of minutes specified by the selector

        var ns = this.defaults;

        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        this.url = '/core/metrics?name__prefix=nova.hypervisor.vcpus&@timestamp__range={"gte":' +
            moment(ns.reportParams.start).valueOf() + '}';
    }

    // creates a url similar to:
    // /core/metrics?name__prefix=nova.hypervisor.vcpus&@timestamp__range={"gte":1426887188000}
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
This collection is currently direclty implemented in the
Nova Disk Resources viz
JSON payload format:
{
    timestamp: [used, total_mem],
    timestamp: [used, total_mem],
    timestamp: [used, total_mem],
    ...
}
*/


// define collection and link to model

var DiskResourceCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.results) {
            return data.results;
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
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {

        // a listener in the parent page container triggers an event picked up
        // by GoldstoneBaseView which adjusts ns.globalLookback to match
        // the number of minutes specified by the selector

        var ns = this.defaults;

        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        this.url = '/core/metrics?name__prefix=nova.hypervisor.local_gb&@timestamp__range={"gte":' +
            moment(ns.reportParams.start).valueOf() + '}';
    }

    // creates a url similar to:
    // /core/metrics?name__prefix=nova.hypervisor.local_gb&@timestamp__range={"gte":1429058361304}
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// define collection and link to model

var EventTimelineModel = GoldstoneBaseModel.extend({
    // sort by @timestamp. Used to be id, but that has been
    // removed as of v3 api.
    idAttribute: '@timestamp'
});

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        var nextUrl;

        // in the case that there are additional paged server responses
        if (data.next && data.next !== null) {
            var dN = data.next;

            // if url params change, be sure to update this:
            nextUrl = dN.slice(dN.indexOf('/logging'));

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
        // /logging/events?@timestamp__range={"gte":1426698303974}&page_size=1000"

        var lookback = +new Date() - (val * 60 * 1000);
        this.url = '/logging/events/search?@timestamp__range={"gte":' +
            lookback + '}&page_size=1000';

    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            "date": day,
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
                "VM4": 9.13,
            }, {
                "date": 1412818619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            }, {
                "date": 1412823619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            }, {
                "date": 1412828619263,
                "VM1": 41.62,
                "VM2": 22.36,
                "VM3": 25.58,
                "VM4": 9.13,
            },

        ]
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// define collection and link to model

/*
instantiated in logSearchView.js as:

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
                remove: false,
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
    },
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
This collection is currently direclty implemented in the
Nova Memory Resources viz
JSON payload format:
{
    timestamp: [used, total_phys, total_virt],
    timestamp: [used, total_phys, total_virt],
    timestamp: [used, total_phys, total_virt],
    ...
}
*/

// define collection and link to model

var MemResourceCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        if (data && data.results) {
            return data.results;
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
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {

        // a listener in the parent page container triggers an event picked up
        // by GoldstoneBaseView which adjusts ns.globalLookback to match
        // the number of minutes specified by the selector

        var ns = this.defaults;

        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        this.url = '/core/metrics?name__prefix=nova.hypervisor.mem&@timestamp__range={"gte":' +
            moment(ns.reportParams.start).valueOf() + '}';
    }

    // creates a url similar to:
    // /core/metrics?name__prefix=nova.hypervisor.mem&@timestamp__range={"gte":1426887188000}

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
Instantiated on discoverView as:
var nodeAvailChart = new NodeAvailCollection({
    url: "/logging/nodes?page_size=100"
});
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

        var lookbackSeconds = (this.computeLookback() * 60);

        // this is the url with the small interval to gather a more
        // accurate assessment of the time the node was last seen
        this.defaults.urlsToFetch[0] = '' +
            '/logging/summarize?timestamp__range={"gte":' +
            (+new Date() - (lookbackSeconds * 1000)) +
            '}&interval=' + (lookbackSeconds / 60) + 'm';

        // this is the url with the 1d lookback to bucket ALL
        // the values into a single return value per alert level.
        this.defaults.urlsToFetch[1] = '' +
            '/logging/summarize?timestamp__range={"gte":' +
            (+new Date() - (lookbackSeconds * 1000)) +
            '}&interval=1d';

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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

        this.url = "/core/report_names?node=" +
            this.defaults.nodeName +
            "&timestamp__range={'gte':" + (+new Date() - this.defaults.globalLookback * 1000 * 60) +
            "}";

        // /core/report_names?node=ctrl-01&timestamp__range={%27gte%27:1427189954471}

        this.fetch();
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

        this.url = "/core/reports?name__prefix=os.service&node__prefix=" +
            this.defaults.nodeName + "&page_size=300" +
            "&timestamp__range={'gte':" + twentyAgo +"}";

        // this.url similar to: /core/reports?name__prefix=os.service&node__prefix=rsrc-01&page_size=300&timestamp__gte=1423681500026

        this.fetch();
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
This collection is currently direclty implemented in the
Nova VM Spawns viz
JSON payload format:
{
    timestamp:[successes, fails],
    timestamp:[successes, fails],
    timestamp:[successes, fails],
    ...
}
*/

// define collection and link to model

var StackedBarChartCollection = Backbone.Collection.extend({

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
        this.url = ns.urlPrefix + '?@timestamp__range={"gte":' +
            ns.reportParams.start + '}&interval=' + ns.reportParams.interval;
    }

    // creates a url similar to:
    // /nova/hypervisor/spawns?@timestamp__range={"gte":1429027100000}&interval=1h

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// define collection and link to model

var UtilizationCpuCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        } else {
            this.defaults.urlCollectionCount--;
        }

        return data.results;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.fetchInProgress = false;
        this.defaults.nodeName = options.nodeName;
        this.defaults.urlPrefixes = ['sys', 'user', 'wait'];
        this.defaults.urlCollectionCountOrig = this.defaults.urlPrefixes.length;
        this.defaults.urlCollectionCount = this.defaults.urlPrefixes.length;
        this.defaults.globalLookback = options.globalLookback;
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        // grabs minutes from global selector option value
        var lookback = +new Date() - (1000 * 60 * this.defaults.globalLookback);

        _.each(self.defaults.urlPrefixes, function(prefix) {
            self.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.cpu." + prefix + "&node=" +
                self.defaults.nodeName + "&timestamp__range={'gte':" +
                lookback + "}&page_size=1000");
        });

        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: this.defaults.urlsToFetch[0],
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// define collection and link to model

var UtilizationMemCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null && data.next.indexOf('os.mem.total') === -1) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        } else {
            this.defaults.urlCollectionCount--;
        }

        return data.results;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.fetchInProgress = false;
        this.defaults.nodeName = options.nodeName;
        this.defaults.urlPrefixes = ['total', 'free'];
        this.defaults.urlCollectionCountOrig = this.defaults.urlPrefixes.length;
        this.defaults.urlCollectionCount = this.defaults.urlPrefixes.length;
        this.defaults.globalLookback = options.globalLookback;
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        // grabs minutes from global selector option value
        var lookback = +new Date() - (1000 * 60 * this.defaults.globalLookback);

        this.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.mem." + this.defaults.urlPrefixes[0] + "&node=" +
            this.defaults.nodeName + "&timestamp__range={'gte':" +
            lookback + "}&page_size=1");

        this.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.mem." + this.defaults.urlPrefixes[1] + "&node=" +
            this.defaults.nodeName + "&timestamp__range={'gte':" +
            lookback + "}&page_size=1000");

        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: this.defaults.urlsToFetch[0],
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// define collection and link to model

var UtilizationNetCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {

        if (data.next && data.next !== null) {
            var dp = data.next;
            nextUrl = dp.slice(dp.indexOf('/core'));
            this.fetch({
                url: nextUrl,
                remove: false,
            });
        } else {
            this.defaults.urlCollectionCount--;
        }

        return data.results;
    },

    model: GoldstoneBaseModel,

    // will impose an order based on 'timestamp' for
    // the models as they are put into the collection
    comparator: '@timestamp',

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.fetchInProgress = false;
        this.defaults.nodeName = options.nodeName;
        this.defaults.urlPrefixes = ['tx', 'rx'];
        this.defaults.urlCollectionCountOrig = this.defaults.urlPrefixes.length;
        this.defaults.urlCollectionCount = this.defaults.urlPrefixes.length;
        this.defaults.globalLookback = options.globalLookback;
        this.fetchMultipleUrls();
    },

    fetchMultipleUrls: function() {
        var self = this;

        if (this.defaults.fetchInProgress) {
            return null;
        }

        this.defaults.fetchInProgress = true;
        this.defaults.urlsToFetch = [];

        // grabs minutes from global selector option value
        var lookback = +new Date() - (1000 * 60 * this.defaults.globalLookback);

        _.each(self.defaults.urlPrefixes, function(prefix) {
            self.defaults.urlsToFetch.push("/core/metrics?name__prefix=os.net." + prefix + "&node=" +
                self.defaults.nodeName + "&timestamp__range={'gte':" +
                lookback + "}&page_size=1000");
        });


        this.fetch({

            // fetch the first time without remove:false
            // to clear out the collection
            url: this.defaults.urlsToFetch[0],
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        this.url = "/core/nav_tree";
        this.fetch();
    }
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            componentParam: 'nova',
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width()
        });


        //------------------------------
        // instantiate neutron api chart

        this.neutronApiPerfChart = new ApiPerfCollection({
            componentParam: 'neutron',
        });

        this.neutronApiPerfChartView = new ApiPerfView({
            chartTitle: "Neutron API Performance",
            collection: this.neutronApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r1-c2',
            width: $('#api-perf-report-r1-c2').width()
        });

        //-------------------------------
        // instantiate keystone api chart

        this.keystoneApiPerfChart = new ApiPerfCollection({
            componentParam: 'keystone',
        });

        this.keystoneApiPerfChartView = new ApiPerfView({
            chartTitle: "Keystone API Performance",
            collection: this.keystoneApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r2-c1',
            width: $('#api-perf-report-r2-c1').width()
        });

        //-----------------------------
        // instantiate glance api chart

        this.glanceApiPerfChart = new ApiPerfCollection({
            componentParam: 'glance',
        });

        this.glanceApiPerfChartView = new ApiPerfView({
            chartTitle: "Glance API Performance",
            collection: this.glanceApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#api-perf-report-r2-c2',
            width: $('#api-perf-report-r2-c2').width()
        });

        //-----------------------------
        // instantiate cinder api chart

        this.cinderApiPerfChart = new ApiPerfCollection({
            componentParam: 'cinder',
        });

        this.cinderApiPerfChartView = new ApiPerfView({
            chartTitle: "Cinder API Performance",
            collection: this.cinderApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
                'Start: ' + start + '<br>' +
                'End: ' + end + '<br>' +
                'Interval: ' + ns.interval + '<br>' +
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

        if(this.checkReturnedDataSet(json) === false){
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
            var key = _.keys(d).filter(function(item){
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
            .style("opacity", 0.3);

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
    }

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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
This view will be re-invoked upon every page refresh or redirect, as it is
baked into base.html.

After ajaxSend Listener is bound to $(document), it will be triggered on all
subsequent $.ajaxSend calls.

Uses xhr.setRequestHeader to append the Auth token on all subsequent api calls.
It also serves to handle 401 auth
errors, removing any existing token, and redirecting to the login page.

The logout icon will only be rendered in the top-right corner of the page if
there is a truthy value present in localStorage.userToken
*/

var LogoutIcon = GoldstoneBaseView.extend({

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        // if auth token present, hijack all subsequent ajax requests
        // with an auth header containing the locally stored token
        this.setAJAXSendRequestHeaderParams();

        // only render the logout button if an auth token is present
        this.makeVisibleIfTokenPresent();

        // clicking logout button > expire token via /accounts/logout
        // then clear token from localStorage and redirect to /login
        this.setLogoutButtonHandler();
    },

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

            $.post('/accounts/logout')
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
        location.href = "#/login";
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ChartHeaderView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.defaults.columns = options.columns || 12;
        this.defaults.chartTitle = options.chartTitle;
        this.defaults.infoText = options.infoText;
        this.defaults.infoIcon = options.infoIcon || 'fa-tasks';

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
        var infoButtonText = new InfoButtonText().get('infoText');
        var htmlGen = function() {
            var result = infoButtonText[ns.infoText];
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

    template: _.template('<div id="chart-panel-header" class="panel panel-primary col-md-<%= this.defaults.columns %>">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa <%= this.defaults.infoIcon %>"></i> <%= this.defaults.chartTitle %>' +
        '<span class="pull-right special-icon-post"></span>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="info-button"></i>' +
        '<span class="pull-right special-icon-pre"></span>' +
        '</h3></div>' +
        '<div class="mainContainer"></div>')
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            componentParam: 'cinder',
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
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            $('#details-single-rsrc-table').text('No additional details available');
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
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Resource Details' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            chartTitle: 'Event Timeline',
            width: $('#goldstone-discover-r1-c1').width()
        });

        //---------------------------
        // instantiate Node Availability chart

        this.nodeAvailChart = new NodeAvailCollection({});

        this.nodeAvailChartView = new NodeAvailView({
            chartTitle: 'Node Availability',
            collection: this.nodeAvailChart,
            el: '#goldstone-discover-r1-c2',
            h: {
                "main": 150,
                "swim": 50
            },
            width: $('#goldstone-discover-r2-c2').width()
        });


        //---------------------------
        // instantiate Zoomable Tree chart

        // collection ready if tree data becomes api-driven

        // this.zoomableTree = new ZoomablePartitionCollection({
        // });

        this.zoomableTree = new ZoomablePartitionCollection({});

        this.zoomableTreeView = new ZoomablePartitionView({
            blueSpinnerGif: blueSpinnerGif,
            chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverZoomTopology'],
            collection: this.zoomableTree,
            el: '#goldstone-discover-r2-c1',
            frontPage: false,
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

    },

    template: _.template('' +
        '<div id="goldstone-discover-r1" class="row">' +
        '<div id="goldstone-discover-r1-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r1-c2" class="col-md-6"></div>' +
        '</div>' +
        '<div id="goldstone-discover-r2" class="row">' +
        '<div id="goldstone-discover-r2-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r2-c2" class="col-md-6"></div>' +
        '</div>'
    )

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        ns.color = d3.scale.ordinal().range(colorArray.distinct[5]);

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

                d.host = d.host || '';
                d.log_message = d.log_message || 'No message logged';

                if (d.log_message.length > 280) {
                    d.log_message = d.log_message.slice(0, 300) + "...";
                }

                d.event_type = d.event_type || 'No event type logged';
                d['@timestamp'] = d['@timestamp'] || 'No date logged';

                return "" +
                    "Host: " + d.host + "<br>" +
                    d.event_type + " (click event line to persist popup info)<br>" +
                    // "uuid: " + d.id + "<br>" +
                    "Created: " + d['@timestamp'] + "<br>" +
                    "Message: " + d.log_message + "<br>";
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
            if (filterType === d.event_type && !ns.filter[filterType].active) {
                return 0;
            }
        }
        return 0.8;
    },

    visibilityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (filterType === d.event_type && !ns.filter[filterType].active) {
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
            return evt['@timestamp'];
        })));

        var xStart = moment(d3.max(_.map(allthelogs, function(evt) {
            return evt['@timestamp'];
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
                d['@timestamp'] = moment(d['@timestamp'])._d;
                return d;
            });


        // compile an array of the unique event types
        ns.uniqueEventTypes = _.uniq(_.map(allthelogs, function(item) {
            return item.event_type;
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
            // the @timestamp param. This could possibly create some
            // issues due to duplication of a supposedly unique
            // param, but has not yet been a problem in practice.
            .data(ns.dataset, function(d) {
                return d['@timestamp'];
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
                return ns.color(ns.uniqueEventTypes.indexOf(d.event_type) % ns.color.range().length);
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
                return ns.xScale(d['@timestamp']);
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
                return ns.xScale(d['@timestamp']);
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

        // attach click listeners to chart heading info button
        $('#goldstone-event-info').popover({
            trigger: 'manual',
            content: '<div class="infoButton">' +
                infoButtonText.eventTimeline +
                '</div>',
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
        '<h4 class="modal-title" id="myModalLabel">Event Type Filters</h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5>Uncheck event-type to hide from display</h5><br>' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

        var urlRouteConstruction = '/logging/events/search?host=' +
            this.defaults.hostName +
            '&@timestamp__range={"gte":' + lookback + ',"lte":' + now + '}';

        // makes a route similar to:
        // /logging/events/search?host=rsrc-01&@timestamp__range={"gte":1426019353333,"lte":1427245753333}

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
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Events Report' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            componentParam: 'glance',
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        '<h3>Help Topics</h3>' +
        '<ul>' +
        '<li><a href="#getting_help">Getting help</a></li>' +
        '<li><a href="#license">License</a></li>' +
        '</ul>' +

        '<a name="getting_help"></a><h3>Getting Help</h3>' +
        'If you would like to contact Solinea regarding issues, feature requests, ' +
        'or other goldstone related feedback, click the ' +
        '<a href="http://www.solinea.com/goldstone/feedback" target="_blank">' +
        '<i class="fa fa-bug" style="color:black"></i>' +
        '</a> icon here or at the top right corner of the application panel. In the ' +
        'event that you do not have internet access from the system running the ' +
        'goldstone interface, you can use the link <b>http://www.solinea.com/' + 'goldstone/feedback</b> ' +
        'from another system, or provide the following information via email to ' +
        '<b>goldstone@solinea.com</b>:' +
        '<ul>' +
        '<li>Name</li>' +
        '<li>Company</li>' +
        '<li>Summary</li>' +
        '<li>Detailed description of issue</li>' +
        '<li>Attachments (if appropriate)</li>' +
        '</ul>' +

        'For general inquiries or to contact our consulting services team, either ' +
        'click the ' +
        '<a href="http://www.solinea.com/contact" target="_blank">' +
        '<i class="fa fa-envelope-o" style="color:black"></i>' +
        '</a> icon here or at the top right of the application window, or email ' +
        '<b>info@solinea.com</b>.' +

        '<a name="license"></a><h3>License</h3>' +
        'Goldstone license information can be found in the file <b>/opt/goldstone' + '/LICENSE.pdf</b> ' +
        'or on the web at <b>http://www.solinea.com/goldstone/license.pdf</b>. ' + 'Disclosures for ' +
        '3rd party software used by goldstone can be found in the file <b>/opt/' + 'goldstone/OSS_LICENSE_DISCLOSURE.pdf</b> ' +
        'or on the web at <b>http://www.solinea.com/goldstone/' + 'OSS_LICENSE_DISCLOSURE.pdf</b>'
    )

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            componentParam: 'keystone',
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
        '</div>'
    )
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

/* instantiated in logSearchView.js as:

    this.logAnalysisCollection = new LogAnalysisCollection({});

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
        ns.yAxisLabel = 'Log Events';
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

        var uri = '/logging/search?';

        if (ns.specificHost) {
            uri += 'host=' + ns.specificHost + '&';
        }

        uri += '@timestamp__range={"gte":' +
            ns.start +
            ',"lte":' +
            ns.end +
            '}&loglevel__terms=[';

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
        /logging/search?@timestamp__range={%22gte%22:1426981050017,%22lte%22:1426984650017}&loglevel__terms=[%22EMERGENCY%22,%22ALERT%22,%22CRITICAL%22,%22ERROR%22,%22WARNING%22,%22NOTICE%22,%22INFO%22,%22DEBUG%22]
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
                            settings.url += "&log_message__regexp=.*" +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
The intelligence/search page is composed of a LogAnalysisView on top, contained
within this LogSearchView. The global lookback/refresh listeners are listenTo()'d
from this view, and with the triggerChange function, kick off responding
processes in the LogAnalysisView that is instantiated from within this view.

instantiated in goldstoneRouter as
    new LogSearchView({
        el: ".launcher-container"
    });
*/

var LogSearchView = GoldstoneBasePageView.extend({

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
        this.listenTo(app.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange('lookbackSelectorChanged');
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(app.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
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

        new ChartHeaderView({
            el: '.log-analysis-container',
            chartTitle: 'Log Analysis',
            infoText: 'searchLogAnalysis',
            infoIcon: 'fa-dashboard',
            columns: 13
        });

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
            urlRoot: "/logging/summarize?",
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
        ' Search Results' +
        '</h3>' +
        '</div>' +

        '<div class="alert alert-danger search-popup-message" hidden="true"></div>' +
        '<div id="intel-search-data-table" class="panel-body">' +
        '<table id="log-search-table" class="table table-hover">' +

        '<!-- table rows filled by draw_search_table -->' +

        '<thead>' +
        '<tr class="header">' +
        '<th>Timestamp</th>' +
        '<th>Syslog Severity</th>' +
        '<th>Component</th>' +
        '<th>Host</th>' +
        '<th>Message</th>' +
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
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var LoginPageView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

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

        $.post('/accounts/login', input, function() {})
            .done(function(success) {

                // store the auth token
                self.storeAuthToken(success.auth_token);
                self.redirectPostSuccessfulAuth();
            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call

                try {
                    goldstone.raiseInfo(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    goldstone.raiseInfo(fail.responseText);
                    console.log(e);
                }

            });
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
    },

    redirectPostSuccessfulAuth: function() {
        location.href = '#';
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-4">' +
        '<form class="login-form">' +
        '<h3>Please sign in</h3>' +
        '<label for="inputUsername">Username</label>' +
        '<input name="username" type="text" class="form-control" placeholder="Username" required autofocus>' +
        '<label for="inputPassword">Password</label>' +
        '<input name="password" type="password" class="form-control" placeholder="Password" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>' +
        '</form>' +
        '<div id="forgotUsername"><a href="#/password">Forgot username or password?</a></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        ' Resource List<span class="panel-header-resource-title"></span>' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            componentParam: 'neutron',
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            .attr("transform", "translate(" + ns.mw + ",0)");

        // nudges visible y-axis to the right
        ns.graph.append("g")
            .attr("class", "swim axis invisible-axis")
            .attr("transform", "translate(20,0)");

        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function(e) {
                // if (e.update_method === 'PING') {
                //     return 's';
                // }
                if (this.getBBox().y < 130) {
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
                return "Host: " + d.name + "<br/>" +
                    // "(" + d.id + ")" + "<br/>" +
                    "Emergency: " + d.emergency_count + "<br>" +
                    "Alert: " + d.alert_count + "<br>" +
                    "Critical: " + d.critical_count + "<br>" +
                    "Error: " + d.error_count + "<br>" +
                    "Warning: " + d.warning_count + "<br>" +
                    "Notice: " + d.notice_count + "<br>" +
                    "Info: " + d.info_count + "<br>" +
                    "Debug: " + d.debug_count + "<br>";
            });

        ns.graph.call(ns.tooltip);

        // Label the swim lane ticks
        ns.swimAxis
            .tickFormat(function(d) {
                // Visual swim lanes
                var swimlanes = {
                    // ping: "Ping Only",
                    unadmin: "",
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
                'style="opacity: 0.8; background-color:' + ns.loglevel([item]) + ';">' +
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
                window.location.href = '#/report/node/' + d.name;
            });

        this.redraw();

        circle.exit().remove();

        return true;
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
                nodeObject.level = nonzero_levels[nonzero_levels.length - 1][0];
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
                    return 0.8;
                }
                if (ns.filter[d.level]) {
                    return 0.8;
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

        // attach click listeners to chart heading info button
        $('#goldstone-node-info').popover({
            trigger: 'manual',
            content: '<div class="infoButton">' +
                infoButtonText.nodeAvailability +
                '</div>',
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
    )
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            this.hypervisorCoreView.trigger('lookbackSelectorChanged');
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

        this.listenTo(app.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.triggerChange();

            // changing the lookback also resets the setInterval counter
            self.clearScheduledInterval();
            self.scheduleInterval();
        });
        this.listenTo(app.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
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
        $("button#headerBar").click(function() {

            // sets key corresponding to active tab to 'true'
            // on this.visiblePanel
            self.flipVisiblePanel($(this).context.innerHTML);

            // and triggers change
            self.triggerChange();

            // unstyle formerly 'active' button to appear 'unpressed'
            $("button#headerBar.active").toggleClass("active");

            // style 'active' button to appear 'pressed'
            $(this).toggleClass("active");

            // pass the textual content of button to _.each to
            // show/hide the correct report section
            var selectedButton = ($(this).context.innerHTML.toLowerCase());
            _.each($("button#headerBar"), function(item) {
                $("#node-report-panel").find('#' + item.innerHTML + 'Report').hide();
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

        new ChartHeaderView({
            el: '#service-status-title-bar',
            chartTitle: 'Service Status Report',
            infoText: 'serviceStatus',
            columns: 12
        });
        new ChartHeaderView({
            el: '#utilization-title-bar',
            chartTitle: 'Utilization',
            infoText: 'utilization',
            columns: 12
        });
        new ChartHeaderView({
            el: '#hypervisor-title-bar',
            chartTitle: 'Hypervisor',
            infoText: 'hypervisor',
            columns: 12
        });

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

        //---------------------------
        // instantiate Memory Usage chart
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

        //---------------------------
        // instantiate Network Usage chart

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

        //---------------------------
        // instantiate Libvirt core/vm chart
        this.hypervisorCoreChart = new HypervisorCollection({
            url: "/core/report_names?node=rsrc-02&timestamp__range={%27gte%27:1429203012258}",
            // url: "/api_perf/stats?start=111&end=112&interval=60s&component=nova",
            globalLookback: ns.globalLookback
        });

        this.hypervisorCoreView = new HypervisorView({
            collection: this.hypervisorCoreChart,
            el: '#node-report-r4 #node-report-panel #cores-usage',
            width: $('#node-report-r4 #node-report-panel #cores-usage').width(),
            axisLabel: "Cores"
        });


        //---------------------------
        // instantiate Libvirt mem/vm  chart
        this.hypervisorMemoryChart = new HypervisorCollection({
            url: "/core/report_names?node=rsrc-02&timestamp__range={%27gte%27:1429203012258}",
            // url: "/api_perf/stats?start=111&end=112&interval=60s&component=nova",
            globalLookback: ns.globalLookback
        });
        this.hypervisorMemoryView = new HypervisorView({
            collection: this.hypervisorMemoryChart,
            el: '#node-report-r4 #node-report-panel #memory-usage',
            width: $('#node-report-r4 #node-report-panel #memory-usage').width(),
            axisLabel: "GB"
        });

        //---------------------------
        // instantiate Libvirt top 10 CPU consumer VMs chart
        this.hypervisorVmCpuChart = new HypervisorVmCpuCollection({
            url: "/core/report_names?node=rsrc-02&timestamp__range={%27gte%27:1429203012258}",
            // url: "/api_perf/stats?start=111&end=112&interval=60s&component=nova",
            globalLookback: ns.globalLookback
        });

        this.hypervisorVmCpuView = new HypervisorVmCpuView({
            collection: this.hypervisorVmCpuChart,
            el: '#node-report-r4 #node-report-panel #vm-cpu-usage',
            width: $('#node-report-r4 #node-report-panel #vm-cpu-usage').width()
        });

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

        this.logAnalysisView = new LogSearchView({
            collection: this.logAnalysisCollection,
            width: $('#logsReport').width(),
            height: 300,
            el: '#logsReport',
            featureSet: 'logEvents',
            chartTitle: 'Log Analysis',
            specificHost: this.node_uuid,
            urlRoot: "/logging/summarize?",
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
        '<button type="button" id="headerBar" class="servicesButton active btn btn-default">Services</button>' +
        '<button type="button" id="headerBar" class="reportsButton btn btn-default">Reports</button>' +
        '<button type="button" id="headerBar" class="eventsButton btn btn-default">Events</button>' +
        '<button type="button" id="headerBar" class="detailsButton btn btn-default">Details</button>' +
        '<button type="button" id="headerBar" class="logsButton btn btn-default">Logs</button>' +
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
        '<h4 class="text-center">CPU Usage</h4>' +
        '</div>' +
        '<div class="col-md-4" id="memory-usage">' +
        '<h4 class="text-center">Memory Usage</h4>' +
        '</div>' +
        '<div class="col-md-4" id="network-usage">' +
        '<h4 class="text-center">Network Usage</h4>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="node-report-r4" class="row">' +
        '<div id="node-report-r4-c1" class="col-md-12">' +

        // placeholder for title bar and info popover
        '<div id="hypervisor-title-bar"></div>' +
        '<div id="node-report-panel" class="panel panel-primary">' +
        '<div class="well col-md-12">' +
        '<div class="col-md-3 text-center" id="cores-usage">' +
        'Cores' +
        '</div>' +
        '<div class="col-md-3 text-center" id="memory-usage">' +
        'Memory' +
        '</div>' +
        '<div class="col-md-6" id="vm-cpu-usage">' +
        'Per VM CPU Usage' +
        '</div>' +
        '</div>' +
        '</div>' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
            componentParam: 'nova',
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "All"
            }],
            el: '#nova-report-r1-c1',
            width: $('#nova-report-r1-c1').width()
        });

        /*
        VM Spawns Chart
        */

        this.vmSpawnChart = new StackedBarChartCollection({
            urlPrefix: '/nova/hypervisor/spawns'
        });

        this.vmSpawnChartView = new StackedBarChartView({
            chartTitle: "VM Spawns",
            collection: this.vmSpawnChart,
            height: 300,
            infoCustom: 'novaSpawns',
            el: '#nova-report-r1-c2',
            width: $('#nova-report-r1-c2').width(),
            yAxisLabel: 'Spawn Events'
        });

        /*
        CPU Resources Chart
        */

        this.cpuResourcesChart = new CpuResourceCollection({});

        this.cpuResourcesChartView = new StackedBarChartView({
            chartTitle: "CPU Resources",
            collection: this.cpuResourcesChart,
            featureSet: 'cpu',
            height: 300,
            infoCustom: 'novaCpuResources',
            el: '#nova-report-r2-c1',
            width: $('#nova-report-r2-c1').width(),
            yAxisLabel: 'Cores'
        });

        /*
        Mem Resources Chart
        */

        this.memResourcesChart = new MemResourceCollection({});

        this.memResourcesChartView = new StackedBarChartView({
            chartTitle: "Memory Resources",
            collection: this.memResourcesChart,
            featureSet: 'mem',
            height: 300,
            infoCustom: 'novaMemResources',
            el: '#nova-report-r2-c2',
            width: $('#nova-report-r2-c2').width(),
            yAxisLabel: 'MB'
        });

        /*
        Disk Resources Chart
        */

        this.diskResourcesChart = new DiskResourceCollection({});

        this.diskResourcesChartView = new StackedBarChartView({
            chartTitle: "Disk Resources",
            collection: this.diskResourcesChart,
            featureSet: 'disk',
            height: 300,
            infoCustom: 'novaDiskResources',
            el: '#nova-report-r3-c1',
            width: $('#nova-report-r3-c1').width(),
            yAxisLabel: 'GB'
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
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var PasswordResetView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        $('.password-reset-form').on('submit', function(e) {
            e.preventDefault();
            self.submitRequest($(this).serialize());
        });
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/password/reset', input, function() {})
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
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-4">' +
        '<form class="password-reset-form">' +
        '<h3>Reset password</h3>' +
        '<label for="email">Email address</label>' +
        '<input name="email" type="email" class="form-control" placeholder="Enter email associated with your account" required autofocus><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Send reset email</button>' +
        '</form>' +
        '<div id="cancelReset"><a href="#/login">Cancel and return to login</a></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

        var urlRouteConstruction = '/core/reports?name=' +
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
        this.listenTo(this.collection,'sync', function() {

            // removes spinner that was appended
            // during chart-load
            self.hideSpinner();

            // clears existing 'Reports Available' in dropdown
            $(self.el).find('.reports-available-dropdown-menu > li').remove();

            // if no reports available, appends 'No reports available'
            if (self.collection.toJSON()[0] === undefined || self.collection.toJSON()[0].result.length === 0) {

                $(self.el).find('.reports-available-dropdown-menu').append('<li id="report-result">No reports available</li>');

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

        if(data === null) {
            data = ['No results within selected time range'];
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
            "serverSide": false,
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
        'Reports Available ' +
        '<span class="caret"></span>' +
        '</button>' +
        '<ul class="reports-available-dropdown-menu dropdown-menu" role="menu" aria-labelledby="dLabel">' +
        '<li>Reports list loading or not available</li>' +
        '</ul>' +
        '</div><br>' +

        // spinner container
        '<div class="reports-spinner-container"></div>' +

        // render report data title bar
        '<div class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Report Data' +
        '<span class="panel-header-report-title"></span>' +
        '</h3>' +
        '</div>' +

        // initially rendered message this will be overwritten by dataTable
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="reports-info-container">' +
        '<br>Selecting a report from the dropdown above will populate this area with the report results.' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var SettingsPageView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.getUserSettings();
        this.addHandlers();
    },

    renderTenantSettingsPageLink: function() {
        $('#tenant-settings-button').append('' +
            '<h3>Additional actions</h3>' +
            '<button class="btn btn-lg btn-danger btn-block modify">Modify tenant settings</button>');

        $('button.modify').on('click', function() {
            window.location.href = "#/settings/tenants";
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
            data: data,
        }).done(function(success) {
            goldstone.raiseInfo(message + ' update successful');
        })
            .fail(function(fail) {
                try {
                    goldstone.raiseInfo(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    goldstone.raiseInfo(fail.responseText + e);
                }
            });
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    getUserSettings: function() {
        var self = this;

        $.get('/user')
            .done(function(result) {
                $(self.el).find('[name="username"]').val(result.username);
                $(self.el).find('[name="first_name"]').val(result.first_name);
                $(self.el).find('[name="last_name"]').val(result.last_name);
                $(self.el).find('[name="email"]').val(result.email);

                // result object contains tenant_admin field (true|false)
                if (result.tenant_admin) {

                    // if true, render link to tenant admin settings page
                    if (result.tenant_admin === true) {
                        self.renderTenantSettingsPageLink();
                    }
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo('Could not load user settings');
            });
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
            self.submitRequest('PUT', '/user', $(this).serialize(), 'Settings');
        });

        // add listener to password form submission button
        $('.password-reset-form').on('submit', function(e) {
            e.preventDefault();
            self.submitRequest('POST', '/accounts/password', $(this).serialize(), 'Password');

            // clear password form after submission, success or not
            $('.password-reset-form').find('[name="current_password"]').val('');
            $('.password-reset-form').find('[name="new_password"]').val('');
        });
    },

    trimInputField: function(selector) {

        // remove leading/trailing spaces
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +

        // personal settings form
        '<div class="col-md-4 col-md-offset-2">' +
        '<form class="settings-form">' +
        '<h3>Update Personal Settings</h3>' +
        '<label for="inputUsername">Username</label>' +
        '<input name="username" type="text" class="form-control" placeholder="username" required>' +
        '<label for="inputFirstname">First name</label>' +
        '<input name="first_name" type="text" class="form-control" placeholder="First name" autofocus>' +
        '<label for="inputLastname">Last name</label>' +
        '<input name="last_name" type="text" class="form-control" placeholder="Last name">' +
        '<label for="inputEmail">Email</label>' +
        '<input name="email" type="email" class="form-control" placeholder="Email">' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Update</button>' +
        '</form>' +
        '</div>' +

        // password reset form
        '<div class="col-md-4">' +
        '<form class="password-reset-form">' +
        '<h3>Change Password</h3>' +
        '<label for="inputCurrentPassword">Current password</label>' +
        '<input name="current_password" type="password" class="form-control" placeholder="Current password" required>' +
        '<label for="inputNewPassword">New password</label>' +
        '<input name="new_password" type="password" class="form-control" placeholder="New password" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Change password</button>' +
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
View is currently directly implemented as Nova VM Spawns Viz
and extended into Nova CPU/Memory/Disk Resource Charts

instantiated similar to:

this.vmSpawnChart = new StackedBarChartCollection({
    urlPrefix: '/nova/hypervisor/spawns'
});

this.vmSpawnChartView = new StackedBarChartView({
    chartTitle: "VM Spawns",
    collection: this.vmSpawnChart,
    height: 300,
    infoCustom: 'novaSpawns',
    el: '#nova-report-r1-c2',
    width: $('#nova-report-r1-c2').width(),
    yAxisLabel: 'Spawn Events'
});
*/

// view is linked to collection when instantiated in api_perf_report.html

var StackedBarChartView = GoldstoneBaseView.extend({

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
        StackedBarChartView.__super__.processOptions.apply(this, arguments);

        this.defaults.featureSet = this.options.featureSet || null;
    },

    specialInit: function() {
        var ns = this.defaults;

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        // differentiate color sets for mem and cpu charts
        if (ns.featureSet === 'mem' || ns.featureSet === 'cpu') {
            ns.color = d3.scale.ordinal().range(ns.colorArray.distinct[3]);
        } else {
            // this includes "VM Spawns" and "Disk Resources" chars
            ns.color = d3.scale.ordinal()
                .range(ns.colorArray.distinct[2]);
        }

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

        if (ns.featureSet === 'cpu') {

            // CPU Resources chart data prep
            /*
            {
                "name": "nova.hypervisor.vcpus",
                "region": "RegionOne",
                "value": 16,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "count"
            },
            {
                "name": "nova.hypervisor.vcpus_used",
                "region": "RegionOne",
                "value": 7,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "count"
            },
            */

            uniqTimestamps = _.uniq(_.map(data, function(item) {
                return item['@timestamp'];
            }));
            _.each(uniqTimestamps, function(item, i) {
                result.push({
                    eventTime: moment(item).valueOf(),
                    Used: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.vcpus_used'
                    })[0].value,
                    Physical: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.vcpus'
                    })[0].value
                });

            });

        } else if (ns.featureSet === 'disk') {

            /*
            {
                "name": "nova.hypervisor.local_gb_used",
                "region": "RegionOne",
                "value": 83,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "GB"
            },
            {
                "name": "nova.hypervisor.local_gb",
                "region": "RegionOne",
                "value": 98,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "GB"
            },
        */
            uniqTimestamps = _.uniq(_.map(data, function(item) {
                return item['@timestamp'];
            }));
            _.each(uniqTimestamps, function(item, i) {
                result.push({
                    eventTime: moment(item).valueOf(),
                    Used: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.local_gb_used'
                    })[0].value,
                    Total: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.local_gb'
                    })[0].value
                });

            });

        } else if (ns.featureSet === 'mem') {

            /*
            {
                "name": "nova.hypervisor.memory_mb_used",
                "region": "RegionOne",
                "value": 10752,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "MB"
            },
            {
                "name": "nova.hypervisor.memory_mb",
                "region": "RegionOne",
                "value": 31872,
                "metric_type": "gauge",
                "@timestamp": "2015-04-07T17:21:48.285186+00:00",
                "unit": "MB"
            },
            */

            uniqTimestamps = _.uniq(_.map(data, function(item) {
                return item['@timestamp'];
            }));
            _.each(uniqTimestamps, function(item, i) {
                result.push({
                    eventTime: moment(item).valueOf(),
                    Used: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.memory_mb_used'
                    })[0].value,
                    Physical: _.where(data, {
                        '@timestamp': item,
                        'name': 'nova.hypervisor.memory_mb'
                    })[0].value
                });

            });


        } else {

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
        }
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

        var ns = this.defaults;
        var self = this;

        // data originally returned from collection as:
        // [{"1424586240000": [6, 16, 256]}...]
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
                    return 0.9;
                }
            })
            .attr("fill-opacity", function(d) {
                if (!showOrHide[d.name]) {
                    return 0;
                } else {
                    return 0.7;
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
            .attr('opacity', 0.7)
            .call(d3.legend);
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {

        new ChartHeaderView({
            el: this.el,
            columns: 12,
            chartTitle: this.defaults.chartTitle,
            infoText: this.defaults.infoCustom
        });

        $(this.el).find('.mainContainer').append(this.template());
        return this;
    }

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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TenantSettingsPageView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
        this.getTenantSettings();
        this.addHandlers();
    },

    addHandlers: function() {
        var self = this;

        // add listener to settings form submission button
        $('.tenant-settings-form').on('submit', function(e) {
            // prevens page jump upon pressing submit button
            e.preventDefault();

            // if there is no selected tenant, prevent ability to submit form
            if ($('#formTenantId').text() === '') {
                self.dataErrorMessage('Must select tenant from list above');
                return;
            }

            // trim inputs to prevent leading/trailing spaces
            self.trimInputField('[name="name"]');
            self.trimInputField('[name="owner"]');
            self.trimInputField('[name="owner_contact"]');
            var tenandId = $('#formTenantId').text();

            // email fields seem to have native .trim() support

            // 4th argument informs what will be appeneded to screen upon success
            self.submitRequest('PUT', '/tenants/' + tenandId, $(this).serialize(), 'Tenant settings');
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
                    "title": "Tenant"
                }, {
                    "title": "Owner's Username"
                }, {
                    "title": "Owner Contact"
                }, {
                    "title": "Tenant Id"
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

    getTenantSettings: function() {
        var self = this;

        $.get('/tenants')
            .done(function(result) {

                if (result.results) {
                    self.drawDataTable(result.results);
                }
            })
            .fail(function(fail) {
                goldstone.raiseInfo('Could not load tenant settings');
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
            data: data,
        })
            .done(function(success) {
                self.dataErrorMessage(message + ' update successful');
            })
            .fail(function(fail) {
                try {
                    self.dataErrorMessage(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    self.dataErrorMessage(fail.responseText + e);
                }
                self.clearDataErrorMessage();
            })
            .always(function() {
                self.getTenantSettings();
            });
    },

    render: function() {
        this.$el.html(this.template());
        this.dataErrorMessage('Click row above to edit');
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
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> Tenants' +
        '</h3>' +
        '</div>' +
        '</div>' +

        '<div class="panel-body">' +
        '<table id="tenants-single-rsrc-table" class="table"></table>' +
        '</div>' +
        // end data table

        '<div class="container">' +
        '<div class="row">' +

        // update settings form
        '<div class="col-md-4 col-md-offset-0">' +
        '<form class="tenant-settings-form">' +
        '<h3>Update Tenant Settings</h3>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<label for="name">Tenant name</label>' +
        '<input name="name" type="text" class="form-control" placeholder="Tenant name" required>' +
        '<label for="owner">Owner name</label>' +
        '<input name="owner" type="text" class="form-control" placeholder="Username of owner" required>' +
        '<label for="owner_contact">Owner contact</label>' +
        '<input name="owner_contact" type="email" class="form-control" placeholder="Owner email address">' +
        '<br><div>Tenant Id: <span id="formTenantId">select from above</span></div>' +
        '<br><button name="submit" class="btn btn-lg btn-primary btn-block" type="submit">Update</button>' +
        '</form>' +
        '</div>' +

        // close divs for row/container
        '</div>' +
        '</div>'

    )

});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// view is linked to collection when instantiated in goldstone_discover.html

var TopologyTreeView = GoldstoneBaseView.extend({

    defaults: {},

    // this block is run upon instantiating the object
    initialize: function(options) {

        this.options = options || {};
        this.defaults = _.clone(this.defaults); 
        this.el = options.el;

        this.defaults.blueSpinnerGif = options.blueSpinnerGif;
        this.defaults.chartHeader = options.chartHeader || null;

        // data may be coming from a collection fetch soon
        this.defaults.data = options.data;
        this.defaults.h = options.h;

        // frontPage affects clicking of leaves.
        // whether it will redirect or append
        // results to resource list
        this.defaults.frontPage = options.frontPage;
        this.defaults.multiRsrcViewEl = options.multiRsrcViewEl || null;
        this.defaults.w = options.width;
        this.defaults.leafDataUrls = options.leafDataUrls;
        this.defaults.filterMultiRsrcDataOverride = options.filterMultiRsrcDataOverride || null;

        var ns = this.defaults;
        var self = this;

        this.render();
        this.initSvg();

        // when extended to zoomablePartitionView, a collection
        // is used to fetch the data and update will be triggered
        // by the listener on that subView.
        if(this.collection === undefined) {
            this.update();
        } else {
            this.processListeners();
        }
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
            left: 30
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
            var firstTsData = payload[0] !== 'undefined' ? payload[0] : [];
            var myUuid = goldstone.uuid()();
            var filteredFirstTsData;
            var keys;
            var columns;
            var columnDefs;
            var oTable;

            // firstTsData[0] if it exists, contains key/values representative
            // of table structure.
            if (firstTsData[0] !== 'undefined') {
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
                } else {
                    goldstone.raiseAlert($(ns.multiRsrcViewEl).find('.popup-message'), 'No data');
                }
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
        window.location.href = '#/report/node/' + redirectNodeName;
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
        var that = this;
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
                    var url = ns.leafDataUrls[d.rsrcType];
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

                        // !front page = load results
                        if (!ns.frontPage) {
                            that.loadLeafData(url);
                            that.appendLeafNameToResourceHeader(origClickedLabel);
                        }

                        // front page = redirect to new page
                        // if leaf is clicked
                        if (ns.frontPage) {

                            // if not a leaf, don't redirect
                            if (d.rsrcType === 'region' || d.rsrcType === 'module') {
                                return true;
                            } else {
                                var parentModule;

                                // traverse up the tree until the
                                // parent module is reached
                                while (d.rsrcType !== 'module') {
                                    d = d.parent;
                                }
                                parentModule = d.label;

                                // set resource url in localStorage
                                url = "/" + parentModule + url;
                                localStorage.setItem('urlForResourceList', url);
                                localStorage.setItem('origClickedLabel', origClickedLabel);
                                window.location.href = '#/' +
                                    parentModule + '/discover';
                            }
                        }
                    }

                } else {
                    that.toggle(d);
                    that.processTree(d);
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
            ],

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
                return (that.hasRemovedChildren(d) || that.isRemovedChild(d)) ?
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

        if (ns.data !== 'undefined') {
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
        }
    },

    render: function() {

        var ns = this.defaults;

        // appends chart header to el with params passed in as array
        if (ns.chartHeader !== null) {
            new ChartHeaderView({
                el: ns.chartHeader[0],
                chartTitle: ns.chartHeader[1],
                infoText: ns.chartHeader[2],
                columns: 13
            });
        }

        // appends Resource List dataTable View if applicable
        if (ns.multiRsrcViewEl !== null) {
            ns.multiRscsView = new MultiRscsView({
                el: ns.multiRsrcViewEl,
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

    template: _.template('' +
        '<div class="panel-body" style="height:600px">' +
        '<div id="topology-tree">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )
});
;
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

        allthelogs = this.collection.toJSON();

        var data = allthelogs;

        _.each(data, function(item) {
            item['@timestamp'] = moment(item['@timestamp']).valueOf();
        });

        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].name === 'os.mem.total') {
                ns.memTotal = data[i];
                var splicedOut = data.splice(i, 1);
                break;
            }
        }


        var dataUniqTimes = _.map(data, function(item) {
            return item['@timestamp'];
        });


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                free: null
            };
        });


        _.each(data, function(item) {

            var metric = item.name.slice(item.name.lastIndexOf('.') + 1);

            newData[item['@timestamp']][metric] = item.value;

        });


        finalData = [];

        _.each(newData, function(item, i) {

            finalData.push({
                used: (ns.memTotal.value - item.free) / self.defaults.divisor,
                free: item.free / self.defaults.divisor,
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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();

        var data = allthelogs;

        _.each(data, function(item) {
            item['@timestamp'] = moment(item['@timestamp']).valueOf();
        });


        var dataUniqTimes = _.uniq(_.map(data, function(item) {
            return item['@timestamp'];
        }));


        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                rx: null,
                tx: null
            };
        });


        _.each(data, function(item) {

            var metric;

            var serviceName = item.name.slice(0, item.name.lastIndexOf('.'));

            if (serviceName.indexOf('rx') >= 0) {
                metric = 'rx';
            } else {
                if (serviceName.indexOf('tx') >= 0) {
                    metric = 'tx';
                } else {}
            }

            newData[item['@timestamp']][metric] += item.value;

        });


        finalData = [];

        _.each(newData, function(item, i) {

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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// view is linked to collection when instantiated in goldstone_discover.html

/*
instantiated on discoverView as:

var zoomableTreeView = new ZoomablePartitionView({
    blueSpinnerGif: blueSpinnerGif,
    chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverZoomTopology'],
    // collection: zoomableTree,
    data: data,
    el: '#goldstone-discover-r2-c1',
    frontPage: false,
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
        this.showSpinner();
    },

    processListeners: function() {
        this.listenTo(this.collection, 'sync', this.update);
    },

    showSpinner: function() {

        // appends spinner with sensitivity to the fact that the View object
        // may render before the .gif is served by django. If that happens,
        // the hideSpinner method will set the 'display' css property to
        // 'none' which will prevent it from appearing on the page

        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = "#chart-panel-header";

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.w / 2),
                'margin-top': 100,
                'display': ns.spinnerDisplay
            });
        });

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
        this.hideSpinner();
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
                    var url = ns.leafDataUrls[d.rsrcType];
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

    template: null

});
