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

if compliance module installed, after login, localStorage will contain:
addons: [{
    url_root: 'compliance'
}]
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
                        // pass along the route array
                        // and the name of the addon
                        // which is needed for 
                        // proper side-menu highlighting
                        self.addNewRoute(route, item.url_root);
                    }
                });
            }
        });

        // initialize tooltip connected to new menu item
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover'
        });

        // return backbone template of html string that will
        // construct the drop down menu and submenus of
        // the add-ons menu item
        return _.template(result);
    },

    addNewRoute: function(routeToAdd, eventName) {

        /*
        .route will dynamically add a new route where the
        url is index 0 of the passed in route array, and
        eventName is the string to return via
        the router's on.route event.
        finally, the view to load is index 2 of the passed in route array.
        */

        goldstone.gsRouter.route(routeToAdd[0], eventName, function(passedValue) {

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
        '<li class="compliance-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Compliance">' +
        '<span class="btn-icon-block"><i class="icon compliance">&nbsp;</i></span>' +
        '<span class="btn-txt i18n" data-i18n="Compliance">Compliance</span>' +
        '</li>' +
        '</a>'
    )

});
