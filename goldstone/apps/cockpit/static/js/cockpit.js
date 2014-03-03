function refreshHostPresence(lookbackQty, lookbackUnit, start, end) {
    hostPresenceTable('#host-presence-table', lookbackQty, lookbackUnit, start, end)
}

function refreshCharts(start, end) {
    badEventMultiLine('#bad-event-chart', start, end)
    physCpuChart("#phys-cpu-chart", start, end)
    virtCpuChart("#virt-cpu-chart", start, end)
    physMemChart("#phys-mem-chart", start, end)
    virtMemChart("#virt-mem-chart", start, end)
    physDiskChart("#phys-disk-chart", start, end)
    virtDiskChart("#virt-disk-chart", start, end)
}

$(document).ready(function () {
    // load the default charts
    badEventMultiLine('#bad-event-chart')
    hostPresenceTable('#host-presence-table')
    physCpuChart("#phys-cpu-chart")
    virtCpuChart("#virt-cpu-chart")
    physMemChart("#phys-mem-chart")
    virtMemChart("#virt-mem-chart")
    physDiskChart("#phys-disk-chart")
    virtDiskChart("#virt-disk-chart")
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