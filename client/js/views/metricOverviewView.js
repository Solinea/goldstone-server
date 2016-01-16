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

// ChartSet extends from GoldstoneBaseView

var MetricOverviewView = ChartSet.extend({

    makeChart: function() {
        this.colorSet = d3.scale.ordinal().domain(['api', 'event', 'log']).range(this.colorArray.distinct['3R']);
        this.svgAdder(this.width, this.height);
        this.initializePopovers();
        this.chartAdder();

        this.setXDomain();
        this.setYDomain();

        this.setXAxis();
        this.callXAxis();
        this.setYAxisLabel();

        // added
        this.setLines();
        this.setLegend();
    },

    setLegend: function() {
        var self = this;

        var legendText = [{
            text: 'API',
            colorSet: 'api'
        }, {
            text: 'Events',
            colorSet: 'event'
        }, {
            text: 'Logs',
            colorSet: 'log'
        }];

        var legend = this.svg.selectAll('g')
            .data(legendText)
            .append('g');

        legend.append('rect')
            .attr('x', function(d, i) {
                return i * 60;
            })
            .attr('y', -20)
            .attr('width', '10px')
            .attr('height', '10px')
            .attr('fill', function(d) {
                return self.colorSet(d.colorSet);
            });

        legend.append('text')
            .text(function(d) {
                return d.text;
            })
            .attr('color', 'black')
            .attr('x', function(d, i) {
                return i * 60 + 14;
            })
            .attr('y', -10)
            .attr('font-size', '15px');

    },

    chartAdder: function() {
        this.chart = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');

        this.chartApi = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');

        this.chartEvent = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');

        this.chartLog = this.svg
            .append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + this.marginLeft + ' ,' + this.marginTop + ')');
    },

    initializePopovers: function() {
        var self = this;
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d, setName) {
                return moment(d.key).format('ddd MMM D YYYY') + "<br>" +
                    moment(d.key).format('h:mm:ss a') + "<br>" +
                    d.doc_count + ' ' + setName;
            });

        this.svg.call(this.tip);
    },

    setLines: function() {
        var self = this;

        this.apiLine = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yApi(d.doc_count);
            });

        this.eventLine = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yEvent(d.doc_count);
            });

        this.logLine = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yLog(d.doc_count);
            });
    },

    resetAxes: function() {
        var self = this;
        d3.select(this.el).select('.axis.x')
            .transition()
            .call(this.xAxis.scale(self.x));
    },

    update: function() {
        this.setData(this.collection.toJSON());
        this.updateWithNewData();
    },

    updateWithNewData: function() {
        this.setXDomain();
        this.setYDomain();
        this.resetAxes();
        this.linesUpdate();
        this.shapeUpdate();
        this.shapeEnter();
        this.shapeExit();
        this.hideSpinner();
    },

    svgAdder: function() {
        this.svg = d3.select(this.el).select('.panel-body').append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
    },

    setXDomain: function() {
        var self = this;
        this.x = d3.time.scale()
        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        .domain(self.data.length ? [moment(self.data[0].startTime), moment(self.data[0].endTime)] : [1, 1])
            .range([0, (this.width - this.marginLeft - this.marginRight)]);

    },

    setYDomain: function() {
        var param = this.yParam || 'count';
        var self = this;

        // protect against invalid data and NaN for initial
        // setting of domain with unary conditional
        this.yLog = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(self.data[0].logData.aggregations.per_interval.buckets, function(d) {
                return d.doc_count;
            }) : 0])
            .range([(this.height - this.marginTop - this.marginBottom), 0]);

        this.yEvent = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(self.data[0].eventData.aggregations.per_interval.buckets, function(d) {
                return d.doc_count;
            }) : 0])
            .range([(this.height - this.marginTop - this.marginBottom), 0]);

        this.yApi = d3.scale.linear()
            .domain([0, self.data.length ? d3.max(self.data[0].apiData.aggregations.per_interval.buckets, function(d) {
                return d.doc_count;
            }) : 0])
            .range([(this.height - this.marginTop - this.marginBottom), 0]);

    },

    linesUpdate: function() {

        var self = this;
        var existingLines = this.chart.select('path');

        if (existingLines.empty()) {
            this.apiLineRendered = this.chart.append('path')
                .attr('class', 'apiLine')
                .attr('d', this.apiLine(this.data[0].apiData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke-width', '2px')
                .style('shape-rendering', 'geometricPrecision')
                .style('stroke', self.colorSet('api'));

            this.eventLineRendered = this.chart.append('path')
                .attr('class', 'eventLine')
                .attr('d', this.eventLine(this.data[0].eventData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke-width', '2px')
                .style('shape-rendering', 'geometricPrecision')
                .style('stroke', self.colorSet('event'));

            this.logLineRendered = this.chart.append('path')
                .attr('class', 'logLine')
                .attr('d', this.logLine(this.data[0].logData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke-width', '2px')
                .style('shape-rendering', 'geometricPrecision')
                .style('stroke', self.colorSet('log'));
        }

        this.apiLineRendered
            .transition()
            .attr('d', this.apiLine(this.data[0].apiData.aggregations.per_interval.buckets));

        this.eventLineRendered
            .transition()
            .attr('d', this.eventLine(this.data[0].eventData.aggregations.per_interval.buckets));

        this.logLineRendered
            .transition()
            .attr('d', this.logLine(this.data[0].logData.aggregations.per_interval.buckets));
    },

    shapeUpdate: function() {
        var self = this;

        this.chartApiCircles = this.chartApi.selectAll('circle')
            .data(this.data[0].apiData.aggregations.per_interval.buckets);

        this.chartApiCircles
            .transition()
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yApi(d.doc_count);
            });


        this.chartEventCircles = this.chartEvent.selectAll('circle')
            .data(this.data[0].eventData.aggregations.per_interval.buckets);

        this.chartEventCircles
            .transition()
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yEvent(d.doc_count);
            });

        this.chartLogCircles = this.chartLog.selectAll('circle')
            .data(this.data[0].logData.aggregations.per_interval.buckets);

        this.chartLogCircles
            .transition()
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yLog(d.doc_count);
            });

    },

    shapeEnter: function() {
        var self = this;

        this.chartApiCircles
            .enter().append('circle')
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yApi(d.doc_count);
            })
            .attr('class', 'apiCircle')
            .attr('r', 3)
            .style('stroke', this.colorSet('api'))
            .style('fill', this.colorSet('api'))
            .on('mouseover', function(d) {
                self.mouseoverAction(d, 'Api Events');
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            });

        this.chartEventCircles
            .enter().append('circle')
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yEvent(d.doc_count);
            })
            .attr('class', 'eventCircle')
            .attr('r', 3)
            .style('stroke', this.colorSet('event'))
            .style('fill', this.colorSet('event'))
            .on('mouseover', function(d) {
                self.mouseoverAction(d, 'Events');
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            });

        this.chartLogCircles
            .enter().append('circle')
            .attr('cx', function(d) {
                return self.x(d.key);
            })
            .attr('cy', function(d) {
                return self.yLog(d.doc_count);
            })
            .attr('class', 'logCircle')
            .attr('r', 3)
            .style('stroke', this.colorSet('log'))
            .style('fill', this.colorSet('log'))
            .on('mouseover', function(d) {
                self.mouseoverAction(d, 'Logs');
            })
            .on('mouseout', function(d) {
                self.mouseoutAction(d);
            });
    },

    shapeExit: function() {
        this.chartApiCircles.exit().remove();
        this.chartEventCircles.exit().remove();
        this.chartLogCircles.exit().remove();
    },

    mouseoverAction: function(d, setName) {
        this.tip.show(d, setName);
    },

    mouseoutAction: function(d) {
        this.tip.hide();
    },

});
