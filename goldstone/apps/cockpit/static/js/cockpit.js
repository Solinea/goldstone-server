$(document).ready(function() {
    bad_event_histogram_panel('month', '#bad-event-chart');
    vcpu_graph('day', '#vcpu-graph');

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
}); 