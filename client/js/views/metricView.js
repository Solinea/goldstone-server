/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
Instantiated in metricViewerView similar to:

this.metricChart = new MetricViewCollection({
    url: url
});

this.metricChartView = new MetricView({
    collection: this.metricChart,
    height: 320,
    el: '.metric-chart-instance' + this.options.instance,
    width: $('.metric-chart-instance' + this.options.instance).width()
});
*/

// view is linked to collection when instantiated

var MetricView = GoldstoneBaseView.extend({

    margin: {
        top: 40,
        right: 15,
        bottom: 30,
        left: 60
    },

    instanceSpecificInit: function() {

        this.processOptions();
        this.processListeners();
        this.render();
        this.setSpinner();
        this.standardInit();
    },

    standardInit: function() {

        /*
        D3.js convention works with the setting of a main svg, a sub-element
        which we call 'chart' which is reduced in size by the amount of the top
        and left margins. Also declares the axes, the doubleclick mechanism,
        and the x and y scales, the axis details, and the chart colors.
        */

        var ns = this;
        var self = this;

        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width)
            .attr("height", ns.height);

        ns.chart = ns.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + ns.margin.left + "," + (ns.margin.top + 10) + ")");

        ns.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        ns.x = d3.time.scale()
            .rangeRound([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        // initialize the axes
        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .ticks(5)
            .orient("bottom");

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.colorArray = new GoldstoneColors().get('colorSets');
    },

    update: function() {
        var ns = this;
        var self = this;
        var data = this.collection.toJSON()[0];
        json = this.dataPrep(data.per_interval);
        ns.statToChart = this.collection.statistic || 'band';
        ns.standardDev = this.collection.standardDev || 0;
        var mw = ns.mw;
        var mh = ns.mh;

        this.hideSpinner();
        $(this.el).find('text').remove();
        $(this.el).find('svg').find('.chart').html('');
        // prevents 'stuck' d3-tip on svg element.
        $('body').find('#' + this.el.slice(1) + '.d3-tip').remove();

        if (this.checkReturnedDataSet(json) === false) {
            return;
        }

        // append y axis label
        ns.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (ns.height / 2))
            .attr("y", -11)
            .attr("dy", "1.5em")
        // returned by metric api call
        .text(data.units[0])
            .style("text-anchor", "middle");

        ns.y.domain([0, d3.max(json, function(d) {
            var key = _.keys(d).toString();

            if (ns.standardDev === 1) {
                // add 10% breathing room to y axis domain
                return d[key].stats.std_deviation_bounds.upper * 1.1;
            } else {
                // add 10% breathing room to y axis domain
                return d[key].stats.max * 1.1;
            }
        })]);

        json.forEach(function(d) {
            // careful as using _.keys after this
            // will return [timestamp, 'time']
            d.time = moment(+_.keys(d)[0]);

            // which is why .filter is required here:
            var key = _.keys(d).filter(function(item) {
                return item !== "time";
            }).toString();
            d.min = d[key].stats.min || 0;
            d.max = d[key].stats.max || 0;
            d.avg = d[key].stats.avg || 0;
            d.stdHigh = d[key].stats.std_deviation_bounds.upper || 0;
            d.stdLow = d[key].stats.std_deviation_bounds.lower || 0;
        });

        ns.x.domain(d3.extent(json, function(d) {
            return d.time;
        }));

        var area = d3.svg.area()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y0(function(d) {
                return ns.y(d.min);
            })
            .y1(function(d) {
                return ns.y(d.max);
            });

        var maxLine = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.max);
            });

        var minLine = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.min);
            });

        var avgLine = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.avg);
            });

        var stdHigh = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.stdHigh);
            });

        var stdLow = d3.svg.line()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return ns.x(d.time);
            })
            .y(function(d) {
                return ns.y(d.stdLow);
            });

        var hiddenBar = ns.chart.selectAll(this.el + ' .hiddenBar')
            .data(json);

        var hiddenBarWidth = mw / json.length;

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .attr('id', this.el.slice(1))
            .html(function(d) {
                return "<p>" + d.time.format() + "<br>Max: " + d.max.toFixed(2) +
                    "<br>Avg: " + d.avg.toFixed(2) + "<br>Min: " + d.min.toFixed(2) + "<p>";
            });

        // Invoke the tip in the context of your visualization

        ns.chart.call(tip);

        // initialize the chart lines

        if (ns.statToChart === 'band') {
            ns.chart.append("path")
                .datum(json)
                .attr("class", "area")
                .attr("id", "minMaxArea")
                .attr("d", area)
                .attr("fill", ns.colorArray.distinct[3][1]);
        }

        if (ns.statToChart === 'band' || ns.statToChart === 'min') {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'minLine')
                .attr('data-legend', "Min")
                .style("stroke", ns.colorArray.distinct[3][0])
                .datum(json)
                .attr('d', minLine);
        }

        if (ns.statToChart === 'band' || ns.statToChart === 'max') {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'maxLine')
                .attr('data-legend', "Max")
                .style("stroke", ns.colorArray.distinct[3][2])
                .datum(json)
                .attr('d', maxLine);
        }

        if (ns.statToChart === 'band' || ns.statToChart === 'avg') {
            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'avgLine')
                .attr('data-legend', "Avg")
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke", ns.colorArray.grey[0][0])
                .datum(json)
                .attr('d', avgLine);
        }

        if (ns.standardDev) {

            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'stdDevHigh')
                .attr('data-legend', "Std Dev High")
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke", ns.colorArray.distinct[4][1])
                .datum(json)
                .attr('d', stdHigh);

            ns.chart.append('path')
                .attr('class', 'line')
                .attr('id', 'stdDevLow')
                .attr('data-legend', "Std Dev Low")
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke", ns.colorArray.distinct[4][1])
                .datum(json)
                .attr('d', stdLow);
        }

        ns.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + mh + ')')
            .call(ns.xAxis);

        ns.chart.append('g')
            .attr('class', 'y axis')
            .call(ns.yAxis);

        var legend = ns.chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20,-38)")
            .call(d3.legend);

        // UPDATE
        // Update old elements as needed.

        // ENTER
        // Create new elements as needed.

        hiddenBar.enter()
            .append('g')
            .attr("transform", function(d, i) {
                return "translate(" + i * hiddenBarWidth + ",0)";
            });

        // ENTER + UPDATE
        // Appending to the enter selection expands the update selection to include
        // entering elements; so, operations on the update selection after appending to
        // the enter selection will apply to both entering and updating nodes.

        // hidden rectangle for tooltip tethering

        hiddenBar.append("rect")
            .attr('class', 'partialHiddenBar')
            .attr("id", function(d, i) {
                return "verticalRect" + i;
            })
            .attr("y", function(d) {
                return ns.y(d.max);
            })
            .attr("height", function(d) {
                return mh - ns.y(d.max);
            })
            .attr("width", hiddenBarWidth);

        // narrow guideline turns on when mouse enters hidden bar

        hiddenBar.append("rect")
            .attr("class", "verticalGuideLine")
            .attr("id", function(d, i) {
                return "verticalGuideLine" + i;
            })
            .attr("x", 0)
            .attr("height", mh)
            .attr("width", 1)
            .style("opacity", 0);

        // wide guideline with mouse event handling to show guide and
        // tooltip.

        hiddenBar.append("rect")
            .attr('class', 'hiddenBar')
            .attr("height", mh)
            .attr("width", hiddenBarWidth)
            .on('mouseenter', function(d, i) {
                var rectId = self.el + " #verticalRect" + i,
                    guideId = self.el + " #verticalGuideLine" + i,
                    targ = d3.select(guideId).pop().pop();
                d3.select(guideId).style("opacity", 0.8);
                tip.offset([50, 0]).show(d, targ);
            })
            .on('mouseleave', function(d, i) {
                var id = self.el + " #verticalGuideLine" + i;
                d3.select(id).style("opacity", 0);
                tip.hide();
            });
    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>')

});
