/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// view is linked to collection when instantiated in api_perf_report.html

var StackedBarChartView = GoldstoneBaseView.extend({

    specialInit: function() {
        var ns = this.defaults;

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format("01d"));

        ns.color = d3.scale.ordinal()
            .range(ns.colorArray.distinct[2]);
    },

    dataPrep: function(data) {
        var result = [];

        _.each(data[0], function(item, i) {
            result.push({
                "eventTime": "" + i,
                "Success": item[2],
                "Failure": item[0]
            });
        });

        return result;
    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        var data = this.collection.toJSON();
        data = this.dataPrep(data);

        this.hideSpinner();


        if(this.checkReturnedDataSet(data) === false){
            return;
        }

        $(this.el).find('svg').find('rect').remove();
        $(this.el).find('svg').find('.axis').remove();
        $(this.el).find('svg').find('.legend').remove();

        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "eventTime";
        }));

        data.forEach(function(d) {
            var y0 = 0;
            d.successOrFail = ns.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });
            d.total = d.successOrFail[d.successOrFail.length - 1].y1;
        });

        ns.x.domain(d3.extent(data, function(d) {
            return d.eventTime;
        }));

        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        ns.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.chart.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        ns.event = ns.chart.selectAll(".event")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.eventTime) + ",0)";
            });

        ns.event.selectAll("rect")
            .data(function(d) {
                return d.successOrFail;
            })
            .enter().append("rect")
            .attr("width", function(d) {
                return (ns.mw / data.length) - 0.2;
            })
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .attr("rx", 0.8)
            .attr("stroke", function(d) {
                return ns.color(d.name);
            })
            .attr("stroke-opacity", 0.9)
            .attr("fill-opacity", 0.7)
            .attr("stroke-width", 2)
            .style("fill", function(d) {
                return ns.color(d.name);
            });

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'fail')
            .attr('data-legend', "Fail")
            .attr("data-legend-color", ns.colorArray.distinct[2][1]);

        ns.chart.append('path')
            .attr('class', 'line')
            .attr('id', 'success')
            .attr('data-legend', "Success")
            .attr("data-legend-color", ns.colorArray.distinct[2][0]);

        var legend = ns.chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(20,-20)")
            .attr("opacity", 0.7)
            .call(d3.legend);

    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    render: function() {

        new ChartHeaderView({
            el: this.el,
            columns: 12,
            chartTitle: this.defaults.chartTitle,
            infoText: this.defaults.infoCustom
        });

        $(this.el).find('.mainContainer').append(this.template());
        return this;
    }

});
