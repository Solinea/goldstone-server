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

var UtilizationNetView = Backbone.View.extend({

    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 25,
            left: 33
        }
    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.el = options.el;
        this.defaults.width = options.width;

        // bytes -> GB is a base 2 conversion (gibi vs giga)
        this.defaults.divisor = (1 << 30);

        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', function() {
            if (self.collection.defaults.urlCollectionCount === 0) {
                console.log('final len at sync: ', self.collection.length, self.collection.toJSON());
                self.update();

                // the collection count will have to be set back to the original count when re-triggering a fetch.
                self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;
                self.collection.defaults.fetchInProgress = false;
                console.log('fetchInProgress: ', self.collection.defaults.fetchInProgress);
            }

        });

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.width - ns.margin.top - ns.margin.bottom;

        ns.x = d3.time.scale()
            .range([0, ns.mw]);

        ns.y = d3.scale.linear()
            .range([ns.mh, 0]);

        var colorArray = new GoldstoneColors().get('colorSets');
        ns.color = d3.scale.ordinal().range(colorArray.distinct[3]);

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(4);

        ns.yAxis = d3.svg.axis()
            .scale(ns.y)
            .orient("left");

        ns.area = d3.svg.area()
            .interpolate("monotone")
            .x(function(d) {
                return ns.x(d.date);
            })
            .y0(function(d) {
                return ns.y(d.y0);
            })
            .y1(function(d) {
                return ns.y(d.y0 + d.y);
            });

        ns.stack = d3.layout.stack()
            .values(function(d) {
                return d.values;
            });

        ns.svg = d3.select(this.el).append("svg")
            .attr("width", ns.mw + ns.margin.left + ns.margin.right)
            .attr("height", ns.mh + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        // required in case spinner loading takes
        // longer than chart loading
        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.width / 2),
                'display': ns.spinnerDisplay

            });
        });

    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        allthelogs = this.collection.toJSON();

        var data = allthelogs;
        console.log('just arriving in collectionPrep; len=', data.length);

        var dataUniqTimes = _.uniq(_.map(data, function(item) {
            return item.timestamp;
        }));

        console.log('uniq timestamps', dataUniqTimes.length, dataUniqTimes);

        var newData = {};

        _.each(dataUniqTimes, function(item) {
            newData[item] = {
                rx: null,
                tx: null
            };
        });

        console.log('new data with unique times as keys', _.keys(newData).length, newData);

        _.each(data, function(item) {

            var metric;

            var serviceName = item.name.slice(0, item.name.lastIndexOf('.'));

            if (serviceName.indexOf('rx') >= 0) {
                metric = 'rx';
            } else {
                if (serviceName.indexOf('tx') >= 0) {
                    metric = 'tx';
                } else {
                    console.log('rx/tx not found!');
                }
            }

            newData[item.timestamp][metric] += item.value;

        });

        console.log('nnd', _.keys(newData).length, newData);

        finalData = [];

        _.each(newData, function(item, i) {

            finalData.push({
                rx: item.rx,
                tx: item.tx,
                date: i
            });
        });

        console.log('finalData', finalData, finalData.length);

        return finalData;

    },

    update: function() {

        var ns = this.defaults;
        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        ns.spinnerDisplay = 'none';
        $(this.el).find('#spinner').hide();

        var allthelogs = this.collectionPrep();

        console.log('allthelogs fromin update', allthelogs.length, allthelogs);

        // default 120 second refresh interval
        setTimeout(function() {
            console.log('set timeout refreshing');
            self.collection.fetchMultipleUrls();
        }, 120000);

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0) {

            // if 'no data returned' already exists on page, don't reapply it
            if ($(this.el).find('#noDataReturned').length) {
                return;
            }

            $('<span id="noDataReturned">No Data Returned</span>').appendTo(this.el)
                .css({
                    'position': 'relative',
                    'margin-left': $(this.el).width() / 2 - 14,
                    'top': -$(this.el).height() / 2
                });
            return;
        }

        // remove No Data Returned once data starts flowing again
        if ($(this.el).find('#noDataReturned').length) {
            $(this.el).find('#noDataReturned').remove();
        }

        var data = allthelogs;

        ns.color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "date";
        }));

        $(this.el).find('.axis').remove();

        var components = ns.stack(ns.color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {
                        date: d.date,
                        y: d[name]
                    };
                })
            };
        }));

        ns.x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        //TODO: dynamic y.domain
        ns.y.domain([0, d3.max(allthelogs, function(d) {
            return d.rx + d.tx;
        })]);
        console.log('y.domain', ns.y.domain());

        var component = ns.svg.selectAll(".component")
            .data(components)
            .enter().append("g")
            .attr("class", "component");

        component.append("path")
            .attr("class", "area")
            .attr("d", function(d) {
                return ns.area(d.values);
            })
            .style("fill", function(d) {
                return ns.color(d.name);
            })
            .style("opacity", 0.8);

        component.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + ns.x(d.value.date) + "," + ns.y(d.value.y0 + d.value.y / 2) + ")";
            })
            .attr("x", function(d) {
                return 1;
            })
            .attr("y", function(d, i) {
                // make space between the labels
                return -i * 8;
            })
            .style("font-size", ".8em")
            .text(function(d) {
                return d.name + " (kB)";
            });

        ns.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ns.mh + ")")
            .call(ns.xAxis);

        ns.svg.append("g")
            .attr("class", "y axis")
            .call(ns.yAxis);
    }

});
