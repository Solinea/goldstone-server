$(document).ready(function() {
    draw_cockpit_panel('month', '#log-cockpit-graph');
    vcpu_graph('day', '#vcpu-graph');

    // activate the interval buttons

    $("#log-cockpit-month-btn").click(function() {
        draw_cockpit_panel("month", "#log-cockpit-graph");
    });
    $("#log-cockpit-day-btn").click(function() {
        draw_cockpit_panel("day", "#log-cockpit-graph");
    });
    $("#log-cockpit-hour-btn").click(function() {
        draw_cockpit_panel("hour", "#log-cockpit-graph");
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