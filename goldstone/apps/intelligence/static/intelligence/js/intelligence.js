Date.prototype.addMinutes = function (m) {
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
}

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

Date.prototype.addDays = function (d) {
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
    return this;
}

Date.prototype.addWeeks = function (d) {
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000));
    return this;
}

function draw_cockpit_panel(interval, location, end) {

    end = typeof end !== 'undefined' ? new Date(Number(end) * 1000) : new Date();

    console.log("draw_cockpit_panel called with [interval, location, end] = ["+
        interval+","+location+","+end+"]");

    /*$("#loading-indicator").show();
    $("#loading-indicator").position({
        my: "center",
        at: "center",
        of: location
    });*/

    var xUnitInterval = function (interval) {
        if (interval == 'minute') {
            return d3.time.seconds;
        } else if (interval == 'hour') {
            return d3.time.minutes;
        } else if (interval == 'day') {
            return d3.time.hours;
        } else if (interval == 'month') {
            return d3.time.days;
        } else {
            raiseDanger("Valid intervals are 'month', 'day', " +
                "'hour', and 'minute'")
            return d3.time.seconds;
        }
    }


    var click_renderlet = function (_chart) {
        _chart.selectAll("rect.bar").on("click", function (d) {
            // load the log search page with chart and table set
            // to this range.
            var start = new Date(d.data.key);
            var end = new Date(start);
            var new_interval;

            if (interval === 'hour') {
                end.addMinutes(1);
                new_interval = 'minute';
            } else if (interval === 'day') {
                end.addHours(1);
                new_interval = 'hour';
            } else if (interval === 'month') {
                end.addDays(1);
                new_interval = 'day';
            } else if (interval === 'minute') {
                new_interval = 'seconds';
                end.addMinutes(1);
            }

            var uri = '/intelligence/search?start_time='.
                concat(String(Math.round(start.getTime() / 1000)),
                    "&end_time=", String(Math.round(end.getTime() / 1000)),
                    "&interval=", new_interval);
            window.location.assign(uri);
        });
    };

    var panelWidth = $(location).width();
    var panelHeight = 300;
    var margin = {top: 30, right: 30, bottom: 60, left: 50};

    var start = new Date(end);
    if (interval === 'hour') {
        start.addHours(-1);
    } else if (interval === 'day') {
        start.addDays(-1);
    } else if (interval === 'month') {
        start.addWeeks(-4);
    } else if (interval === 'minute') {
        start.addMinutes(-1);
    }
    var uri = "/intelligence/log/cockpit/data?start_time=".
        concat(String(Math.round(start.getTime() / 1000)),
            "&end_time=", String(Math.round(end.getTime() / 1000)),
            "&interval=", interval);

    d3.json(uri, function (error, events) {

        if (events.data.length == 0) {
            $(location).html("<h2>No log data found.<h2>");
        } else {
            events.data.forEach(function (d) {
                d.time = new Date(d.time);
                d.count = +d.count;
            });

            var xf = crossfilter(events.data);
            var comps = events.components;
            var timeDim = xf.dimension(function (d) {
                return d.time;
            });

            var eventsByTime = timeDim.group().reduce(
                function (p, v) {
                    if (v.loglevel === 'error') {
                        p.errorEvents += v.count;
                    } else {
                        p.warnEvents += v.count;
                    }
                    return p;
                },
                function (p, v) {
                    if (v.loglevel === 'error') {
                        p.errorEvents -= v.count;
                    } else {
                        p.warnEvents -= v.count;
                    }
                    return p;
                },
                function () {
                    return {
                        errorEvents: 0,
                        warnEvents: 0
                    };
                }
            );

            var minDate = timeDim.bottom(1)[0].time;
            var maxDate = timeDim.top(1)[0].time;
            console.log("in draw_log_cockpit, panelWidth = " + panelWidth);
            var logChart = dc.barChart(location);
            logChart
                .width(panelWidth)
                .height(panelHeight)
                .margins(margin)
                .dimension(timeDim)
                .group(eventsByTime, "Warning Events")
                .valueAccessor(function (d) {
                    return d.value.warnEvents;
                })
                .stack(eventsByTime, "Error Events", function (d) {
                    return d.value.errorEvents;
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .xUnits(xUnitInterval(interval))
                .renderHorizontalGridLines(true)
                .centerBar(true)
                .elasticY(true)
                .brushOn(false)
                .renderlet(click_renderlet)
                .legend(dc.legend().x(100).y(10))
                .title(function (d) {
                    return d.key
                        + "\n\n" + d.value.errorEvents + " ERRORS"
                        + "\n\n" + d.value.warnEvents + " WARNINGS";
                });

            logChart.render();
            //$("#loading-indicator").hide();
        }

    });
}

function vcpu_graph(interval, location, end, start) {

    interval = typeof interval !== 'undefined' ?
        interval :
        'month';

    end = typeof end !== 'undefined' ?
        new Date(Number(end) * 1000) :
        new Date();

    if (typeof start === 'undefined') {
        start = new Date(end);

        if (interval === 'month') {
            start.addWeeks(-4);
        } else if (interval === 'day') {
            start.addDays(-1);
        } else if (interval === 'hour') {
            start.addHours(-1);
        } else if (interval === 'minute') {
            start.addMinutes(-1);
        }
    } else {
        start = new Date(Number(start) * 1000)
    }

    console.log("vcpu_graph called with [interval, location, start, end] = ["+
        interval+","+location+","+start+","+end+"]");

    /*$("#loading-indicator").show();
    $("#loading-indicator").position({
        my: "center",
        at: "center",
        of: location
    });*/

    var xUnitInterval = function (interval) {
        if (interval == 'minute') {
            return d3.time.seconds;
        } else if (interval == 'hour') {
            return d3.time.minutes;
        } else if (interval == 'day') {
            return d3.time.hours;
        } else if (interval == 'month') {
            return d3.time.days;
        } else {
            raiseDanger("Valid intervals are 'month', 'day', " +
                "'hour', and 'minute'")
            return d3.time.days;
        }
    }

    var panelWidth = $(location).width();
    var panelHeight = 300;
    var margin = {top: 30, right: 30, bottom: 60, left: 50};

    var vcpuChart = dc.barChart(location);

    var uri = "/intelligence/compute/vcpu_stats?start_time=".
        concat(String(Math.round(start.getTime() / 1000)),
            "&end_time=", String(Math.round(end.getTime() / 1000)));


    d3.json(uri, function (error, events) {

        console.log("events = " + JSON.stringify(events))
        if (events.length == 0) {
            $(location).html("<h2>No vCPU data found.<h2>");
        } else {
            events.forEach(function (d) {
                d.time = Date.parse(d['@timestamp']);
                //console.log("date = " + d.time + ", total_vcpus = " + d['_source']['total_vcpus'])
                d.active_vcpus = +d.active_vcpus;
                d.total_vcpus = +d.total_vcpus;
                //d.host = d._source.host
            });

            var xf = crossfilter(events);
            var timeDim = xf.dimension(function (d) {
                //console.log("Using time dimension of "+xUnitInterval(interval))
                return xUnitInterval(interval);
            });

            var hostDim = xf.dimension(function (d) {
                return d.host;
            });

            var hosts = hostDim.top(Infinity);

            var vcpuGroup = timeDim.group().reduce(
                // called when data is added to xf.
                function (p, v) {
                    console.log("*************** on enter ***************");
                    console.log("v.host: " + JSON.stringify(v.host));
                    console.log("p[total_vcpus]: " + JSON.stringify(p.total_vcpus));
                    console.log("p[active_vcpus]: " + JSON.stringify(p.active_vcpus));
                    console.log("p[" + v.host + "]: " + JSON.stringify(p[v.host]));
                    p.total_vcpus = p.total_vcpus - p[v['host']].avg_total;
                    p.active_vcpus = p.active_vcpus - p[v['host']].avg_active;
                    p[v['host']].count++;
                    p[v['host']].sum_total += v.total_vcpus;
                    p[v['host']].sum_active += v.active_vcpus;
                    p[v['host']].avg_total = p[v['host']].sum_total / p[v['host']].count;
                    p[v['host']].avg_active = p[v['host']].sum_active / p[v['host']].count;
                    p.total_vcpus = p.total_vcpus + p[v['host']].avg_total;
                    p.active_vcpus = p.active_vcpus + p[v['host']].avg_active;
                    console.log("*************** on exit ***************");
                    console.log("p[total_vcpus]: " + JSON.stringify(p.total_vcpus));
                    console.log("p[active_vcpus]: " + JSON.stringify(p.active_vcpus));
                    console.log();
                    console.log();
                    return p;
                },
                // called when data is removed from xf.
                function (p, v) {
                    console.log("*************** on enter ***************");
                    console.log("v.host: " + JSON.stringify(v.host));
                    console.log("p[total_vcpus]: " + JSON.stringify(p.total_vcpus));
                    console.log("p[active_vcpus]: " + JSON.stringify(p.active_vcpus));
                    console.log("p[" + v.host + "]: " + JSON.stringify(p[v.host]));
                    p.total_vcpus = p.total_vcpus - p[v['host']].avg_total;
                    p.active_vcpus = p.active_vcpus - p[v['host']].avg_active;
                    p[v['host']].count--;
                    p[v['host']].sum_total -= v.total_vcpus;
                    p[v['host']].sum_active -= v.active_vcpus;
                    if (p[v['host']].count <= 0) {
                        p[v['host']].avg_total = 0;
                        p[v['host']].avg_active = 0;
                    } else {
                        p[v['host']].avg_total = p[v['host']].sum_total / p[v['host']].count;
                        p[v['host']].avg_active = p[v['host']].sum_active / p[v['host']].count;
                    }
                    p.total_vcpus = p.total_vcpus + p[v['host']].avg_total;
                    p.active_vcpus = p.active_vcpus + p[v['host']].avg_active;
                    console.log("*************** on exit ***************");
                    console.log("p[total_vcpus]: " + JSON.stringify(p.total_vcpus));
                    console.log("p[active_vcpus]: " + JSON.stringify(p.active_vcpus));
                    console.log();
                    console.log();
                    return p;
                },
                // initialize p.  would like to keep track of avg and max for each host
                // that appears in the time slice.
                function () {
                    var p = {};
                    for (var i = 0; i < hosts.length; i++) {
                        //console.log("in outer reduce:init, hosts["+i+"] = " + JSON.stringify(hosts[i]))
                        p[hosts[i]['host']] = {
                            'count': 0,
                            'avg_total': 0,
                            'sum_total': 0,
                            'avg_active': 0,
                            'sum_active': 0
                        };
                        p['total_vcpus'] = 0;
                        p['active_vcpus'] = 0;
                    }
                    ;
                    return p;
                });

            console.log("totalVcpuGroup #groups = " + vcpuGroup.size());
            console.log("in draw_vcpu_graph, panelWidth = " + panelWidth);
            var minDate = timeDim.bottom(1)[0].time;
            var maxDate = timeDim.top(1)[0].time;

            console.log("minDate = " + new Date(minDate) + ", maxDate = " + new Date(maxDate))

            vcpuChart
                .width(panelWidth)
                .height(panelHeight)
                .margins(margin)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .xUnits(xUnitInterval(interval))
                .brushOn(false)
                //.yAxisLabel("vCPUs")
                .dimension(timeDim)
                .group(vcpuGroup, "Total vCPUs")
                .valueAccessor(function (d) {
                    //console.log("in valueAccessor, returning total = " + d.value.total_vcpus);
                    return d.value.total_vcpus;
                })
                .stack(vcpuGroup, "Active vCPUs", function (d) {
                    //console.log("in valueAccessor, returning active = " + d.value.active_vcpus);
                    return d.value.active_vcpus;
                })
                .renderHorizontalGridLines(true)
                .centerBar(true)
                .elasticY(true)
                .legend(dc.legend().x(100).y(10))
                .title(function (d) {
                    return d.key
                        + "\n\n" + d.value.total_vcpus + " total vCPUs"
                        + "\n\n" + d.value.active_vcpus + " active vCPUs";
                });

            vcpuChart.render();

            //$("#loading-indicator").hide();
        }

    });

}


function draw_search_table(start, end, location) {

    var uri = "/intelligence/log/search/data/".concat(String(start), "/", String(end));
    var oTableParams = {
        "bProcessing": true,
        "bServerSide": true,
        "sAjaxSource": uri,
        "bPaginate": true,
        "bFilter": true,
        "bSort": true,
        "bInfo": false,
        "bAutoWidth": true,
        "bLengthChange": true,
        "aoColumnDefs": [
            { "bVisible": false, "aTargets": [ 5, 6, 7, 8, 9, 10 ] },
            { "sName": "timestamp", "aTargets": [ 0 ] },
            { "sType": "date", "aTargets": [0] },
            { "sName": "loglevel", "aTargets": [ 1 ] },
            { "sName": "component", "aTargets": [ 2 ] },
            { "sName": "host", "aTargets": [ 3 ] },
            { "sName": "message", "aTargets": [ 4 ] },
            { "sName": "location", "aTargets": [ 5 ] },
            { "sName": "pid", "aTargets": [ 6 ] },
            { "sName": "source", "aTargets": [ 7 ] },
            { "sName": "request_id", "aTargets": [ 8 ] },
            { "sName": "type", "aTargets": [ 9 ] },
            { "sName": "received", "aTargets": [ 10 ] },
            { "sType": "date", "aTargets": [10] }
        ]
    }

    var oTable = $(location).dataTable(oTableParams);

    $(window).bind('resize', function () {
        oTable.fnAdjustColumnSizing();
    });
}

/*
 function updateWindow(){

 var panelWidth = $("#row3-full").width();
 var panelHeight = 300;
 var margin = {top: 30, right: 30, bottom: 30, left: 80},
 width = panelWidth - margin.left - margin.right,
 height = panelHeight - margin.top - margin.bottom;


 x = d3.time.scale().range([0, width]);
 x.domain(d3.extent(data, function(d) { return d.date; }));
 xAxis = d3.svg.axis().scale(x)
 .orient("bottom").ticks(5);

 console.log("adjusted width = " + panelWidth);
 console.log("adjusted height = " + panelHeight);
 svg.attr("width", panelWidth)
 .attr("height", panelHeight);
 svg.select(".x.axis")
 .call(xAxis);
 svg.select(".line")
 .attr("d", valueLine(data));

 }

 window.onresize = updateWindow;

 */