var panelWidth = $("#d3-panel-body").width();
var panelHeight = 300;
var margin = {top: 30, right: 0, bottom: 30, left: 50},
    width = panelWidth - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;


function draw_cockpit_panel() {

    var chart = dc.bubbleChart("#d3-panel-body");

    var log_data = d3.json("intelligence/log-cockpit-data", function (error, events) {
        var xf = crossfilter(events.data);
        var comps = events.components;
        console.log("components = ");
        console.log(JSON.stringify(comps, null, 4));
        var timeDim = xf.dimension(function (d) {
            return [d.time, d.component];
        });
        var compDim = xf.dimension(function (d) {
            return comps.indexOf(d.component);
        });
        //var compGroup = compDim.group();
        var compGroup = timeDim.group(function (d) {
            console.log("compGroup, d = ", JSON.stringify(d));
            return [d[0], d[1]];
        });
        //var timeGroup = compDim.group(function (d) {
        //    console.log("timeGroup, d = ", JSON.stringify(d));
        //    return comps.indexOf(d[1]);
        //});
        console.log('compGroup.top(Infinity): ');
        console.log(JSON.stringify(compGroup.top(Infinity)));

        var heatColorRange = ["#fafafa", '#f58f24'];
        var heatColorDomain = [0, d3.max(compGroup.top(Infinity).map(function(d) {
            JSON.stringify(d);
            return d.x; }))];
        var heatColorMapping = d3.scale.linear().domain(heatColorDomain).range(heatColorRange);

        var minDate = timeDim.bottom(1)[0].time;
        var maxDate = timeDim.top(1)[0].time;
        console.log("minDate =", JSON.stringify(minDate))
        console.log("maxDate =", JSON.stringify(maxDate))

        chart
            .width(width)
            .height(height)
            .margins({ top: 40, right: 40, bottom: 40, left: 40 })
            .dimension(timeDim)
            .group(compGroup)
            .keyAccessor(function (d) {
                console.log("in keyAccessor, d=")
                console.log(JSON.stringify(d))
                return d.key[0]; })
            .valueAccessor(function (d) {
                console.log("in valueAccessor, d=")
                console.log(JSON.stringify(d))
                return d.key[1]; })
            .radiusValueAccessor(function (d) {
                return 1;
            })
            .title(function(d) {
                return "Time:   " + d.key[0] + "\n" +
                    "Component:  " + d.key[1] + "\n"
                    })
            .colorAccessor(function (d) { return d.key[0]; })
            .colors(heatColorMapping)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .render();
    });

    /*   d3.json(view_data.data, function(error, logs) {

     var ndx = crossfilter(logs),
     runDim = ndx.dimension(function(d) { return [+d.time, +d.component]; })
     //runGroup = runDim.group().reduceSum(function(d) { return +d.Speed; })
     ;



     chart
     .width(width)
     .height(height)
     .dimension(runDim)
     //.group(runGroup)
     .keyAccessor(function(d) { return +d.key[0]; })
     .valueAccessor(function(d) { return +d.key[1]; })
     .colorAccessor(function(d) { return +d.value; })
     .title(function(d) {
     return "Time:   " + d.key[0] + "\n" +
     "Component:  " + d.key[1] + "\n" +
     "Count: " + d.value + " " + d.type;})
     .colors(["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"])
     .calculateColorDomain();

     chart.render();
     });*/
}

/*
 function updateWindow(){

 panelWidth = $("#d3-panel-body").width()
 width = panelWidth - margin.left - margin.right;

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
