
var panelWidth = $("#d3-panel-body").width();
var panelHeight = 300;
var margin = {top: 30, right: 30, bottom: 30, left: 50},
width = panelWidth - margin.left - margin.right,
height = 300 - margin.top - margin.bottom;


function draw_cockpit_panel(view_data) {

    alert("in draw_cockpit_panel");
    alert("xdata=" + view_data.xdata);

    //console.log("initial width = " + panelWidth)
    //console.log("initial height = " + panelHeight)

    var chart = dc.heatMap("#d3-panel-body");

    d3.csv(view_data.datafile, function(error, experiments) {

      var ndx = crossfilter(experiments),
          runDim = ndx.dimension(function(d) { return [+d.Run, +d.Expt]; }),
          runGroup = runDim.group().reduceSum(function(d) { return +d.Speed; });

      chart
        .width(width)
        .height(height)
        .dimension(runDim)
        .group(runGroup)
        .keyAccessor(function(d) { return +d.key[0]; })
        .valueAccessor(function(d) { return +d.key[1]; })
        .colorAccessor(function(d) { return +d.value; })
        .title(function(d) {
            return "Run:   " + d.key[0] + "\n" +
                   "Expt:  " + d.key[1] + "\n" +
                   "Speed: " + (299000 + d.value) + " km/s";})
        .colors(["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"])
        .calculateColorDomain();

      chart.render();
    });
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
