
var panelWidth = $("#d3-panel-body").width();
var panelHeight = 300;
var margin = {top: 30, right: 30, bottom: 30, left: 50},
width = panelWidth - margin.left - margin.right,
height = 300 - margin.top - margin.bottom;


function draw_cockpit_panel(view_data) {

    var chart = dc.bubbleChart("#d3-panel-body");

    var log_data = view_data.data

    alert("log_data[0] = time:"+log_data[0].time + " component:" + log_data[0].component + " type: " + log_data[0].type + " count:" + log_data[0].count)

    var ndx = crossfilter(log_data)
    var runDim = ndx.dimension(function(d){
            return d.time;
        });
    var runGroup = runDim.group().reduceSum(function(d){
                                return d.count;
                            });

    chart
        .width(width)
        .height(height)
        .dimension(runDim)
        .group(runGroup);

    chart.render();

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
