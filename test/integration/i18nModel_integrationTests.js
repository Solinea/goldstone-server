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
            '<span data-i18n="goldstone" class="i18n">goldstone</span>'
        );

        goldstone.i18nJSONorig = goldstone.i18nJSON;

        this.i18nJSON = {
            "English": {
                "domain": "messages",
                "locale_data": {
                    "messages": {
                        "": {
                            "domain": "messages",
                            "plural_forms": "nplurals=2; plural=(n != 1);",
                            "lang": "en"
                        },
                        "goldstone": [""],
                        "Metrics": [""],
                        "User Settings": [""],
                    }
                }
            }
        };

        this.testView = goldstone.i18n;

    });
    afterEach(function() {
        $('body').html('');
        // this.server.restore();
        localStorage.clear();
        goldstone.i18nJSON = goldstone.i18nJSONorig;
    });
    describe('basic test for chart triggering', function() {
        it('creates a Jed.js compatible translationObject', function() {
            goldstone.i18nJSON = this.i18nJSON;
            this.testView.createTranslationObject();
            expect(this.testView.combinedPoJsonFiles.domain).to.equal('English');
        });
    });
    describe('individual functions', function() {
        it('sets a goldstone translation function', function() {
            goldstone = goldstone || {};
            goldstone.i18nJSON = this.i18nJSON;
            delete goldstone.translate;
            assert.notOk(goldstone.translate);

            this.testView.createTranslationObject();
            this.testView.setTranslationObject();
            this.testView.setTranslationFunction();
            assert.ok(goldstone.translate);
        });
        it('checks current language', function() {
            localStorage.clear();
            assert.notOk(localStorage.getItem('userPrefs'));

            // with no language set in localStorage
            // defaults to 'English'
            goldstone = goldstone || {};
            goldstone.i18nJSON = this.i18nJSON;
            this.testView.checkCurrentLanguage();
            assert.ok(localStorage.getItem('userPrefs'));
            expect(JSON.parse(localStorage.getItem('userPrefs')).i18n).to.equal('English');

            // with invalid language set in localStorage
            // defaults to 'English'
            localStorage.clear();
            assert.notOk(localStorage.getItem('userPrefs'));
            var missingLanguage = {
                i18n: 'Neo-Dravidian'
            };
            localStorage.setItem('userPrefs', JSON.stringify(missingLanguage));
            assert.ok(localStorage.getItem('userPrefs'));
            this.testView.checkCurrentLanguage();
            expect(JSON.parse(localStorage.getItem('userPrefs')).i18n).to.equal('English');
        });
        it('sets current language', function() {
            this.testView.initialize();
            expect(goldstone.translationObject.domain).to.equal('English');
            this.testView.setCurrentLanguage('Klingon');
            expect(goldstone.translationObject.domain).to.equal('Klingon');
            this.testView.setCurrentLanguage('Dwarvish');
            expect(goldstone.translationObject.domain).to.equal('Dwarvish');
            this.testView.initialize();
            expect(goldstone.translationObject.domain).to.equal('English');
        });
        it('translates items with the proper markup on .html templates', function() {

            $('body').html('' +
                '<span data-i18n="hello" class="first i18n">hello</span>' +
                '<span data-i18n="goodbye" class="second i18n">goodbye</span>'
            );

            goldstone.i18nJSON = this.i18nJSON;
            goldstone.i18nJSON.English.locale_data.messages.hello = [""];
            goldstone.i18nJSON.English.locale_data.messages.goodbye = [""];

            this.testView.createTranslationObject();
            this.testView.setTranslationObject();
            this.testView.translateBaseTemplate();

            expect($('.first').text()).to.equal("hello");
            expect($('.second').text()).to.equal("goodbye");

            goldstone.i18nJSON.English.locale_data.messages.hello = ["aloha"];
            goldstone.i18nJSON.English.locale_data.messages.goodbye = ["sayonara"];
            this.testView.createTranslationObject();
            this.testView.setTranslationObject();
            this.testView.translateBaseTemplate();

            expect($('.first').text()).to.equal("aloha");
            expect($('.second').text()).to.equal("sayonara");
        });
        it('translates keys passed into goldstone.translate function', function() {
            goldstone.i18nJSON = this.i18nJSON;
            goldstone.i18nJSON.English.locale_data.messages.hello = ["aloha"];
            goldstone.i18nJSON.English.locale_data.messages.goodbye = ["sayonara"];
            this.testView.createTranslationObject();
            this.testView.setTranslationObject();
            expect(goldstone.translate('hello')).to.equal('aloha');
            expect(goldstone.translate('goodbye')).to.equal('sayonara');
        });
    });
});
