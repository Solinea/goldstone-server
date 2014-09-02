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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: John Stanford
 */

goldstone.namespace('apiPerf.report');

// backbone test start

    var ApiPerfModel = Backbone.Model.extend({
        idAttribute: "key"
    });

    var ApiPerfCollection = Backbone.Collection.extend({

        parse: function(data){
            return JSON.parse(data);
        },

        model: ApiPerfModel,

        url: "/nova/api_perf?start=1409006640&end=1409011712&interval=120s&render=false"
    });

    var ApiPerfView = Backbone.View.extend({

        defaults: {
            margin: {top: 20, right: 20, bottom: 30, left: 40},
            width: 525,
            height: 200,
            svg: null
        },

        initialize: function(){

            var height = this.defaults.height;

            this.defaults.svg = d3.select("#api-perf-report-r3-c2").append("svg")
                .attr("width", this.defaults.width + this.defaults.margin.left + this.defaults.margin.right)
                .attr("height", this.defaults.height + this.defaults.margin.top + this.defaults.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + this.defaults.margin.left + "," + this.defaults.margin.top + ")");

            this.model.on('sync', this.render, this);
        },

        render: function(){

            var height = this.defaults.height;

            console.log('render called');

            var svg = this.defaults.svg;

            var rectangles = svg.selectAll("rect")
                .data(this.model.toJSON());

            rectangles
                .attr("width", function(d) { return 4; })
                .attr("height", function(d) { return 4; })
                .attr("x", function(d, i) { return i*3; })
                .attr("y", function(d) { return (height - d.max/10); });

            rectangles
                .enter().append("rect")
                .attr("width", function(d) { return 4; })
                .attr("height", function(d) { return 4; })
                .attr("x", function(d, i) { return i*3; })
                .attr("y", function(d) { return (height - d.max/10); });

            rectangles
                .exit().remove();

        }

    });



// backbone test end
