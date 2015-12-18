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
