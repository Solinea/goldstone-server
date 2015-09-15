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

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('i18nModel.js spec', function() {
    beforeEach(function() {

        $('body').html('' +
            '<span data-i18n="hello" class="i18n">hello</span>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith('{}');

        goldstone.userPrefsView = new UserPrefsView();

        this.testJSON = {
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
                },
                "globish": {
                    "": {
                        "domain": "esperanto",
                        "plural_forms": "nplurals=1; plural=0;",
                        "lang": "ep"
                    },
                    "goldstone": ["goldo stono"],
                    "Metrics": ["metrico"],
                    "User Settings": ["usero settingo"],
                },
            }
        };

        this.testViewModel = I18nModel.extend({
            combinedPoJsonFiles: this.testJSON
        });

        this.testView = new this.testViewModel();

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        localStorage.clear();
    });
    describe('basic test for chart triggering', function() {
        it('initializes model', function() {
            this.testView.trigger('setLanguage', 'english');

            a = {};
            a.userPrefs = {};
            a.userPrefs.i18n = 'english';
            a = JSON.stringify(a);
            localStorage.setItem('userPrefs', a);
            this.testView.checkCurrentLanguage();
        });
    });
    describe('individual functions', function() {
        it('sets language properly', function() {
            assert.ok(goldstone.translationObject);
        });
    });
});
