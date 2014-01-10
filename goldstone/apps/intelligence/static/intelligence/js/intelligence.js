function draw_cockpit_panel(interval) {

    var panelWidth = $("#row2-full").width();
    var panelHeight = 300;
    var margin = {top: 30, right: 30, bottom: 30, left: 80},
    width = panelWidth - margin.left - margin.right,
    height = panelHeight - margin.top - margin.bottom;

    var chart = dc.barChart("#r2-log-graph");

    var log_data = d3.json("intelligence/log/cockpit/data/" + interval, function (error, events) {
        console.log("events = ", JSON.stringify(events, null, 4));
        if (events.data.length == 0) {
            alert("No log data found.");
        } else {
            events.data.forEach(function (d) {
                d.time = new Date(d.time);
                d.errors = +d.errors;
                d.warnings = +d.warnings;

            });

            var xf = crossfilter(events.data);
            var comps = events.components;
            //console.log("components = ", JSON.stringify(comps, null, 4));

            var timeDim = xf.dimension(function (d) {
                return d.time;
            });

            var eventsByTime = timeDim.group().reduce(
                    function(p, v) {
                        //console.log("p = ", JSON.stringify(p))
                        //console.log("v = ", JSON.stringify(v))
                        p.errorEvents += v.errors;
                        p.warnEvents += v.warnings;
                        p.errorEvents && p.errorComps.push(v.component)
                        p.warnEvents && p.warnComps.push(v.component)
                        return p;
                    },
                    function(p, v) {
                        //console.log("p = ", JSON.stringify(p))
                        //console.log("v = ", JSON.stringify(v))
                        p.errorEvents -= v.errors;
                        p.warnEvents -= v.warnings;
                        p.errorEvents && p.errorComps.pop(v.component);
                        p.warnEvents && p.warnComps.pop(v.component);
                        return p;
                    },
                    function() {
                        return {
                            errorEvents:0,
                            warnEvents:0,
                            errorComps: [],
                            warnComps: []
                        };
                    }
            );

            var minDate = timeDim.bottom(1)[0].time;
            var maxDate = timeDim.top(1)[0].time;

            //console.log("raw minDate = %d" % minDate)
            //console.log("raw maxDate = %d" % maxDate)
            console.log("minDate =", JSON.stringify(new Date(minDate)))
            console.log("maxDate =", JSON.stringify(new Date(maxDate)))

            chart
                .width(width)
                .height(height)
                .margins(margin)
                .dimension(timeDim)
                .group(eventsByTime, "Warning Events")
                .valueAccessor(function(d) {
                    return d.value.warnEvents;
                })
                .stack(eventsByTime, "Error Events", function(d){
                    //console.log("in stack, d=", JSON.stringify(d))
                    return d.value.errorEvents;}
                )
                .x(d3.time.scale().domain([minDate, maxDate]))
                .xUnits(d3.time.days)
                .renderHorizontalGridLines(true)
                .centerBar(true)
                .elasticY(true)
                .brushOn(false)
                .legend(dc.legend().x(100).y(10))
                .title(function(d){
                    return d.key
                            + "\n\n" + d.value.errorEvents + " ERRORS from: "
                            + JSON.stringify(d.value.errorComps)
                            + "\n\n" + d.value.warnEvents + " WARNINGS from: "
                            + JSON.stringify(d.value.warnComps);
                })
                .xAxis().ticks(7);

            chart.render();
        }

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