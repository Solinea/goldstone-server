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

var LauncherView = Backbone.View.extend({
    initialize: function(options) {
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="launcher-container"></div>')
});

var GoldstoneRouter = Backbone.Router.extend({
    routes: {
        "discover": "discover",
        "login": "login",
        "password": "password",
        "settings": "settings",
        "settings/tenants": "tenant",
        "api_perf/report": "apiPerfReport",
        "nova/report": "novaReport",
        "neutron/report": "neutronReport",
        "cinder/report": "cinderReport",
        "glance/report": "glanceReport",
        "keystone/report": "keystoneReport",
        "intelligence/search": "logSearch",
        "report/node/:nodeId": "nodeReport",
        "*default": "redirect"
    },
    switchView: function(view, nodeId) {
        // prevent multiple successive calls to the same page
        if (app.switchTriggeredBy && app.switchTriggeredBy === view) {
            return;
        }
        app.switchTriggeredBy = view;

        // Backbone's remove() calls this.$el.remove() and this.stopListening()
        if (app.currentLauncherView) {

            // this.currentView is instantiated below
            if (app.currentView.onClose) {
                app.currentView.onClose();
            }
            app.currentView.remove();
            app.currentLauncherView.remove();
        }

        // instantiate wrapper view that can be removed upon page change
        // store the current launcher and view so it can be remove()'d
        app.currentLauncherView = new LauncherView({});

        // append the launcher to the page div
        $('.router-content-container').append(app.currentLauncherView.el);

        // instantiate the desired page view
        // if it's a node report page, add the node_uuid param
        if (nodeId !== undefined) {
            app.currentView = new view({
                el: '.launcher-container',
                node_uuid: nodeId
            });
        } else {
            app.currentView = new view({
                el: '.launcher-container'
            });
        }

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
    nodeReport: function(nodeId) {
        this.switchView(NodeReportView, nodeId);
    },
    discover: function() {
        this.switchView(DiscoverView);
    },
    redirect: function() {
        location.href = "#/discover";
    }
});
