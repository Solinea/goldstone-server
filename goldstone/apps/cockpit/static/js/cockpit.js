var autoRefreshInterval

$(document).ready(function () {
    "use strict";
    // load the default charts
    badEventMultiLine('#bad-event-multiline')
    hostPresenceTable('#host-presence-table')
    physCpuChart("#phys-cpu-chart")
    physMemChart("#phys-mem-chart")
    physDiskChart("#phys-disk-chart")
});


var updateCockpitCharts = function () {
    "use strict";
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1]

    refreshCockpitEventCharts(start, end)
    refreshCockpitSecondaryCharts(start, end)
    dc.filterAll()
    //dc.refocusAll()
}

var refreshCockpitCharts = function () {
    "use strict";
    var dates = _getSearchFormDates(),
        start = new Date(dates[0]),
        end = dates[1],
        refreshInterval = $('#autoRefreshInterval').val()

    start.addSeconds(refreshInterval / 1000)
    console.log("refreshLogSearch] refreshInterval = " + refreshInterval + ", start =" + start)
    populateSettingsFields(start, end)
    updateCockpitCharts()
}


$("#settingsUpdateButton").click(function () {
    "use strict";
    updateCockpitCharts()
    if (isRefreshing()) {
        window.clearInterval(autoRefreshInterval)
        startCockpitRefresh()
    } else {
        if (typeof autoRefreshInterval !== 'undefined') {
            window.clearInterval(autoRefreshInterval)
        }
    }

});

$("#hostPresenceButton").click(function () {
    "use strict";
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1]
    refreshHostPresence(start, end)
});

function startCockpitRefresh() {
    "use strict";
    autoRefreshInterval = window.setInterval(refreshCockpitCharts, getRefreshInterval())
}
