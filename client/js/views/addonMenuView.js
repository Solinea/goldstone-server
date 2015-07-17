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

/*
instantiated on router.html as:
app.addonMenuView = new AddonMenuView({
    el: ".addon-menu-view-container"
});
*/

/*
localStorage test payload:

localStorage.setItem('addons', JSON.stringify( [{
        "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
        "url_root": "yourapp",
        "name": "yourapp",
        "notes": "Release notes, configuration tips, or other miscellany.",
        "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
        "version": "0.0",
        "manufacturer": "Your Company, Inc."
    },
    {
        "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
        "url_root": "theirapp",
        "name": "theirapp",
        "notes": "Release notes, configuration tips, or other miscellany.",
        "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
        "version": "0.0",
        "manufacturer": "Your Company, Inc."
    },
    {
        "updated_date": "\"2015-07-15T17:15:19.181668+00:00\"",
        "url_root": "ourapp",
        "name": "ourapp",
        "notes": "Release notes, configuration tips, or other miscellany.",
        "installed_date": "\"2015-07-15T17:15:19.181118+00:00\"",
        "version": "0.0",
        "manufacturer": "Your Company, Inc."
    }
]))

app.addonMenuView.trigger('installedAppsUpdated')

*/

var AddonMenuView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.el = this.options.el;
        this.processListeners();
        this.refreshAddonsMenu();
    },

    processListeners: function() {
        var self = this;

        // this trigger is fired in loginPageView after logging in
        this.listenTo(this, 'installedAppsUpdated', function() {
            self.refreshAddonsMenu();
        });
    },

    refreshAddonsMenu: function() {
        var addons = localStorage.getItem('addons');
        if(addons !== null && addons !== "null" && addons !== "[]" && addons !== [] ) {

            // clear list before re-rendering in case app list has changed
            this.$el.html('');
            this.render();

            var extraMenuItems = this.generateDropdownElementsPerAddon();

            $(this.el).find('.addon-menu-li-elements').html(extraMenuItems());
        } else {
            // in the case that the addons key in localStorage
            // is now falsy, just remove the dropdown and links
            this.$el.html('');
        }
    },

    generateDropdownElementsPerAddon: function() {
        var result = '';
        var list = localStorage.getItem('addons');
        list = JSON.parse(list);
        _.each(list, function(item) {
            result += '<li><a href="' + item.url_root +
            '"><i class="fa fa-star"></i> ' + item.name +
            '</a>';
        });
        return _.template(result);
    },

    template: _.template('' +
        '<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class = "fa fa-briefcase"></i> Add-ons<b class="caret"></b></a>' +
        '<ul class="dropdown-menu addon-menu-li-elements">' +
        '</ul>'
    )

});
