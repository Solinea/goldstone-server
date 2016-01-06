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
openstack syslog severity levels:
0       EMERGENCY: system is unusable
1       ALERT: action must be taken immediately
2       CRITICAL: critical conditions
3       ERROR: error conditions
4       WARNING: warning conditions
5       NOTICE: normal but significant condition
6       INFO: informational messages
7       DEBUG: debug-level messages
/*

/*
View is linked to collection when instantiated

Instantiated on topologyPageView as:

this.nodeAvailChart = new NodeAvailCollection({});

this.nodeAvailChartView = new NodeAvailView({
    chartTitle: goldstone.translate('Node Availability'),
    collection: this.nodeAvailChart,
    el: '#goldstone-discover-r1-c2',
    h: {
        "main": 150,
        "swim": 50
    },
    width: $('#goldstone-discover-r1-c2').width()
});
*/


var NodeAvailView = GoldstoneBaseView.extend({

    margin: {
        top: 18,
        bottom: 25,
        right: 40,
        left: 10
    },

    filter: {
        // none must be set to false in order to not display
        // nodes that have zero associated events.
        EMERGENCY: true,
        ALERT: true,
        CRITICAL: true,
        ERROR: true,
        WARNING: true,
        NOTICE: true,
        INFO: true,
        DEBUG: true,
        none: false,
        actualZero: true
    },

    instanceSpecificInit: function() {
        NodeAvailView.__super__.instanceSpecificInit.apply(this, arguments);

        // basic assignment of variables to be used in chart rendering
        this.initSvg();
    },

    processListeners: function() {
        var self = this;

        this.listenTo(this.collection, 'sync', function() {
            if (self.collection.defaults.urlCollectionCount === 0) {

                // if the 2nd fetch is done, store the 2nd dataset
                // in dataToCombine
                self.dataToCombine[1] = self.collectionPrep(self.collection.toJSON()[0]);

                // restore the fetch count
                self.collection.defaults.urlCollectionCount = self.collection.defaults.urlCollectionCountOrig;

                // reset fetchInProgress so further fetches can
                // be initiated
                self.collection.defaults.fetchInProgress = false;

                // update the view
                self.update();
            } else if (self.collection.defaults.urlCollectionCount === 1) {
                // if the 1st of 2 fetches are done, store the
                // first dataset in dataToCombine
                self.dataToCombine[0] = self.collectionPrep(self.collection.toJSON()[0]);
            }
        });

        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            self.fetchNowWithReset();
        });

        this.on('lookbackIntervalReached', function() {
            self.fetchNowWithReset();
        });
    },

    fetchNowWithReset: function() {
        this.showSpinner();
        this.collection.fetchMultipleUrls();
    },

    initSvg: function() {
        var self = this;


        this.r = d3.scale.sqrt();
        this.dataToCombine = [];

        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;

        // maps between input label domain and output color range for circles
        self.loglevel = d3.scale.ordinal()
            .domain(["EMERGENCY", "ALERT", "CRITICAL", "ERROR", "WARNING", "NOTICE", "INFO", "DEBUG", "actualZero"])
            // concats darkgrey as a color for nodes
            // reported at 'actualZero'
            .range(self.colorArray.distinct.openStackSeverity8.concat(['#A9A9A9']));

        // for 'disabled' axis
        self.xAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(3)
            .tickFormat(d3.time.format("%m/%d %H:%M:%S"));

        self.xScale = d3.time.scale()
            .range([self.margin.left, self.mw - self.margin.right])
            // rounding
            .nice()
            // values above or below domain will be constrained to range
            .clamp(true);

        self.yAxis = d3.svg.axis()
            .ticks(5)
            .orient("left");
        self.swimAxis = d3.svg.axis().orient("left");
        self.ySwimLane = d3.scale.ordinal()
            .domain(["unadmin"].concat(self.loglevel
                .domain()
                .concat(["padding1", "padding2", "ping"])))
            .rangeRoundBands([self.h.main, 0]);

        self.yLogs = d3.scale.linear()
            .range([
                self.ySwimLane("unadmin") - self.ySwimLane.rangeBand(),
                self.ySwimLane("ping") + self.ySwimLane.rangeBand()
            ]);


        /*
         * The graph and axes
         */

        self.svg = d3.select(this.el).select(".panel-body").append("svg")
            .attr("width", self.width)
            .attr("height", self.h.main + (self.h.swim * 2) + self.margin.top + self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        self.graph = self.svg.append("g").attr("id", "graph");

        // Visual swim lanes
        self.swimlanes = {
            // ping: {
            //     label: "Ping Only",
            //     offset: -(self.ySwimLane.rangeBand() / 2)
            // },
            unadmin: {
                label: "Disabled",
                offset: self.ySwimLane.rangeBand() / 2
            }
        };

        self.graph.selectAll(".swimlane")
            .data(d3.keys(self.swimlanes), function(d) {
                return d;
            })
            .enter().append("g")
            .attr("class", "swimlane")
            .attr("id", function(d) {
                return d;
            })
            .attr("transform", function(d) {
                return "translate(0," + self.ySwimLane(d) + ")";
            });

        // self.graph.append("g")
        //     .attr("class", "xping axis")
        //     .attr("transform", "translate(0," + (self.ySwimLane.rangeBand()) + ")");

        self.graph.append("g")
            .attr("class", "xunadmin axis")
            .attr("transform", "translate(0," + (self.h.main - self.ySwimLane.rangeBand()) + ")");

        self.graph.append("g")
            .attr("class", "y axis invisible-axis")
            .attr("transform", "translate(" + (self.mw + 10) + ",0)");

        // nudges visible y-axis to the right
        self.graph.append("g")
            .attr("class", "swim axis invisible-axis")
            .attr("transform", "translate(20,0)");

        self.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function(e) {
                if (this.getBBox().y < self.h.swim) {
                    return 's';
                } else {
                    return 'n';
                }
            })
            .offset(function() {
                var leftOffset;
                // [top-offset, left-offset]
                var toolTipWidth = 292;
                var halfToolHeight = 65;
                if (this.getBBox().x < toolTipWidth) {
                    leftOffset = toolTipWidth - this.getBBox().x;
                } else if (this.getBBox().x > self.width - toolTipWidth) {
                    leftOffset = -(toolTipWidth - (self.width - this.getBBox().x));
                } else {
                    leftOffset = 0;
                }
                return [0, leftOffset];
            })
            .html(function(d) {
                return self.formatTooltip(d);
            });

        self.graph.call(self.tooltip);

        // Label the swim lane ticks
        self.swimAxis
            .tickFormat(function(d) {
                // Visual swim lanes
                var swimlanes = {
                    // ping: "Ping Only",
                    unadmin: ""
                };
                var middle = self.ySwimLane.domain()[Math.floor(self.ySwimLane.domain().length / 2)];
                swimlanes[middle] = "";
                if (swimlanes[d]) {
                    return swimlanes[d];
                } else {
                    return "";
                }
            });

        // Draw the axis on the screen
        d3.select(this.el).select(".swim.axis")
            .call(self.swimAxis.scale(self.ySwimLane));

        // Transform the swim lane ticks into place
        // increases size of labels via font-size
        d3.select(this.el).select(".swim.axis").selectAll("text")
            .style('font-size', '15px')
            .style('font-weight', 'bold');
    },

    formatTooltip: function(d) {

        var self = this;

        // Time formatted as: Wed Apr 29 2015 20:50:49 GMT-0700 (PDT)
        var tooltipText = '<div class="text-left">Host: ' + d.name + '<br>' +
            'Time: ' + moment(d.created).toDate() + '<br>';

        var levels = _.filter(_.keys(self.filter), function(item) {
            return item !== 'actualZero' && item !== 'none';
        });

        // var levels = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];

        // iterate through levels and if defined and non-zero, append
        // to toolTip with count
        _.each(levels, function(item) {
            item += '_count';
            if (d[item]) {
                // changes 'alert_level' to 'Alert: xxx'
                tooltipText += item.charAt(0).toUpperCase() + item.slice(1, item.indexOf("_")) + ": " + d[item] + '<br>';
            }
        });

        tooltipText += '</div>';

        return tooltipText;
    },

    sums: function(datum) {
        var self = this;

        // Return the sums for the filters that are on
        return d3.sum(self.loglevel.domain().map(function(k) {

            if (self.filter[k] && datum[k + "_count"]) {
                return datum[k + "_count"];
            } else {
                return 0;
            }

        }));
    },

    collectionPrep: function(data) {
        var self = this;

        var finalData = [];

        // data.hosts will equal all hosts, so
        // make an object to keep track of whether each one has been
        // found in the data.data array, and record the levels
        // and timestamp for that occurance.
        // once each host has been found, quit the iteration and
        // return the record as final data;
        var setOfHosts = {}; // ['rsrc-01', 'ctrl-01', ....]

        // prime setOfHosts object. keyed to data.hosts
        // and value all initially set to null
        _.each(data.hosts, function(item) {
            setOfHosts[item] = null;
        }); // {'rsrc-01: null, 'ctrl-01': null, ...}

        // function to return if there are any keys that have
        // a value of null in the passed in object
        // (which will be used with setOfHosts)
        var checkIfAnyNull = function(obj) {
            return _.any(obj, function(item) {
                return item === null;
            });
        };

        // reverse the data in order to encounter the
        // most recent timestamps first
        data.data.reverse();

        // sets up an iteration that will break as soon as every
        // host value is no longer set to null, or else gets
        // through the entire data set
        _.every(data.data, function(item) {

            // iterate through the timestamp
            _.each(item, function(hostsInTimestamp, timestamp) {

                // iterate through the host
                _.each(hostsInTimestamp, function(hostObject) {

                    var hostName = _.keys(hostObject)[0];
                    if (setOfHosts[hostName] === null) {

                        // don't run through this host again
                        setOfHosts[hostName] = true;
                        hostResultObject = {};

                        // add in params that are expected by current viz:
                        hostResultObject.id = hostName;
                        hostResultObject.name = hostName;
                        hostResultObject.created = +timestamp;
                        hostResultObject.updated = +timestamp;
                        hostResultObject.managed = true;
                        hostResultObject.update_method = "LOGS";

                        // iterate through host and record the values
                        _.each(hostObject, function(levels) {
                            _.each(levels, function(oneLevel) {
                                hostResultObject[_.keys(oneLevel) + '_count'] = _.values(oneLevel)[0];
                            });
                        });

                        // set each alert level to 0 if still undefined
                        _.each(self.loglevel.domain().filter(function(item) {
                            return item !== 'actualZero';
                        }), function(level) {
                            hostResultObject[level + '_count'] = hostResultObject[level + '_count'] || 0;
                        });

                        finalData.push(hostResultObject);
                    }
                });
            });

            // if there are any remaining hosts that are set to null
            // then this return value will be true and the iteration
            // will continue. but if this returns false, it stops
            return checkIfAnyNull(setOfHosts);
        });

        return finalData;
    },

    combineDatasets: function(dataArray) {

        // take the two datasets and iterate through the first one
        // looking for '_count' attributes, and then copy them over
        // from the 2nd dataset which contains the accurate counts

        // function to locate an object in a dataset that contains a name property with the passed in name
        var findNodeToCopyFrom = function(data, name) {
            return _.find(data, function(item) {
                return item.name === name;
            });
        };

        _.each(dataArray[0], function(item, i) {
            for (var k in item) {
                if (k.indexOf('_count') > -1) {
                    var itemToCopyFrom = findNodeToCopyFrom(dataArray[1], item.name);
                    item[k] = itemToCopyFrom[k];
                }
            }
        });

        // after they are zipped together, the final result will
        // be contained in array index 0.
        return dataArray[0];
    },

    update: function() {
        var self = this;

        this.hideSpinner();

        // includes timestamps, levels, hosts, data
        var allthelogs = this.collection.toJSON()[0];

        // get the currrent lookback to set the domain of the xAxis
        this.getGlobalLookbackRefresh();
        xEnd = +new Date();
        xStart = xEnd - (1000 * 60 * this.globalLookback);

        self.xScale = self.xScale.domain([xStart, xEnd]);

        // if no response from server, need to assign allthelogs.data
        allthelogs = allthelogs || {};
        allthelogs.data = allthelogs.data || [];

        // If we didn't receive any valid files, append "No Data Returned"
        if (this.checkReturnedDataSet(allthelogs.data) === false) {
            return;
        }

        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        // populate the modal based on the event types.
        _.each(_.keys(self.filter), function(item) {

            // don't put type 'none' or 'actualZero'
            // in the modal checkbox options
            if (item === 'none' || item === 'actualZero') {
                return null;
            }

            // function to determine if the html should format
            // a check box for the filter button in the modal
            var addCheckIfActive = function(item) {
                if (self.filter[item]) {
                    return 'checked';
                } else {
                    return '';
                }
            };

            var checkMark = addCheckIfActive(item);

            $(self.el).find('#populateEventFilters').
            append(

                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div class="input-group">' +
                '<span class="input-group-addon"' +
                'style="background-color:' + self.loglevel([item]) + ';">' +
                '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                '</span>' +
                '<span type="text" class="form-control">' + item + '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        // click listerner for check box to redraw the viz upon change
        $(this.el).find('#populateEventFilters :checkbox').on('click', function() {
            var checkboxId = this.id;
            self.filter[checkboxId] = !self.filter[checkboxId];
            self.redraw();

        });


        /*
         * Shape the dataset
         *   - Convert datetimes to integer
         *   - Sort by last seen (from most to least recent)
         */

        self.dataset = this.combineDatasets(self.dataToCombine)
            .map(function(d) {
                d.created = moment(d.created);
                d.updated = moment(d.updated);

                /*
                 * Figure out which bucket (logs, ping, or disabled)
                 * each node belongs to.
                 */

                if (d.managed === "false") {
                    d.swimlane = "unadmin";
                } else {
                    d.swimlane = d.update_method.toLowerCase();
                }
                return d;
            });


        /*
         * Axes
         *   - calculate the new domain.
         *   - adjust each axis to its new scale.
         */

        // self.pingAxis.scale(self.xScale);
        self.xAxis.scale(self.xScale);

        // self.svg.select(".xping.axis")
        //     .call(self.pingAxis);

        self.svg.select(".xunadmin.axis")
            .call(self.xAxis);

        self.yAxis.scale(self.yLogs);

        self.svg.select(".y.axis")
            .transition()
            .duration(500)
            .call(self.yAxis);


        // binds circles to dataset
        var circle = self.graph.selectAll("circle")
            .data(self.dataset, function(d) {
                // if changing this, also must
                // change idAttribute in backbone model

                /*
TODO: probably change this to d.timestamp
*/
                return d.id;
            });

        // 'enters' circles at far right of screen.
        // styling and location will happen in this.redraw().
        circle.enter()
            .append("circle")
            .attr("cx", function(d) {
                return self.xScale.range()[1];
            })
            .attr("cy", function(d) {
                return self.yLogs(self.sums(d));
            })
            .on("mouseover", self.tooltip.show)
            .on("mouseout", self.tooltip.hide)
            .on("click", function(d) {
                window.location.href = '#report/node/' + d.name;
            });

        this.redraw();

        circle.exit().remove();

        return;
    },

    redraw: function() {
        var self = this;

        /*
         * Figure out the higest non-filtered level.
         * That will determine its color.
         */

        _.each(self.dataset, function(nodeObject) {

            // nonzero_levels returns an array of the node's
            // alert severities that are not filtered out

            var nonzero_levels = self.loglevel.domain()
                .map(function(level) {
                    return [level, nodeObject[level + "_count"]];
                })
                .filter(function(level) {

                    // only consider 'active' filter buttons
                    return self.filter[level[0]] && (level[1] > 0);
                });

            // the .level paramater will determine visibility
            // and styling of the sphere

            // if the array is empty:
            if (nonzero_levels[0] === undefined) {
                nodeObject.level = "actualZero";
            } else {

                // otherwise set it to the
                // highest alert severity
                nodeObject.level = nonzero_levels[0][0];
            }

        });

        self.yLogs.domain([
            0,
            d3.max(self.dataset.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(this.el).select(".swim.axis")
            .transition()
            .duration(500);

        d3.select(this.el).select(".y.axis")
            .transition()
            .duration(500)
            .call(self.yAxis.scale(self.yLogs));

        self.graph.selectAll("circle")
            .transition().duration(500)
            // this determines the color of the circle
            .attr("class", function(d) {
                if (d.swimlane === "unadmin") {
                    return d.swimlane;
                } else {
                    return "individualNode";
                }
            })
            .attr("fill", function(d) {
                return self.loglevel(d.level);
            })
            .attr("cx", function(d) {
                return self.xScale(d.updated);
            })
            .attr("cy", function(d, i) {

                // add multiplier to give space between
                // multiple items reporting the same numbers
                if (d.level === 'actualZero') {
                    return (self.yLogs(self.sums(d)) - (i * 2));
                } else {

                    // notice the [] at the end which is calling
                    // the key that matches d.swimlane

                    return {

                        // add multiplier to give space between
                        // multiple items reporting the same numbers
                        logs: self.yLogs(self.sums(d) - (i * 2)),

                        // ping: self.ySwimLane(d.swimlane) - 15,
                        unadmin: self.ySwimLane(d.swimlane) + self.ySwimLane.rangeBand() + 15
                    }[d.swimlane];


                }



            })
            .attr("r", function(d) {

                // radii at fixed size for now.
                if (d.swimlane === "logs") {
                    return self.r(64);
                } else {
                    return self.r(20);
                }

            })
            .style("opacity", function(d) {

                if (d.swimlane === "unadmin") {
                    return 1.0;
                }
                if (self.filter[d.level]) {
                    return 1.0;
                } else {
                    return 0;
                }

            })
            .style("visibility", function(d) {

                // use visibility "hidden" to
                // completely remove from dom to prevent
                // tool tip hovering from still working
                if (!self.filter[d.level]) {
                    return "hidden";
                } else {
                    return "visible";
                }
            });

    },

    addModalAndHeadingIcons: function() {
        this.$el.find('#modal-container-' + this.el.slice(1)).append(this.modal2());
        this.$el.find('.special-icon-post').append(this.filterButton());
    },

    filterButton: _.template('' +
        '<i class="fa fa-filter pull-right" data-toggle="modal"' +
        'data-target="#modal-filter-<%= this.el.slice(1) %>' + '" style="margin-left: 15px;"></i>'
    ),

    modal1: _.template(
        // event settings modal
        '<div class="modal fade" id="modal-settings-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title" id="myModalLabel">Chart Settings</h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="nodeAutoRefresh" class="col-sm-3 control-label">Refresh: </label>' +
        '<div class="col-sm-9">' +
        '<div class="input-group">' +
        '<span class="input-group-addon">' +
        '<input type="checkbox" class="nodeAutoRefresh" checked>' +
        '</span>' +
        '<select class="form-control" id="nodeAutoRefreshInterval">' +
        '<option value="5">5 seconds</option>' +
        '<option value="15">15 seconds</option>' +
        '<option value="30" selected>30 seconds</option>' +
        '<option value="60">1 minute</option>' +
        '<option value="300">5 minutes</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<div class="form-group">' +
        '<button type="button" id="eventSettingsUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal">Update</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    ),

    modal2: _.template(
        // event filter modal
        '<div class="modal fade" id="modal-filter-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
        '<h4 class="modal-title" id="myModalLabel"><%=goldstone.translate(\'Log Severity Filters\')%></h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5><%=goldstone.contextTranslate(\'Uncheck log-type to hide from display\', \'nodeavail\')%></h5><br>' +
        '<div id="populateEventFilters"></div>' +
        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal"><%=goldstone.contextTranslate(\'Exit\', \'nodeavail\')%></button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    )
});