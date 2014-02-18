$(document).ready(function() {
    bad_event_histogram_panel('month', '#bad-event-chart');
    vcpu_graph('day', '#vcpu-graph');
    draw_host_presence_table('#host-presence-table');
    phys_cpu_chart("#phys-cpu-chart");
    virt_cpu_chart("#virt-cpu-chart");
    phys_mem_chart("#phys-mem-chart");
    virt_mem_chart("#virt-mem-chart");
    phys_disk_chart("#phys-disk-chart");
    virt_disk_chart("#virt-disk-chart");

    // activate the interval buttons

    $("#bad-event-month-btn").click(function() {
        bad_event_histogram_panel("month", "#bad-event-chart");
    });
    $("#bad-event-day-btn").click(function() {
        bad_event_histogram_panel("day", "#bad-event-chart");
    });
    $("#bad-event-hour-btn").click(function() {
        bad_event_histogram_panel("hour", "#bad-event-chart");
    });


    $("#vcpu-cockpit-month-btn").click(function() {
        vcpu_graph("day", "#vcpu-graph");
    });
    $("#vcpu-cockpit-day-btn").click(function() {
        vcpu_graph("hour", "#vcpu-graph");
    });
    $("#vcpu-cockpit-hour-btn").click(function() {
        vcpu_graph("minute", "#vcpu-graph");
    });

    $("#submit-host-presence").click(function() {
        console.log("handling submit-host-presence click");
        var lookbackNum = $("input#lookbackNum").val();
        var lookbackUnit = $("select#lookbackUnit").val();
        var comparisonNum = $("input#comparisonNum").val();
        var comparisonUnit = $("select#comparisonUnit").val();
        console.log("lookbackNum="+lookbackNum+", lookbackUnit="+lookbackUnit);
        console.log("comparisonNum="+comparisonNum+", comparisonUnit="+comparisonUnit);
        draw_host_presence_table('#host-presence-table',
           lookbackNum, lookbackUnit, comparisonNum, comparisonUnit);
    })
}); 