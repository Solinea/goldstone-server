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

    // defined in setBaseTemplateListeners.js
    goldstone.setBaseTemplateListeners();

    /*
    authLogoutIcon encapsulates the initialization of the $(document)
    listener for ajaxSend events and uses xhr.setRequestHeader to append
    the Auth token on all subsequent api calls. It also serves to handle
    401 auth errors, removing any existing token, and redirecting to
    the login page.
    authLogoutIcon is subscibed to a trigger emmitted by the gsRouter in
    router.html. Following that, only if there is a token
    present (expired or not), it will use css to show/hide the logout
    icon in the top-right corner of the page.
    finally, authLogoutIcon prunes old unused keys in localStorage
    */

    goldstone.localStorageKeys = ['addons', 'userToken', 'userPrefs', 'rem'];

    goldstone.authLogoutIcon = new LogoutIcon();


    // append username to header
    $.get('/user/', function() {}).done(function(item) {
        var userInfo = item.email;
        $('.username').text(userInfo);

        // redirect to tenant settings page if os_* fields
        // not already populated
        if (item.os_auth_url !== undefined &&
            item.os_name !== undefined &&
            item.os_password !== undefined &&
            item.os_username !== undefined) {

            if (item.os_auth_url === "" ||
                item.os_name === "" ||
                item.os_password === "" ||
                item.os_username === "") {
                location.href = "/#settings/tenants";
            }
        }
    });

    // instantiate translation data that can be set on settingsPageView.
    // Settings page drop-downs will trigger userPrefsView
    // to persist preferance, and triggers i18nModel to
    // set selected language.
    goldstone.i18n = new I18nModel();

    // instantiate object that will manage user prefs / theme
    goldstone.userPrefsView = new UserPrefsView();

    // define the router
    goldstone.gsRouter = new GoldstoneRouter();

    // re-translate the base template when switching pages to make sure
    // the possibly hidden lookback/refresh selectors are translated
    goldstone.i18n.listenTo(goldstone.gsRouter, 'switchingView', function() {
        goldstone.i18n.translateBaseTemplate();
    });

    // contains the machinery for appending/maintaining
    // 'add-ons' dropdown menu
    goldstone.addonMenuView = new AddonMenuView({
        el: ".addon-menu-view-container"
    });

    // append global selectors to page
    goldstone.globalLookbackRefreshSelectors = new GlobalLookbackRefreshButtonsView({});
    $('.global-range-refresh-container').append(goldstone.globalLookbackRefreshSelectors.el);

    // start the backbone router that will handle /# calls
    Backbone.history.start();

};
