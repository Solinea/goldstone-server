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

    setLines: function() {
        var self = this;

        this.apiLine = d3.svg.line()
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yApi(d.doc_count);
            });

        this.eventLine = d3.svg.line()
            .x(function(d) {
                return self.x(d.key);
            })
            .y(function(d) {
                return self.yEvent(d.doc_count);
            });

        this.logLine = d3.svg.line()
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

        var existingLines = this.chart.select('path');

        if (existingLines.empty()) {
            this.apiLineRendered = this.chart.append('path')
                .attr('class', 'apiLine')
                .attr('d', this.apiLine(this.data[0].apiData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke', 'red');

            this.eventLineRendered = this.chart.append('path')
                .attr('class', 'eventLine')
                .attr('d', this.eventLine(this.data[0].eventData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke', 'green');

            this.logLineRendered = this.chart.append('path')
                .attr('class', 'logLine')
                .attr('d', this.logLine(this.data[0].logData.aggregations.per_interval.buckets))
                .style('fill', 'none')
                .style('stroke', 'blue');
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
            .style('stroke', 'red')
            .style('fill', 'red');

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
            .style('stroke', 'green')
            .style('fill', 'green');

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
            .style('stroke', 'blue')
            .style('fill', 'blue');
    },

    shapeExit: function() {
        this.chartApiCircles.exit().remove();
        this.chartEventCircles.exit().remove();
        this.chartLogCircles.exit().remove();
    },

});
