var autoRefreshInterval

var updateLogSearch = function() {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1]

    console.log("[updateLogSearch] start = " + start + ", end = " + end)
    badEventMultiLine('#bad-event-multiline', start, end)
    drawSearchTable('#log-search-table', start, end)
}

var refreshLogSearch = function () {
    "use strict";
    var dates = _getSearchFormDates(),
        start = new Date(dates[0]),
        end = dates[1],
        refreshInterval = $('#autoRefreshInterval').val()

    start.addSeconds(refreshInterval / 1000)
    console.log("refreshLogSearch] refreshInterval = " + refreshInterval + ", start =" + start)
    populateSettingsFields(start, end)
    updateLogSearch()
}

$("#settingsUpdateButton").click(function () {
    "use strict";
    updateLogSearch()
    if (isRefreshing()) {
        window.clearInterval(autoRefreshInterval)
        startLogSearchRefresh()
    } else {
        if (typeof autoRefreshInterval !== 'undefined') {
            window.clearInterval(autoRefreshInterval)
        }
    }

});

function startLogSearchRefresh() {
    "use strict";
    autoRefreshInterval = window.setInterval(refreshLogSearch, getRefreshInterval())
}
