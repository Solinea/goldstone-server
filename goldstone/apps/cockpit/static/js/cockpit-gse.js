
function refreshChartsGse(interval, start, end) {
    vcpuGraph('#vcpu-graph', interval, start, end);
}

$(document).ready(function () {
    // load the default panels
    vcpuGraph('#vcpu-graph')
    $('#lease-col').load("/leases/cockpit")
});

$("#settingsUpdateButton").click(function () {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1],
        intervalUnit = $("select#settingsIntervalUnit").val(),
        interval = "1".concat(intervalUnit.substring(0, 1));
    refreshChartsGse(interval, start, end);
});