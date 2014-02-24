$('#cockpitStartTime').datetimepicker({
    format: 'M d Y H:i:s',
    lang: 'en'
})

$('#cockpitEndTime').datetimepicker({
    format: 'M d Y H:i:s',
    lang: 'en'
})

function _getSearchFormDates() {
    //grab the values from the form elements
    var end = (function () {
            var e = $("input#cockpitEndTime").val()
            switch (e) {
                case '':
                    return new Date()
                default:
                    var d = new Date(e)
                    if (d === 'Invalid Date') {
                        alert("End date must be valid. Using now.")
                        d = new Date()
                    }
                    return d
            }
        })(),
        start = (function () {
            var s = $("input#cockpitStartTime").val()
            switch (s) {
                case '':
                    return (new Date(end)).addWeeks(-1)
                default:
                    var d = new Date(s)
                    if (d === 'Invalid Date') {
                        alert("Start date must be valid. Using 1 week1 " +
                            "prior to end date.")
                        d = (new Date(end)).addWeeks(-1)
                    }
                    return d
            }
        })()

    return [start, end]
}

function refreshSearchPage(interval, start, end) {
    var uri = "/intelligence/search".concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)),
        "&interval=", interval
    )

    window.open(uri, "_self")
    //badEventHistogramPanel('#bad-event-chart', interval, start, end)
    //drawSearchTable('#log-search-table', interval, start / 1000, end / 1000)
}

function populateSettingsFields(interval, start, end) {
    $('#cockpitStartTime').val(new Date(start).toISOString())
    $('#cockpitEndTime').val(new Date(end).toISOString())
    $('#cockpitIntervalUnit').val(interval)
}

$("#searchUpdateButton").click(function () {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1],
        interval = $("select#cockpitIntervalUnit").val()

    console.log("start = " + start)
    console.log("end = " + end)

    refreshSearchPage(interval, start, end)
})
