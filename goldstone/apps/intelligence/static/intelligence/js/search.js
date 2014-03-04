

function refreshSearchPage(interval, start, end) {
    var uri = "/intelligence/search".concat(
        "?start_time=", String(Math.round(start.getTime() / 1000)),
        "&end_time=", String(Math.round(end.getTime() / 1000)),
        "&interval=", interval
    )

    window.open(uri, "_self")
}

function populateSettingsFields(start, end) {
    var s = new Date(start).toString(),
        e = new Date(end).toString(),
        sStr = s.substr(s.indexOf(" ") + 1),
        eStr = e.substr(e.indexOf(" ") + 1)

    $('#settingsStartTime').val(sStr)
    $('#settingsEndTime').val(eStr)
}

$("#settingsUpdateButton").click(function () {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1],
        interval = $("select#settingsIntervalUnit").val()

    refreshSearchPage(interval, start, end)
})
