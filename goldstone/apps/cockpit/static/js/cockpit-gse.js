
function refreshChartsGse(interval, start, end) {
    vcpuGraph('#vcpu-graph', interval, start, end);
}

$(document).ready(function () {
    // load the default panels
    vcpuGraph('#vcpu-graph');
});

$("#cockpitUpdateButton").click(function () {
    var dates = _getFormDates(),
        start = dates[0],
        end = dates[1],
        intervalUnit = $("select#cockpitIntervalUnit").val(),
        interval = "1".concat(intervalUnit.substring(0, 1));
    refreshChartsGse(interval, start, end);
});