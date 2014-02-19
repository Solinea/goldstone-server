$('#cockpitStartTime').datetimepicker({
  format:'M d Y H:i:s',
  lang:'en'
});

$('#cockpitEndTime').datetimepicker({
  format:'M d Y H:i:s',
  lang:'en'
});

function _getFormDates() {
    //grab the values from the form elements
    var start = $("input#cockpitStartTime").val();
    var end = $("input#cockpitEndTime").val();
    if (end !== '') {
        var d = new Date(end);
        if (d === 'Invalid Date') {
                alert("End date must be valid. Using now.");
                end = new Date();
        } else {
            end = d;
        }
    } else {
        end = new Date();
    };

    if (start !== '') {
        console.log("[start] " + start);
        var d = new Date(start);
        if (d === 'Invalid Date') {
                alert("Start date must be valid. Using 1 week1 prior to end date.");
                d.addWeeks(-1);
                start = d;
            } else {
            start = d;
        }
    } else {
        var start = new Date(end);
        start.addWeeks(-1);
    };

    return [start,end]
}

function refreshHostPresence(lookbackQty, lookbackUnit, start, end) {
    draw_host_presence_table('#host-presence-table', lookbackQty, lookbackUnit, start, end);
}

function refreshCharts(interval, start, end) {
    bad_event_histogram_panel('#bad-event-chart', interval, start, end);
    phys_cpu_chart("#phys-cpu-chart", interval, start, end);
    virt_cpu_chart("#virt-cpu-chart", interval, start, end);
    phys_mem_chart("#phys-mem-chart", interval, start, end);
    virt_mem_chart("#virt-mem-chart", interval, start, end);
    phys_disk_chart("#phys-disk-chart", interval, start, end);
    virt_disk_chart("#virt-disk-chart", interval, start, end);
}

$(document).ready(function() {
    // load the default charts
    bad_event_histogram_panel('#bad-event-chart');
    draw_host_presence_table('#host-presence-table');
    phys_cpu_chart("#phys-cpu-chart");
    virt_cpu_chart("#virt-cpu-chart");
    phys_mem_chart("#phys-mem-chart");
    virt_mem_chart("#virt-mem-chart");
    phys_disk_chart("#phys-disk-chart");
    virt_disk_chart("#virt-disk-chart");
    vcpu_graph('day', '#vcpu-graph');

});

$("#cockpitUpdateButton").click(function() {

    var dates = _getFormDates();
    var start = dates[0];
    var end = dates[1];
    var intervalUnit = $("select#cockpitIntervalUnit").val();
    var interval = "1".concat(intervalUnit.substring(0,1));
    refreshCharts(interval, start, end);
});


$("#hostPresenceButton").click(function() {
    var dates = _getFormDates();
    var start = dates[0];
    var end = dates[1];
    var presenceUnit = $("select#hostPresenceUnit").val();
    var presenceQty = $("input#hostPresenceQty").val();
    presenceQty = typeof presenceQty !== 'defined'? 1 : presenceQty;
    console.log("calling presence refresh with [start=" + start + ", end=" + end + ", qty = " + presenceQty + ", unit = "+ presenceUnit + "]");
    refreshHostPresence(presenceQty, presenceUnit, start, end);
});