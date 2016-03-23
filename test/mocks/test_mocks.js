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

goldstone.userPrefsView = new UserPrefsView();

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

goldstone.sidebarHTMLMock = '<div class="sidebar clearfix">' +
    '<ul class="btn-grp">' +
    '<a href="#discover">' +
    '<li class="dashboard-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Dashboard">' +
    '<span class="btn-icon-block"><i class="icon dashboard-icon">&nbsp;</i></span>' +
    '<span data-i18n="Dashboard" class="btn-txt i18n">Dashboard</span>' +
    '</li>' +
    '</a>' +
    '<li class="alerts-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Alerts">' +
    '<span class="btn-icon-block"><i class="icon alerts">&nbsp;</i></span>' +
    '<span data-i18n="Alerts" class="btn-txt i18n">Alerts</span>' +
    '</li>' +
    '<a href="#metrics/api_perf">' +
    '<li class="metrics-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Metrics">' +
    '<span class="btn-icon-block"><i class="icon metrics">&nbsp;</i></span>' +
    '<span data-i18n="Metrics" class="btn-txt i18n">Metrics</span>' +
    '</li>' +
    '</a>' +
    '<a href="#reports/logbrowser">' +
    '<li class="reports-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Reports">' +
    '<span class="btn-icon-block"><i class="icon reports">&nbsp;</i></span>' +
    '<span data-i18n="Reports" class="btn-txt i18n">Reports</span>' +
    '</li>' +
    '</a>' +
    '<a href="#topology">' +
    '<li class="topology-tab" data-toggle="tooltip" data-placement="right" title="" data-original-title="Topology">' +
    '<span class="btn-icon-block"><i class="icon topology">&nbsp;</i></span>' +
    '<span data-i18n="Topology" class="btn-txt i18n">Topology</span>' +
    '</li>' +
    '</a>' +
    '<span class="addon-menu-view-container">' +
    '</span>' +
    '<li class="menu-toggle" data-toggle="tooltip" data-placement="right" title="" data-original-title="Expand">' +
    '<span class="btn-icon-block"><i class="icon expand">&nbsp;</i></span>' +
    '<span data-i18n="Icons Only" class="btn-txt i18n">Icons Only</span>' +
    '</li>' +
    '</ul>' +
    '<div class="tab-content">' +
    '<div class="tab alert-tab">' +
    '<h4 class="header-block i18n" data-i18n="Alerts">Alerts</h4>' +
    '<span class="alert-close" data-placement="left" data-i18n-tooltip="Close"' +
    'data-toggle="tooltip" title="Close">' +
    '<i class="fa fa-3x fa-inverse fa-chevron-circle-left"></i></span>' +
    '<div class="subtab">' +
    '<ul class="tab-links">' +
    '<li class="active i18n" data-i18n="Unread">Unread</li>' +
    '<li class="i18n" data-i18n="All">All</li>' +
    '</ul>' +
    '<div class="sub-tab-content">' +
    '<div class="tabs">' +
    '<ul class="list-content">' +
    '</ul>' +
    '</div>' +
    '<div class="tabs"></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="router-content-container">' +
    '</div>';
