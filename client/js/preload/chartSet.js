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

var ChartSet = GoldstoneBaseView.extend({

    instanceSpecificInit: function() {
        ChartSet.__super__.instanceSpecificInit.apply(this, arguments);
        this.makeChart();
    },

    processOptions: function() {

        ChartSet.__super__.processOptions.apply(this, arguments);

        this.marginLeft = this.options.marginLeft || 50;
        this.marginRight = this.options.marginRight || 120;
        this.marginTop = this.options.marginTop || 20;
        this.marginBottom = this.options.marginBottom || 80;
        this.popoverTimeLabel = this.options.popoverTimeLabel || "time";
        this.popoverUnitLabel = this.options.popoverUnitLabel || "events";
        this.shapeArray = ['rect', 'circle'];
        this.shapeCounter = 0;
        this.shape = this.options.shape || this.shapeArray[this.shapeCounter];
        this.xParam = this.options.xParam;
        this.yParam = this.options.yParam;
        this.data = [];
    },

    resetXParam: function(param) {
        param = param || 'time';
        this.xParam = param;
    },

    resetYParam: function(param) {
        param = param || 'count';
        this.yParam = param;
    },

    makeChart: function() {
        this.svgAdder(this.width, this.height);
        this.initializePopovers();
        this.chartAdder();

        this.setXDomain();
        this.setYDomain();

        this.setXAxis();
        this.setYAxis();
        this.callXAxis();
        this.callYAxis();

        this.setYAxisLabel();
    },

    update: function() {
        this.setData(this.collection.toJSON());
        this.updateWithNewData();
    },

    updateWithNewData: function() {
        this.setXDomain();
        this.setYDomain();
        this.resetAxes();
        this.bindShapeToData(this.shape);
        this.shapeUpdate(this.shape);
        this.shapeEnter(this.shape);
        this.shapeExit(this.shape);
        this.hideSpinner();
    },

    initializePopovers: function() {
        var self = this;
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return self.popoverTimeLabel + ": " + moment(+d.time).format() +
                    "<br>" +
                    self.popoverUnitLabel + ": " + d.count;
            });

        this.svg.call(this.tip);
    },

    setData: function(newData) {
        this.data = newData;
    },

    svgAdder: function() {
        this.svg = d3.select(this.el).select('.panel-body').append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
    },

    chartAdder: function() {
        this.chart = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');
    },

    setXDomain: function() {
        var param = this.xParam || 'time';
        var self = this;
        this.x = d3.time.scale()
        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        .domain(self.data.length ? d3.extent(this.data, function(d) {
            return d[param];
        }) : [1, 1])
            .range([0, (this.width - this.marginLeft - this.marginRight)]);
    },

    setYDomain: function() {
        var param = this.yParam || 'count';
        var self = this;

        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        this.y = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(this.data, function(d) {
                return d[param];
            }) : 0])
            .range([(this.height - this.marginTop - this.marginBottom), 0]);
    },

    setYAxisLabel: function() {
        this.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (this.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(this.yAxisLabel)
            .style("text-anchor", "middle");
    },

    bindShapeToData: function(shape, binding) {
        this[shape] = this.chart.selectAll(shape)
            .data(this.data, function(d) {
                return binding ? d[binding] : d.time;
            });
    },

    shapeUpdate: function(shape) {
        var xParam = this.xParam || 'time';
        var yParam = this.yParam || 'count';
        var self = this;
        this[shape]
            .transition()
            .attr('cx', function(d) {
                return self.x(d[xParam]);
            })
            .attr('cy', function(d) {
                return self.y(d[yParam]);
            })
            .attr('r', 10)
            .attr('x', function(d) {
                return self.x(d[xParam]);
            })
            .attr('y', function(d) {
                return self.y(d[yParam]);
            })
            .attr('height', function(d) {
                return self.height - self.marginTop - self.marginBottom - self.y(d[yParam]);
            })
            .attr('width', (this.width - this.marginLeft - this.marginRight) / this.data.length);
    },

    shapeEnter: function(shape) {
        var xParam = this.xParam || 'time';
        var yParam = this.yParam || 'count';
        var self = this;
        this[shape]
            .enter()
            .append(shape)
            .attr("fill", this.colorArray.distinct[3][1])
            .style('fill-opacity', 1e-6)
            .attr('class', 'chart-rect')
            .attr('id', 'chart-rect')
            .attr('x', function(d) {
                return self.x(d[xParam]);
            })
            .attr('y', function(d) {
                return (self.y(d[yParam]));
            })
            .attr('height', function(d) {
                return self.height - self.marginTop - self.marginBottom - self.y(d[yParam]);
            })
            .attr('width', (this.width - this.marginLeft - this.marginRight) / this.data.length)
            .attr('cx', function(d) {
                return self.x(d[xParam]);
            })
            .attr('cy', function(d) {
                return (self.y(d[yParam]));
            })
            .attr('r', 10)
            .on('mouseover', function(d) {
                self.mouseoverAction(d);
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            })
            .transition()
            .style('fill-opacity', 1);
    },

    mouseoverAction: function(d) {
        this.tip.show(d);
    },

    mouseoutAction: function(d) {
        this.tip.hide();
    },

    shapeExit: function(shape) {
        this[shape]
            .exit()
            .transition()
            .style('fill-opacity', 1e-6)
            .remove();
    },

    switchShape: function() {
        this.svgClearer(this.shape);
        this.shape = this.shapeArray[this.shapeCounter++ % 2];
        this.bindShapeToData(this.shape);
        this.shapeUpdate(this.shape);
        this.shapeEnter(this.shape);
        this.shapeExit(this.shape);
    },

    areaSetter: function() {
        var self = this;
        this.area = d3.svg.area()
            .interpolate("monotone")
            .tension(0.85)
            .x(function(d) {
                return self.x(d.time);
            })
            .y0(function(d) {
                return self.y(0);
            })
            .y1(function(d) {
                return self.y(d.count);
            });
    },

    pathAdder: function(datum) {
        var self = this;
        this.chart.append("path")
            .datum(datum)
            .attr("class", "area")
            .attr("id", "minMaxArea")
            .attr("d", this.area)
            .attr("fill", this.colorArray.distinct[3][1])
            .style("opacity", 0.8);
    },

    svgClearer: function(attribute) {
        var selector = this.chart;
        selector.selectAll(attribute)
            .data([])
            .exit()
            .transition()
            .style("fill-opacity", 1e-6)
            .remove();
    },

    setXAxis: function() {
        this.xAxis = d3.svg.axis()
            .scale(this.x)
            .ticks(4)
        // format: day month H:M:S
        .tickFormat(d3.time.format("%e %b %X"))
            .orient("bottom");
    },

    setYAxis: function() {
        this.yAxis = d3.svg.axis()
            .scale(this.y)
            .ticks(5)
            .orient("left")
            .tickFormat(d3.format("d"));
    },

    callXAxis: function() {
        this.svg
            .append('g')
            .attr("class", "x axis")
            .attr('transform', 'translate(' + (this.marginLeft) + ',' + (this.height - this.marginBottom) + ')')
            .call(this.xAxis);
    },

    callYAxis: function() {
        this.svg
            .append('g')
            .attr("class", "y axis")
            .attr('transform', 'translate(' + (this.marginLeft) + ',' + this.marginTop + ')')
            .call(this.yAxis);
    },

    resetAxes: function() {
        var self = this;
        d3.select(this.el).select('.axis.x')
            .transition()
            .call(this.xAxis.scale(self.x));

        self.svg.select('.axis.y')
            .transition()
            .call(this.yAxis.scale(self.y));
    },

    addToLegend: function(selector, legendText) {
        d3.select(this.el).select(selector)
            .attr('data-legend', legendText);
    },

    appendLegend: function() {
        this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + this.marginLeft + ",10)")
            .call(d3.legend);
    }
});
