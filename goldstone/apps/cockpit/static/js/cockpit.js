$('#cockpitStartTime').datetimepicker({
  format:'M d Y H:i:s',
  lang:'en'
})

$('#cockpitEndTime').datetimepicker({
  format:'M d Y H:i:s',
  lang:'en'
})

function _getFormDates() {
    //grab the values from the form elements
    var start = $("input#cockpitStartTime").val()
    var end = $("input#cockpitEndTime").val()
    if (end !== '') {
        var d = new Date(end)
        if (d === 'Invalid Date') {
                alert("End date must be valid. Using now.")
                end = new Date()
        } else {
            end = d
        }
    } else {
        end = new Date()
    }

    if (start !== '') {
        var d = new Date(start);
        if (d === 'Invalid Date') {
                alert("Start date must be valid. Using 1 week1 prior to end date.")
                d.addWeeks(-1)
                start = d
            } else {
            start = d
        }
    } else {
        var start = new Date(end)
        start.addWeeks(-1)
    }

    return [start, end]
}

function refreshHostPresence(lookbackQty, lookbackUnit, start, end) {
    draw_host_presence_table('#host-presence-table', lookbackQty, lookbackUnit, start, end)
}

function refreshCharts(interval, start, end) {
    badEventHistogramPanel('#bad-event-chart', interval, start, end)
    physCpuChart("#phys-cpu-chart", interval, start, end)
    virtCpuChart("#virt-cpu-chart", interval, start, end)
    physMemChart("#phys-mem-chart", interval, start, end)
    virtMemChart("#virt-mem-chart", interval, start, end)
    physDiskChart("#phys-disk-chart", interval, start, end)
    virtDiskChart("#virt-disk-chart", interval, start, end)
}

$(document).ready(function () {
    // load the default charts
    badEventHistogramPanel('#bad-event-chart')
    draw_host_presence_table('#host-presence-table')
    physCpuChart("#phys-cpu-chart")
    virtCpuChart("#virt-cpu-chart")
    physMemChart("#phys-mem-chart")
    virtMemChart("#virt-mem-chart")
    physDiskChart("#phys-disk-chart")
    virtDiskChart("#virt-disk-chart")
});

$("#cockpitUpdateButton").click(function () {
    var dates = _getFormDates(),
        start = dates[0],
        end = dates[1],
        intervalUnit = $("select#cockpitIntervalUnit").val(),
        interval = "1".concat(intervalUnit.substring(0, 1))
    refreshCharts(interval, start, end)
});

$("#hostPresenceButton").click(function () {
    var dates = _getFormDates(),
        start = dates[0],
        end = dates[1],
        presenceUnit = $("select#hostPresenceUnit").val(),
        presenceQty = $("input#hostPresenceQty").val()
    presenceQty = typeof presenceQty !== 'defined' ? 1 : presenceQty
    refreshHostPresence(presenceQty, presenceUnit, start, end)
});