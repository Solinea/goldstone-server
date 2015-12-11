// mock i18n
var goldstone = goldstone || {};

goldstone.skipI18nLog = true;

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
mock_I18nModel = I18nModel.extend({});

goldstone.i18n = new mock_I18nModel();

goldstone.baseHTMLMock = '<div class="test-container"></div>' +
    '<div style="width:10%;" class="col-xl-1 pull-right">&nbsp;' +
    '</div>' +
    '<div class="col-xl-2 pull-right">' +
    '<form class="global-refresh-selector" role="form">' +
    '<div class="form-group">' +
    '<div class="col-xl-1">' +
    '<div class="input-group">' +
    '<select class="form-control" id="global-refresh-range">' +
    '<option value="15">refresh 15s</option>' +
    '<option value="30" selected>refresh 30s</option>' +
    '<option value="60">refresh 1m</option>' +
    '<option value="300">refresh 5m</option>' +
    '<option value="-1">refresh off</option>' +
    '</select>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</form>' +
    '</div>' +
    '<div class="col-xl-1 pull-right">' +
    '<form class="global-lookback-selector" role="form">' +
    '<div class="form-group">' +
    '<div class="col-xl-1">' +
    '<div class="input-group">' +
    '<select class="form-control" id="global-lookback-range">' +
    '<option value="15">lookback 15m</option>' +
    '<option value="60" selected>lookback 1h</option>' +
    '<option value="360">lookback 6h</option>' +
    '<option value="1440">lookback 1d</option>' +
    '</select>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</form>' +
    '</div>';
