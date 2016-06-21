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

    // if adjusting routes, also adjust breadcrumb generator
    // in setBaseTemplateListeners.js
    routes: {
        "discover": "discover",
        "metrics/api_perf": "apiPerfReport",
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
    refreshViewAfterResize: function(){

        // listener instantiated in init.js
        if(!this.currentRawViewObject) {
            return;
        }
        this.switchView(this.currentRawViewObject);
    },
    switchView: function(view) {

        // keep this in case browser is resized
        // it will be used to redraw view
        this.currentRawViewObject = view;

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
        // .router-content-container is a div set in base.html
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
