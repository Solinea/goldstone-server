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


var ChartSet2 = ChartSet.extend({

    makeChart: function() {
        this.svgAdder(this.width, this.height);
        this.chartAdder();
        this.setXDomain();
        this.setYDomain();
        this.setXAxis();
        this.setYAxis();
        this.circleAdder();
        // this.rectAdder();
        // this.areaSetter();
        // this.pathAdder(this.data);
        this.callXAxis();
        this.callYAxis();
        this.setYAxisLabel();
        // this.addToLegend('.circles', 'thingggys');
        // this.appendLegend();
    },


    circleUpdater: function() {
        var self = this;
        this.chart.selectAll('circle')
            .data(this.data, function(d) {
                return d.time;
            })
            .enter()
            .append('circle')
            .attr("fill", this.colorArray.distinct[3][1])
            .attr('cx', function(d) {
                return self.x(d.time);
            })
            .attr('cy', function(d) {
                return (self.y(d.count));
            })
            .attr('r', function(d) {
                return 5;
            });
    },

    updateChart: function() {
        ChartSet2.__super__.updateChart.apply(this, arguments);
        this.circleUpdater();
    }

});
