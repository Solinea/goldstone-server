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

var I18nModel = Backbone.Model.extend({

    initialize: function() {
        this.createTranslationObject();
        this.setTranslationObject();
        this.translateBaseTemplate();
        this.addListeners();
    },

    createTranslationObject: function() {

        // goldstone.i18nJSON is assigned on router.html, and is
        // the contents of the json object stored in the
        // goldstone/static/i18n/po_json/ directory
        var originalObject = goldstone.i18nJSON;

        var finalResult = {};
        finalResult.domain = "English";

        // if goldstone.translate is called on a key not in the .po file
        finalResult.missing_key_callback = function(key) {
            console.error('missing .po file translation for: `' + key + '`');
        };

        finalResult.locale_data = {};

        _.each(goldstone.i18nJSON, function(val, key, orig) {
            var result = {};
            result = _.omit(orig[key].locale_data.messages, "");
            result[""] = orig[key].locale_data.messages[""];
            result[""].domain = key;
            finalResult.locale_data[key] = result;
        });
        this.combinedPoJsonFiles = finalResult;

        /*
        this constructs an initialization object like:

        this.combinedPoJsonFiles: {
            "domain": "English",
            "locale_data": {
                "English": {
                    "": {
                        "domain": "English",
                        "plural_forms": "nplurals=2; plural=(n != 1);",
                        "lang": "en"
                    },
                    "goldstone": [""],
                    "Metrics": [""],
                    "User Settings": [""],
                },
                "japanese": {
                    "": {
                        "domain": "japanese",
                        "plural_forms": "nplurals=1; plural=0;",
                        "lang": "ja"
                    },
                    "goldstone": ["ゴールドストーン"],
                    "Metrics": ["メトリック"],
                    "User Settings": ["ユーザ設定"],
                }
            }
        }
        */
    },

    setTranslationObject: function() {

        // this.combinedPoJsonFiles created via this.createTranslationObject()
        goldstone.translationObject = new Jed(this.combinedPoJsonFiles);
        this.checkCurrentLanguage();
        this.setTranslationFunction();
    },

    /*
    these are the function signatures for the api returned by
    creating a new Jed object:

    gettext = function ( key )
    dgettext = function ( domain, key )
    dcgettext = function ( domain, key, category )
    ngettext = function ( singular_key, plural_key, value )
    dngettext = function ( domain, singular_ley, plural_key, value )
    dcngettext = function ( domain, singular_key, plural_key, value, category )
    pgettext = function ( context, key )
    dpgettext = function ( domain, context, key )
    npgettext = function ( context, singular_key, plural_key, value )
    dnpgettext = function ( domain, context, singular_key, plural_key, value )
    dcnpgettext = function ( domain, context, singular_key, plural_key, value, category )

    the most common one will be dgettext, so that is how we are setting up
    goldstone.translate.
    */

    setTranslationFunction: function() {
        goldstone.translate = function(string) {
            var domain = goldstone.translationObject.domain;
            return goldstone.translationObject.dgettext(domain, string);
        };
    },


    checkCurrentLanguage: function() {

        // first determine which lanaguage .po files are installed
        var existingPos = _.keys(goldstone.i18nJSON);

        // if there is a currently selected language in localStorage,
        // use that to set the current .domain, or set to the
        // English default if none found.
        var userPrefs = localStorage.getItem('userPrefs');

        // set current language
        if (userPrefs !== null) {
            var lang = JSON.parse(userPrefs).i18n;

            // check if language is set && the po exists
            if (lang !== undefined && existingPos.indexOf(lang) > -1) {
                this.setCurrentLanguage(lang);
                return;
            }
        }

        // if lang preference hasn't been set yet,
        // or lang set in localStorage does not have a .po file,
        // just default to 'English' and set the
        // localStorage item to 'English'
        this.setCurrentLanguage('English');
        userPrefs = JSON.parse(userPrefs);

        // in case of initial load, userPrefs will be null
        userPrefs = userPrefs || {};
        userPrefs.i18n = 'English';
        localStorage.setItem('userPrefs', JSON.stringify(userPrefs));

        return;
    },

    setCurrentLanguage: function(language) {
        goldstone.translationObject.domain = language;
    },

    addListeners: function() {
        var self = this;

        // this would be triggered on userPrefsView
        this.listenTo(this, 'setLanguage', function(language) {

            // .domain is used by the dgettext calls throughout
            // the site to determine which language set to
            // draw from when determining the appropriate tranlation.
            self.setCurrentLanguage(language);
            self.translateBaseTemplate();
        });
    },

    translateBaseTemplate: function() {
        _.each($('.i18n'), function(item) {
            $(item).text(goldstone.translate($(item).data().i18n));

        });
    }
});
