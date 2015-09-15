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
        this.setTranslationObject();
        this.checkCurrentLanguage();
        this.translateBaseTemplate();
        this.addListeners();
    },

    setTranslationObject: function() {
        goldstone.translationObject = new Jed(this.combinedPoJsonFiles);
        this.setTranslationFunction();
    },

    /*
    these are the function signatures for the api returned by
    createing a new Jed object:

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

        // if there is a currently selected language in localStorage,
        // use that to set the current .domain, or set to the
        // english default if none found.
        var uP = localStorage.getItem('userPrefs');

        // if localStorage item is not present,
        // or i18n hasn't been set yet, just default to 'english'
        if (uP !== null) {
            var lang = JSON.parse(uP).i18n;
            if (lang !== undefined) {
                this.setCurrentLanguage(lang);
                return;
            }
        }
        this.setCurrentLanguage('english');
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

    combinedPoJsonFiles: {
        "domain": "english",
        "locale_data": {
            "english": {
                "": {
                    "domain": "english",
                    "plural_forms": "nplurals=2; plural=(n != 1);",
                    "lang": "en"
                },
                "goldstone": [""],
                "Metrics": [""],
                "User Settings": [""],
                "Language": [""],
                "Nova API Performance": [""],
                "Neutron API Performance": [""],
                "Keystone API Performance": [""],
                "Glance API Performance": [""],
                "Cinder API Performance": [""],
                "API Call": [""],
                "All": [""],
                "Start": [""],
                "End": [""],
                "Interval": [""]
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
                "Language": ["言語"],
                "Nova API Performance": ["新星のAPIのパフォーマンス"],
                "Neutron API Performance": ["中性子のAPIパフォーマンス"],
                "Keystone API Performance": [""],
                "Glance API Performance": ["キーストーンのAPIパフォーマンス"],
                "Cinder API Performance": ["シンダーAPIパフォーマンス"],
                "API Call": ["API呼び出し"],
                "All": ["凡ゆる"],
                "Start": ["始まり"],
                "End": ["終わり"],
                "Interval": ["インターバル"]
            },
        }
    },

    translateBaseTemplate: function() {
        _.each($('.i18n'), function(item) {
            $(item).text(goldstone.translate($(item).data().i18n));

        });
    }
});
