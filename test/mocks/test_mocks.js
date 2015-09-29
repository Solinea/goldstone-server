// mock i18n
var goldstone = goldstone || {};
goldstone.i18nJSON = {
    "English": {
        "domain": "messages",
        "locale_data": {
            "messages": {
                "": {
                    "domain": "messages",
                    "plural_forms": "nplurals=2; plural=(n != 1);",
                    "lang": "en"
                },
                "Nova API Performance": ["Børk"]
            }
        }
    }
};

// Create mocked version with 'missing key callback' commented out
// to avoid a rainstorm of 'missing translation key' log messages.
mock_I18nModel = I18nModel.extend({

    createTranslationObject: function() {

        // goldstone.i18nJSON is assigned on router.html, and is
        // the contents of the json object stored in the
        // goldstone/static/i18n/po_json/ directory
        var originalObject = goldstone.i18nJSON;

        var finalResult = {};
        finalResult.domain = "English";

        // COMMENT OUT MISSING KEY CALLBACK FOR MOCKED VERSION
        // to avoid a rainstorm of 'missing translation key' log messages.

        // if goldstone.translate is called on a key not in the .po file
        // finalResult.missing_key_callback = function(key) {
        //     console.error('missing .po file translation for: `' + key + '`');
        // };

        finalResult.locale_data = {};

        _.each(goldstone.i18nJSON, function(val, key, orig) {
            var result = {};
            result = _.omit(orig[key].locale_data.messages, "");
            result[""] = orig[key].locale_data.messages[""];
            result[""].domain = key;
            finalResult.locale_data[key] = result;
        });
        this.combinedPoJsonFiles = finalResult;
    },

});

goldstone.i18n = new mock_I18nModel();
