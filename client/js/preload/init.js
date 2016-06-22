/**
 * Copyright 2016 Solinea, Inc.
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

goldstone.init = function() {

    /*
    authLogoutIcon encapsulates the initialization of the $(document)
    listener for ajaxSend events and uses xhr.setRequestHeader to append
    the Auth token on all subsequent api calls. It also serves to handle
    401 auth errors, removing any existing token, and redirecting to
    the login page.
    authLogoutIcon is subscibed to a trigger emmitted by the gsRouter on
    init.js.
    finally, authLogoutIcon prunes old unused keys in localStorage
    */

    // set default error behavior of dataTables to throw
    // a console error instead of raising a browser alert
    $.fn.dataTable.ext.errMode = 'throw';

    // handled in authLogoutView.js
    goldstone.authLogoutIcon = new LogoutIcon({
        localStorageKeys: ['compliance', 'topology', 'userToken', 'userPrefs', 'rem']
    });

    // append username to header
    $.get('/user/', function() {}).done(function(item) {

        // username must be defined, first_name is optional
        // also see settingsPageView:submitRequest()
        // for a function that updates this on change.
        var userInfo = item.first_name || item.username;
        $('.active-username').text(userInfo);

        // redirect to tenant settings page if os_* fields
        // not already populated
        if (item.tenant_admin === true) {
            if (!item.os_auth_url ||
                !item.os_name ||
                !item.os_password ||
                !item.os_username) {
                goldstone.raiseError('Add OpenStack settings');
                location.href = "/#settings/tenants";
            }
        }
    });

    // instantiate user prefs object (userPrefsView.js)
    goldstone.userPrefsView = new UserPrefsView();

    // instantiate translation data that can be set on settingsPageView.
    // Settings page drop-downs will trigger userPrefsView
    // to persist preferance, and triggers i18nModel to
    // set selected language. (i18nModel.js)
    goldstone.i18n = new I18nModel();

    // define the router (goldstoneRouter.js)
    goldstone.gsRouter = new GoldstoneRouter();

    // contains the machinery for appending/maintaining
    // 'add-ons' dropdown menu (addonMenuView.js)
    goldstone.addonMenuView = new AddonMenuView({});

    // re-translate the base template when switching pages to make sure
    // the possibly hidden lookback/refresh selectors are translated
    goldstone.i18n.listenTo(goldstone.gsRouter, 'switchingView', function() {
        goldstone.i18n.translateBaseTemplate();
    });

    // deprecated...waiting to see how refresh/lookback
    // are handled prior to removal
    // append global selectors to page
    goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({
        lookbackValues: {
            lookback: [
                [15, 'lookback 15m'],
                [60, 'lookback 1h'],
                [360, 'lookback 6h'],
                [1440, 'lookback 1d'],
                [4320, 'lookback 3d'],
                [10080, 'lookback 7d']
            ],
            refresh: [
                [30, 'refresh 30s'],
                [60, 'refresh 1m'],
                [300, 'refresh 5m'],
                [-1, 'refresh off']
            ],
            selectedLookback: 60,
            selectedRefresh: 30
        }
    });
    $('.global-range-refresh-container').append(goldstone.globalLookbackRefreshSelectors.el);

    // start the population of the alerts icon drop-down menu
    // alertsMenuView.js
    var alertsMenuCollection = new AlertsMenuCollection({
        urlBase: '/core/alert/'
    });

    // start the secondary navigation bar breadcrumb state manager
    // breadcrumbManager.js
    goldstone.breadcrumbManager = new BreadcrumbManager({
        el: '#bottom-bar'
    });
    // set dashboard status initially to green
    goldstone.breadcrumbManager.trigger('updateDashboardStatus', 'green');

    // alertsMenuView.js
    goldstone.alertsMenu = new AlertsMenuView({
        collection: alertsMenuCollection,
        el: '.alert-icon-placeholder'
    });

    // defined in setBaseTemplateListeners.js
    // sets up UI to respond to user interaction with
    // menus, and set highlighting of appropriate menu icons.
    // setBaseTemplateListeners.js
    goldstone.setBaseTemplateListeners();

    // start the backbone router that will handle /# calls
    Backbone.history.start();

    // debounce will activate after a cluster of resizing activity finishes
    // and there is a 400 millisecond gap.
    $(window).on('resize', _.debounce(function() {
        goldstone.gsRouter.refreshViewAfterResize();
    }, 400));
};
