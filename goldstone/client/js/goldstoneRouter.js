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
    switchView: function(view, launcherView) {
        if (this.currentView) {
            this.currentView.remove();
        }

        if (launcherView !== undefined) {
            this.currentView = launcherView;
            $('.router-content-container').append(launcherView.el);
        } else {
            this.currentView = view;
            $('.router-content-container').append(view.el);
        }

    },
    keystoneReport: function() {
        app.keystoneReportViewLauncher = new LauncherView({});
        $('.router-content-container').append(app.keystoneReportViewLauncher.el);

        app.keystoneReportView = new KeystoneReportView({
            el: ".launcher-container"
        });
        this.switchView(app.keystoneReportView, app.keystoneReportViewLauncher);
    },
    login: function() {
        app.loginPageView = new LoginPageView({});
        this.switchView(app.loginPageView);
    },
    password: function() {
        app.passwordResetView = new PasswordResetView({});
        this.switchView(app.passwordResetView);
    },
    settings: function() {
        app.settingsPageView = new SettingsPageView({});
        this.switchView(app.settingsPageView);
    },
    tenant: function() {
        app.tenantSettingsPageView = new TenantSettingsPageView({});
        this.switchView(app.tenantSettingsPageView);
    },
    apiPerfReport: function() {
        app.apiPerfReportView = new ApiPerfReportView({
            el: ".router-content-container"
        });
        this.switchView(app.apiPerfReportView);
    },
    novaReport: function() {
        app.novaReportView = new NovaReportView({
            el: ".router-content-container"
        });
        this.switchView(app.novaReportView);
    },
    neutronReport: function() {
        app.neutronReportView = new NeutronReportView({
            el: ".router-content-container"
        });
        this.switchView(app.neutronReportView);
    },
    cinderReport: function() {
        app.cinderReportView = new CinderReportView({
            el: ".router-content-container"
        });
        this.switchView(app.cinderReportView);
    },
    glanceReport: function() {
        app.glanceReportView = new GlanceReportView({
            el: ".router-content-container"
        });
        this.switchView(app.glanceReportView);
    },
    logSearch: function() {
        app.logSearchView = new LogSearchView({
            el: ".router-content-container"
        });
        this.switchView(app.logSearchView);
    },
    nodeReport: function(nodeId) {
        app.nodeReportView = new NodeReportView({
            el: ".router-content-container",
            node_uuid: nodeId
        });
        this.switchView(app.nodeReportView);
    },
    discover: function() {
        app.discoverView = new DiscoverView({
            el: ".router-content-container"
        });
        this.switchView(app.discoverView);
    },
    redirect: function() {
        location.href = "#/discover";
    }
});
