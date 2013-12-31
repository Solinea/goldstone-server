
var panelWidth = $("#d3-panel-body").width()
var panelHeight = 300

console.log("initial width = " + panelWidth)
console.log("initial height = " + panelHeight)

var margin = {top: 30, right: 30, bottom: 30, left: 50},
    width = panelWidth - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var arrData = [
   {
    "date": "01-Aug-13",
    "close": 37.92625
},
{
    "date": "02-Aug-13",
    "close": 39.19708333
},
{
    "date": "03-Aug-13",
    "close": 44.13875
},
{
    "date": "04-Aug-13",
    "close": 43.15
},
{
    "date": "05-Aug-13",
    "close": 34.765
}];

var parseDate = d3.time.format("%d-%b-%y").parse;

var x = d3.time.scale().range([0, width]);
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var y = d3.scale.linear().range([height, 0]);
var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

var valueLine = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

// Adds the svg canvas

var	svg = d3.select("#d3-panel-body")
	.append("svg")
	.attr("width", panelWidth)
	.attr("height", panelHeight)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data = arrData.map(function(d) {
        return {
            date: parseDate(d["date"]),
            close: +d["close"]
        };
});


// Scale the range of the data
x.domain(d3.extent(data, function(d) { return d.date; }));
y.domain([0, d3.max(data, function(d) { return d.close; })]);

// Add the value line path.
svg.append("path")
    .attr("class", "line")
    .attr("d", valueLine(data));

// Add the X Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the Y Axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

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