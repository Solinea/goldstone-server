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
 * Author: Alex Jacobs
 */

// view is linked to collection when instantiated in api_perf_report.html

var StackedBarChartView = Backbone.View.extend({

    // adapted from
    // goldstone.charts.bivariateWithAverage

    defaults: {
        margin: {
            top: 20,
            bottom: 30,
            right: 20,
            left: 40
        },
        yAxisLabel: "Response Time (ms)"
    },

    initialize: function(options) {

        this.options = options || {};

        // essential for unique chart objects,
        // as objects/arrays are pass by reference
        this.defaults = _.clone(this.defaults);

        this.defaults.chartTitle = this.options.chartTitle;
        this.defaults.height = this.options.height - this.defaults.margin.top - this.defaults.margin.bottom;
        this.defaults.infoCustom = this.options.infoCustom;
        this.el = this.options.el;
        this.defaults.width = this.options.width - this.defaults.margin.left - this.defaults.margin.right;
        this.defaults.start = this.collection.defaults.reportParams.start;
        this.defaults.end = this.collection.defaults.reportParams.end;
        this.defaults.interval = this.collection.defaults.reportParams.interval;

        // easy to pass in a unique yAxisLabel. This pattern can be
        // expanded to any variable to allow overriding the default.
        if (this.options.yAxisLabel) {
            this.defaults.yAxisLabel = this.options.yAxisLabel;
        }

        var ns = this.defaults;
        var self = this;

        // registers 'sync' event so view 'watches' collection for data update
        this.collection.on('sync', this.update, this);
        this.collection.on('error', this.dataErrorMessage, this);

        // this is triggered by a listener set on novaReportView.js
        this.on('selectorChanged', function() {
            console.log('selectorChangedHeard in ResourceChartView');
            this.collection.defaults.globalLookback = $('#global-lookback-range').val();
            this.collection.urlGenerator();
            this.collection.fetch();
            this.defaults.start = this.collection.defaults.reportParams.start;
            this.defaults.end = this.collection.defaults.reportParams.end;
            this.defaults.interval = this.collection.defaults.reportParams.interval;

            $(this.el).find('#api-perf-info').popover({
                content: this.htmlGen.apply(this),
            });

            $(this.el).find('#spinner').show();
        });

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height / 2)
            });
        });

        this.render();

        // chart info button popover generator
        this.htmlGen = function() {
            var start = moment(goldstone.time.fromPyTs(ns.start / 1000)).format();
            var end = moment(goldstone.time.fromPyTs(ns.end / 1000)).format();
            var custom = _.map(ns.infoCustom, function(e) {
                return e.key + ": " + e.value + "<br>";
            });
            var result = '<div class="infoButton"><br>' + custom +
                'Start: ' + start + '<br>' +
                'End: ' + end + '<br>' +
                'Interval: ' + ns.interval + '<br>' +
                '<br></div>';
            return result;
        };

        $(this.el).find('#api-perf-info').popover({
            trigger: 'manual',
            content: function() {
                return self.htmlGen.apply(this);
            },
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('toggle');
            })
            .on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(self.el).find(targ).popover('hide');
            });

        ns.colorArray = new GoldstoneColors().get('colorSets');

        ns.x = d3.scale.ordinal()
            .rangeRoundBands([0, ns.width], 0.1);

        ns.y = d3.scale.linear()
            .rangeRound([ns.height, 0]);

        ns.color = d3.scale.ordinal()
            .range(ns.colorArray.distinct[2]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom");

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left")
            .tickFormat(d3.format("0.2s"));

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.width + ns.margin.left + ns.margin.right)
            .attr("height", ns.height + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

    },

    clearDataErrorMessage: function() {
        // if error message already exists on page,
        // remove it in case it has changed
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }
    },

    dataErrorMessage: function(message, errorMessage) {

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        this.clearDataErrorMessage();

        if (errorMessage !== undefined) {
            message = errorMessage.responseText;
            // message = message.slice(1, -1);
            message = '' + errorMessage.status + ' error: ' + message;
        }

        $('<span id="noDataReturned">' + message + '</span>').appendTo(this.el)
            .css({
                'position': 'relative',
                'margin-left': -200,
                'top': -$(this.el).height() / 2 - 50
            });

    },

    dataPrep: function(data) {
        var result = [];

        _.each(data[0], function(item, i) {
            result.push({
                "State": "" + i,
                "Failure": item[0],
                "Success": item[2]
            });
        });

        console.log('result: ', result);
        return result;
    },

    update: function() {

        var ns = this.defaults;
        var self = this;
        var data = this.collection.toJSON();
        console.log('orig data', data);
        data = this.dataPrep(data);

        if (data.length === 0) {
            this.dataErrorMessage('No Data Returned');
            return;
        }

        this.clearDataErrorMessage();

        $(this.el).find('svg').find('rect').remove();


        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "State";
        }));

        data.forEach(function(d) {
            var y0 = 0;
            d.ages = ns.color.domain().map(function(name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });
            d.total = d.ages[d.ages.length - 1].y1;
        });

        // data.sort(function(a, b) {
        //     return b.total - a.total;
        // });

        ns.x.domain(data.map(function(d) {
            return d.State;
        }));

        ns.y.domain([0, d3.max(data, function(d) {
            return d.total;
        })]);

        ns.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.height + ")")
            .call(ns.xAxis);

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Spawn Events");

        ns.state = ns.svg.selectAll(".state")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.State) + ",0)";
            });

        ns.state.selectAll("rect")
            .data(function(d) {
                return d.ages;
            })
            .enter().append("rect")
            .attr("width", ns.x.rangeBand())
            .attr("y", function(d) {
                return ns.y(d.y1);
            })
            .attr("height", function(d) {
                return ns.y(d.y0) - ns.y(d.y1);
            })
            .style("fill", function(d) {
                return ns.color(d.name);
            });

        /*
        var legend = ns.svg.selectAll(".legend")
            .data(ns.color.domain().slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(-50," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", ns.width - 68)
            .attr("y", function(d, i) {
                console.log(i);
                return i * 10;
            })
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function(d) {
                console.log(ns.color(d));
                return ns.color(d);
            });

        legend.append("text")
            .attr("x", ns.width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .style("font-size", "10px")
            .text(function(d) {
                return d;
            });
        */

        $(this.el).find('#spinner').hide();

    },

    template: _.template(
        '<div id="api-perf-panel-header" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +
        '<i class="pull-right fa fa-info-circle panel-info"  id="api-perf-info"></i>' +
        '</h3></div>'),

    render: function() {
        this.$el.html(this.template());
        return this;
    }

});
