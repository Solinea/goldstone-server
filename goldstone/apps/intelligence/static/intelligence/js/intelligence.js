var panelWidth = $("#row2-full").width();
var panelHeight = 300;
var margin = {top: 30, right: 0, bottom: 30, left: 50},
    width = panelWidth - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;


function draw_cockpit_panel() {

    var chart = dc.bubbleChart("#log-graph");

    var log_data = d3.json("intelligence/log-cockpit-data", function (error, events) {
        var xf = crossfilter(events.data);
        var comps = events.components;
        console.log("components = ");
        console.log(JSON.stringify(comps, null, 4));
        var timeDim = xf.dimension(function (d) {
            return [new Date(+d.time), d.component, d.count];
        });
        var countGroup = timeDim.group().reduceSum(function(d) { return comps.indexOf(d.component); });
        console.log('group.top(Infinity): ');
        console.log(JSON.stringify(countGroup.top(Infinity)));

        var heatColorRange = ["#fafafa", '#f58f24'];
        var heatColorDomain = [0, d3.max(countGroup.top(Infinity).map(function(d) {
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
            .group(countGroup)
            .keyAccessor(function (d) {
                console.log("in keyAccessor, d=",JSON.stringify(d),", returning: ", d.key[0]);
                return d.key[0]; })
            .valueAccessor(function (d) {
                console.log("in valueAccessor, d=",JSON.stringify(d),", returning: ", d.value);
                return d.value; })
            .radiusValueAccessor(function (d) {
                console.log("in radiusAccessor, d=",JSON.stringify(d),", returning: ", d.key[2]);
                return(d.key[2]*0.1); })
            .yAxisLabel("Component")
            .title(function(d) {
                console.log("in title, d=", JSON.stringify(d))
                return("Time:   " + d.key[0] + "\n" +
                    "Component:  " + comps[d.value] + "\n" +
                    "Count:  " + d.key[2] + "\n");
                    })
            .maxBubbleRelativeSize(0.1)
            /*.colorAccessor(function (d) { return d.key[0]; })
            .colors(heatColorMapping)*/
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
