function refreshHostPresence(lookbackQty, lookbackUnit, start, end) {
    hostPresenceTable('#host-presence-table', lookbackQty, lookbackUnit, start, end)
}

function refreshCharts(interval, start, end) {
    badEventHistogramPanel('#bad-event-chart', interval, start, end)
    physCpuChart("#phys-cpu-chart", interval, start, end)
    virtCpuChart("#virt-cpu-chart", interval, start, end)
    physMemChart("#phys-mem-chart", interval, start, end)
    virtMemChart("#virt-mem-chart", interval, start, end)
    physDiskChart("#phys-disk-chart", interval, start, end)
}

$(document).ready(function () {
    // load the default charts
    badEventHistogramPanel('#bad-event-chart')
    hostPresenceTable('#host-presence-table')
    physCpuChart("#phys-cpu-chart")
    virtCpuChart("#virt-cpu-chart")
    physMemChart("#phys-mem-chart")
    virtMemChart("#virt-mem-chart")
    physDiskChart("#phys-disk-chart")
});

$("#settingsUpdateButton").click(function () {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1],
        intervalUnit = $("select#settingsIntervalUnit").val(),
        interval = "1".concat(intervalUnit.substring(0, 1))
    refreshCharts(interval, start, end)
});

$("#hostPresenceButton").click(function () {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1],
        presenceUnit = $("select#hostPresenceUnit").val(),
        presenceQty = $("input#hostPresenceQty").val()
    presenceQty = typeof presenceQty === 'undefined' ? 1 : presenceQty
    refreshHostPresence(presenceQty, presenceUnit, start, end)
});