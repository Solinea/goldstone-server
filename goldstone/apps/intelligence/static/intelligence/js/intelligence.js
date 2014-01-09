var panelWidth = $("#row2-full").width();
var panelHeight = 300;
var margin = {top: 30, right: 30, bottom: 30, left: 80},
    width = panelWidth - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;


function draw_cockpit_panel() {

    var chart = dc.heatMap("#log-graph");

    var log_data = d3.json("intelligence/log-cockpit-data", function (error, events) {
        var xf = crossfilter(events.data);
        var comps = events.components;
        console.log("components = ");
        console.log(JSON.stringify(comps, null, 4));
        var timeDim = xf.dimension(function (d) {
            return [new Date(+d.time), d.component, d.count, d.type];
        });
        var countGroup = timeDim.group().reduceSum(function(d) { return comps.indexOf(d.component) + 1; });
        console.log('group.top(Infinity): ');
        console.log(JSON.stringify(countGroup.top(Infinity)));

        //var heatColorRange = ["#fafafa", '#f58f24'];
        var heatColorRange = ["#ffeda0", '#f03b20'];
        var heatColorDomain = [0, d3.max(countGroup.top(Infinity).map(function(d) {
            return d.key[2]; }))];
        console.log("heatColorDomain=", JSON.stringify(heatColorDomain))
        var heatColorMapping = d3.scale.linear().domain(heatColorDomain).range(heatColorRange);

        var minDate = timeDim.bottom(1)[0].time;
        var maxDate = timeDim.top(1)[0].time;
        console.log("minDate =", JSON.stringify(minDate))
        console.log("maxDate =", JSON.stringify(maxDate))

        chart
            .width(width)
            .height(height)
            .margins(margin)
            .dimension(timeDim)
            .group(countGroup)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .xAxisLabel("Time")
            .yAxisLabel("Components")
            .keyAccessor(function (d) {
                console.log("in keyAccessor, d=",JSON.stringify(d),", returning: ", d.key[0]);
                return d.key[0]; })
            .valueAccessor(function (d) {
                console.log("in valueAccessor, d=",JSON.stringify(d),", returning: ", d.value);
                return d.value; })
            .title(function(d) {
                console.log("in title, d=", JSON.stringify(d))
                return("Time:   " + d.key[0] + "\n" +
                    "Component:  " + comps[d.value] + "\n" +
                    "Count:  " + d.key[2] + "\n");
                    })

            .colorAccessor(function (d) { return d.key[2]; })
            .colors(heatColorMapping);

        chart.xAxis().ticks(5);
        chart.yAxis().tickFormat(function(d) {
            console.log("in tickFormat, d=", JSON.stringify(d));
            return comps[+d - 1]; });
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
