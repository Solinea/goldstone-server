var autoRefreshInterval

function updateLogSearch() {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1]
    badEventMultiLine('#bad-event-multiline', start, end)
    drawSearchTable('#log-search-table', start, end)
}

function refreshLogSearch() {
    "use strict";
    var dates = _getSearchFormDates(),
        start = new Date(dates[0]),
        end = dates[1],
        refreshInterval = $('#autoRefreshInterval').val()

    start.addSeconds(refreshInterval / 1000)
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
