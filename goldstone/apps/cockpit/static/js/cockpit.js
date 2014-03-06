
$(document).ready(function () {
    // load the default charts
    badEventMultiLine('#bad-event-multiline')
    hostPresenceTable('#host-presence-table')
    physCpuChart("#phys-cpu-chart")
    physMemChart("#phys-mem-chart")
    physDiskChart("#phys-disk-chart")
});

$("#settingsUpdateButton").click(function () {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1]
    refreshCockpitCharts(start, end)
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