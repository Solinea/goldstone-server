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
