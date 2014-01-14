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

function draw_cockpit_panel(interval, location) {

    $("#log-cockpit-loading-indicator").show();
    $("#log-cockpit-loading-indicator").position({
        my: "center",
        at: "center",
        of: location
    });

    var xUnitInterval = function (interval) {
        if (interval == 'hour') {
            return d3.time.minutes
        } else if (interval == 'day') {
            return d3.time.hours
        } else if (interval == 'month') {
            return d3.time.days
        } else {
            return None
        }
    }


    var click_renderlet = function (_chart) {
        _chart.selectAll("rect.bar").on("click", function (d) {
            // load the log search page with chart and table set
            // to this range.
            var start = new Date(d.data.key);
            var end = new Date(start);

            if (interval == 'hour') {
                end.addMinutes(1);
            } else if (interval == 'day') {
                end.addHours(1);
            } else if (interval == 'month') {
                end.addDays(1);
            }

            $(document).ready(draw_search_table(start, end, '#log-search-table'));

            console.log("onClick called.  interval = " + interval + ", start= " + JSON.stringify(start) + ", end = " + JSON.stringify(end));
        });
    };

    var panelWidth = $(location).width();
    var panelHeight = 300;
    var margin = {top: 30, right: 30, bottom: 30, left: 80},
        width = panelWidth - margin.left - margin.right,
        height = panelHeight - margin.top - margin.bottom;

    var chart = dc.barChart(location);

    d3.json("intelligence/log/cockpit/data/" + interval, function (error, events) {

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

            chart
                .width(width)
                .height(height)
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

            chart.render();
            $("#log-cockpit-loading-indicator").hide();
        }

    });
}


function draw_search_table(start, end, location) {

    // set up the search screen
    paint_search_screen();
    var target = paint_search_result_thead();
    console.log("target width = " + $(target).width());
    console.log("target height = " + $(target).height());

    var uri = "/intelligence/log/search/data/".concat(String(start.getTime()), "/", String(end.getTime()));

    var table_params = {
        "bProcessing": true,
        "bServerSide": true,
        "sAjaxSource": uri,
        "bPaginate": true,
        "bFilter": false,
        "bSort": false,
        "bInfo": true,
        "bAutoWidth": true,
        "bLengthChange": true
    }

    $(location).dataTable(table_params);
}

function paint_search_screen() {
    $('#body-container').empty();
    $('#body-container').append('<div id="search-head"><p>This is the search head<p></div>');
    $('#body-container').append('<div id="search-result"><p>This is the search result<p></div>');
}

function paint_search_result_thead() {
    $('#search-result').html('<div id="intel-search-data-table">' +
        '<table class="table table-hover" id="log-search-table">' +
            '<thead>' +
                '<tr class="header">' +
                    '<th>Timestamp</th>' +
                    '<th>Host</th>' +
                    '<th>Level</th>' +
                    '<th>Component</th>' +
                    '<th>Message</th>' +
                '</tr>' +
            '</thead>' +
        '</table>' +
    '</div>');
    return '#log-search-table'
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