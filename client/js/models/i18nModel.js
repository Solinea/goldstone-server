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
        goldstone.translation = new Jed(this.combinedPoJsonFiles);
        this.checkCurrentLanguage();
        this.addListeners();
    },

    addListeners: function() {

        // this would be triggered on userPrefsView
        this.listenTo(this, 'setLanguage', function(language) {

            // .domain is used by the dgettext calls throughout
            // the site to determine which language set to
            // draw from when determining the appropriate tranlation.
            goldstone.translation.domain = language;
        });
    },

    checkCurrentLanguage: function() {

        // if there is a currently selected language in localStorage,
        // use that to set the current .domain, or set to the
        // english default if none found.
        var uP = localStorage.getItem('userPrefs');
        if (uP !== null) {
            var lang = JSON.parse(uP).i18n;
            if (lang !== undefined) {
                this.setCurrentLanguage(lang);
            } else {
                this.setCurrentLanguage('english');
            }
        } else {
            this.setCurrentLanguage('english');
        }
    },

    setCurrentLanguage: function(language) {
        goldstone.translation.domain = language;
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
                "User Settings": [""],
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
                "User Settings": ["ユーザ設定"],
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
    }
});
