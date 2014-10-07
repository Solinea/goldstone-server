// view is linked to collection when instantiated

var NodeAvailView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {

        this.options = options || {};
        this.defaults = _.clone(this.defaults); 
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.chartTitle = options.chartTitle;
        this.defaults.width = options.width;
        this.defaults.h = options.h;

        var ns = this.defaults;
        // bind to the backbone object, for calls within functions that would return their own context at the time of invocation
        var self = this;

        ns.animation = {
            pause: false,
            delay: 5
        };

        // start blue spinner
        var appendSpinnerLocation = ns.location;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.h.main * 0.7)
            });
        });

        // bind to backbone collection, when 'fetch' is complete
        this.collection.on('sync', this.update, this);

        // appends display and modal html elements to ns.location
        this.appendHTML();

        // bind modal 'submit' button to updating animation variables
        this.initSettingsForm();

        ns.margin = {
            top: 25,
            bottom: 25,
            right: 40,
            left: 60
        };

        ns.w = ns.width;
        ns.mw = ns.w - ns.margin.left - ns.margin.right;
        ns.mh = ns.h.main - ns.margin.top - ns.margin.bottom;

        // scale that returns range that is square root of input domain
        ns.r = d3.scale.sqrt();

        // maps between input label domain and output color range for circles
        ns.loglevel = d3.scale.ordinal()
            .domain(["debug", "audit", "info", "warning", "error"])
            .range(["#6a51a3", "#2171b5", "#238b45", "#d94801", "#cb181d"]);

        // for 'ping only' axis
        ns.pingAxis = d3.svg.axis()
            .orient("top")
            .ticks(5)
            .tickFormat(d3.time.format("%H:%M:%S"));

        // for 'disabled' axis
        ns.unadminAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(5)
            .tickFormat(d3.time.format("%H:%M:%S"));

        ns.xScale = d3.time.scale()
            .range([ns.margin.left, ns.mw - ns.margin.right])
        // rounding
        .nice()
        // values above or below domain will be constrained to range
        .clamp(true);

        ns.yAxis = d3.svg.axis().orient("left");
        ns.swimAxis = d3.svg.axis().orient("left");
        ns.ySwimLane = d3.scale.ordinal()
            .domain(["unadmin"].concat(ns.loglevel
                .domain()
                .concat(["padding1", "padding2", "ping"])))
            .rangeRoundBands([ns.h.main, 0], 0.1);

        ns.yLogs = d3.scale.linear()
            .range([
                ns.ySwimLane("unadmin") - ns.ySwimLane.rangeBand(),
                ns.ySwimLane("ping") + ns.ySwimLane.rangeBand()
            ]);

        // can we just remove 'none'?
        ns.filter = {
            none: true,
            debug: true,
            audit: true,
            info: true,
            warning: true,
            error: true
        };

        // The log-level buttons toggle the specific log level into the total count
        // if removing 'none' above, then remove the filter to remove 'none' below:
        d3.select(ns.location).select("#event-filterer").selectAll("input")
        // keys works like Object.keys. Returns button titles defined in ns.filter
        .data(d3.keys(ns.filter).filter(function(k) {
            return k !== 'none';
        }), function(d) {
            return d;
        })
            .enter().append("div")
            .attr("class", "btn-group")
            .append("label")
            .attr("id", function(d) {
                return d;
            })
            .attr("class", function(d) {
                return "btn btn-log-" + d;
            })
            .classed("active", function(d) {
                return ns.filter[d];
            })
            .attr("type", "button")
            .text(function(d) {
                return d;
            })
            .on("click", function(d) {
                ns.filter[d] = !ns.filter[d];
                self.redraw();
            });

        /*
         * The graph and axes
         */

        ns.svg = d3.select(ns.location).select(".panel-body").append("svg")
            .attr("width", ns.w)
            .attr("height", ns.h.main + (ns.h.swim * 2) + ns.margin.top + ns.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");

        ns.graph = ns.svg.append("g").attr("id", "graph");

        // Visual swim lanes
        ns.swimlanes = {
            ping: {
                label: "Ping Only",
                offset: ns.ySwimLane.rangeBand() / 2 * -1
            },
            unadmin: {
                label: "Disabled",
                offset: ns.ySwimLane.rangeBand() / 2
            }
        };

        ns.graph.selectAll(".swimlane")
            .data(d3.keys(ns.swimlanes), function(d) {
                return d;
            })
            .enter().append("g")
            .attr("class", "swimlane")
            .attr("id", function(d) {
                return d;
            })
            .attr("transform", function(d) {
                return "translate(0," + ns.ySwimLane(d) + ")";
            });

        ns.graph.append("g")
            .attr("class", "xping axis")
            .attr("transform", "translate(0," + (ns.ySwimLane.rangeBand()) + ")");

        ns.graph.append("g")
            .attr("class", "xunadmin axis")
            .attr("transform", "translate(0," + (ns.h.main - ns.ySwimLane.rangeBand()) + ")");

        ns.graph.append("g")
            .attr("class", "y axis invisible-axis")
            .attr("transform", "translate(" + ns.mw + ",0)");

        ns.graph.append("g")
            .attr("class", "swim axis invisible-axis");

        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function(e) {
                if (e.last_seen_method === 'PING') {
                    return 's';
                } else {
                    return 'n';
                }
            })
            .offset(function(){
                var leftOffset;
                // [top-offset, left-offset]
                var halfToolWidth = 150;
                var halfToolHeight = 65;
                if (this.getBBox().x < halfToolWidth) {
                    leftOffset = halfToolWidth - this.getBBox().x;
                } else if (this.getBBox().x > ns.width - halfToolWidth) {
                    leftOffset = -(halfToolWidth - (ns.width - this.getBBox().x));
                } else {
                    leftOffset = 0;
                }
                return [0, leftOffset];
            })
            .html(function(d) {
                return d.name + "<br/>" +
                    "(" + d.uuid + ")" + "<br/>" +
                    "Errors: " + d.error_count + "<br/>" +
                    "Warnings: " + d.warning_count + "<br/>" +
                    "Info: " + d.info_count + "<br/>" +
                    "Audit: " + d.audit_count + "<br/>" +
                    "Debug: " + d.debug_count + "<br/>";
            });

        ns.graph.call(ns.tooltip);

        // Label the swim lane ticks
        ns.swimAxis
            .tickFormat(function(d) {
                // Visual swim lanes
                var swimlanes = {
                        ping: "Ping Only",
                        unadmin: "Disabled",
                    },
                    middle = ns.ySwimLane.domain()[Math.floor(ns.ySwimLane.domain().length / 2)];
                swimlanes[middle] = "Logs";
                return swimlanes[d] ? swimlanes[d] : "";
            });

        // Draw the axis on the screen
        d3.select(ns.location).select(".swim.axis")
            .call(ns.swimAxis.scale(ns.ySwimLane));

        // Transform the swim lane ticks into place
        d3.select(ns.location).select(".swim.axis").selectAll("text")
            .attr("transform", function(d, i) {
                // The "unadmin" label needs to be nudged downwards
                // The "logs" label needs to be nudged to the left
                // The "ping" label needs to be nudged upwards
                var nudge = ns.ySwimLane.rangeBand() / 2 * (d === "unadmin" ? 1 : d === "ping" ? -1 : -0.5);
                // to remove rotation, remove the following 3 lines:
                var l = ns.ySwimLane.domain().length;
                var ret = "translate(0," + nudge + ")";
                // Rotate the middle label, as it covers the widest swim lane
                return ((i > 0 && i < l - 1) ? "rotate(" + (i === Math.floor(l / 2) ? -90 : 0) + ") " : "") + ret;
            });

    },

    isRefreshSelected: function() {
        var ns = this.defaults;
        return $(ns.location).find(".eventAutoRefresh").prop("checked");
    },

    refreshInterval: function() {
        var ns = this.defaults;
        return $(ns.location).find("select#eventAutoRefreshInterval").val();
    },


    initSettingsForm: function() {
        var self = this;
        var ns = this.defaults;
        var updateSettings = function() {
            ns.animation.delay = self.refreshInterval();
            ns.animation.pause = !self.isRefreshSelected();
            if (!ns.animation.pause) {
                self.scheduleFetch();
            }
        };
        $("#eventSettingsUpdateButton-" + ns.location.slice(1)).click(updateSettings);
    },

    redraw: function() {
        var ns = this.defaults;
        var self = this;
        ns.yLogs.domain([
            0,
            d3.max(ns.dataset.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(ns.location).select(".swim.axis")
            .transition()
            .duration(500);

        d3.select(ns.location).select(".y.axis")
            .transition()
            .duration(500)
            .call(ns.yAxis.scale(ns.yLogs));

        ns.graph.selectAll("circle")
            .transition().duration(500)
            .attr("class", function(d) {
                return d.swimlane === "unadmin" ? d.swimlane : d.level;
            })
            .attr("cx", function(d) {
                return ns.xScale(d.last_seen);
            })
            .attr("cy", function(d) {
                return {
                    logs: ns.yLogs(self.sums(d)),
                    ping: ns.ySwimLane(d.swimlane),
                    unadmin: ns.ySwimLane(d.swimlane) + ns.ySwimLane.rangeBand()
                }[d.swimlane];
            })
            .attr("r", function(d) {
                // Fixed radii for now.
                return d.swimlane === "logs" ? ns.r(64) : ns.r(20);
            })
            .style("opacity", function(d) {
                return d.swimlane === "unadmin" ?
                    0.8 : ns.filter[d.level] ? 0.5 : 1e-6;
            });

    },

    sums: function(datum) {
        var ns = this.defaults;
        // Return the sums for the filters that are on
        return d3.sum(ns.loglevel.domain().map(function(k) {
            return ns.filter[k] ? datum[k + "_count"] : 0;
        }));
    },

    update: function() {
        var ns = this.defaults;
        var self = this;
        var uri = ns.url;
        $(ns.location).find('#spinner').hide();

        // If we are paused or beyond the available jsons, exit
        if (ns.animation.pause) {
            return true;
        }

        // prevent updating when fetch is in process
        if (!this.collection.thisXhr.getResponseHeader('LogCountStart') || this.collection.thisXhr.getResponseHeader('LogCountEnd') === null) {
            return true;
        }

        // Set the animation to not step over itself
        ns.animation.pause = true;

        // var allthelogs = JSON.parse(response.responseText);
        var allthelogs = (this.collection.toJSON());
        // var xStart = moment(response.getResponseHeader('LogCountStart'));
        var xStart = moment(this.collection.thisXhr.getResponseHeader('LogCountStart'));
        var xEnd = moment(this.collection.thisXhr.getResponseHeader('LogCountEnd'));

        ns.xScale = ns.xScale.domain([xStart, xEnd]);

        // If we didn't receive any valid files, abort and pause
        if (allthelogs.length === 0) {
            ns.animation.pause = true;
            return;
        }

        /*
         * Shape the dataset
         *   - Convert datetimes to integer
         *   - Sort by last seen (from most to least recent)
         */
        ns.dataset = allthelogs
            .map(function(d) {
                d.created = moment(d.created);
                d.updated = moment(d.updated);
                d.last_seen = moment(d.last_seen);

                /*
                 * Figure out the higest priority level.
                 * That will determine its color later.
                 */
                var nonzero_levels = ns.loglevel.domain()
                    .map(function(l) {
                        return [l, d[l + "_count"]];
                    })
                    .filter(function(l) {
                        return (l[1] > 0);
                    })
                    .reverse();
                d.level = typeof(nonzero_levels[0]) === 'undefined' ? "none" : nonzero_levels[0][0];


                /*
                 * Figure out which bucket (logs, ping, or admin disabled)
                 * each node belongs to.
                 */
                d.swimlane = d.admin_disabled ?
                    "unadmin" : d.last_seen_method.toLowerCase();
                return d;
            })
            .sort(function(a, b) {
                return a.last_seen - b.last_seen;
            });

        /*
         * Axes
         *   - calculate the new domain.
         *   - adjust each axis to its new scale.
         */
        ns.pingAxis.scale(ns.xScale);
        ns.unadminAxis.scale(ns.xScale);

        ns.svg.select(".xping.axis")
            .call(ns.pingAxis);

        ns.svg.select(".xunadmin.axis")
            .call(ns.unadminAxis);

        ns.yLogs.domain([0, d3.max(ns.dataset.map(function(d) {
            // add up all the *_counts
            return d3.sum(ns.loglevel.domain().map(function(e) {
                return +d[e + "_count"];
            }));
        }))]);
        ns.yAxis.scale(ns.yLogs);
        ns.svg.select(".y.axis")
            .transition()
            .duration(500)
            .call(ns.yAxis);

        /*
         * New circles appear at the far right hand side of the graph.
         */
        var circle = ns.graph.selectAll("circle")
            .data(ns.dataset, function(d) {
                return d.uuid;
            });

        circle.enter()
            .append("circle")
            .attr("cx", function(d) {
                return ns.xScale.range()[1];
            })
            .attr("cy", function(d) {
                return ns.yLogs(self.sums(d));
            })
            .attr("r", ns.r(0))
            .attr("class", function(d) {
                return d.level;
            })
            .on("mouseover", ns.tooltip.show)
            .on("mouseout", ns.tooltip.hide);

        this.redraw();

        // This behaviour is not yet fully understood
        circle.exit()
            .attr("class", function(d) {
                return "older";
            });

        // Unpause the animation and rerun this function for the next frame
        ns.animation.pause = false;
        this.scheduleFetch();
        return true;
    },

    scheduleFetch: function() {
        var ns = this.defaults;
        var self = this;

        // double safety to prevent a pile up of setTimeouts
        // in addition to the check for undefined xhr data
        if (ns.scheduleTimeout !== undefined) {
            clearTimeout(ns.scheduleTimeout);
        }

        ns.scheduleTimeout = setTimeout(function() {
            self.collection.setXhr();
        }, ns.animation.delay * 1000);

    },

    appendHTML: function() {

        var ns = this.defaults;

        $(ns.location).append(
            '<div id = "goldstone-event-panel" class="panel panel-primary">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title"><i class="fa fa-tasks"></i> ' +
            ns.chartTitle +
            '<i class="fa fa-cog pull-right" data-toggle="modal"' +
            'data-target="#modal-' + ns.location.slice(1) + '"></i>' +
            '<i class="pull-right fa fa-info-circle panel-info"  id="goldstone-event-info"' +
            'style="opacity: 0.0"></i>' +
            '</h3>' +
            '</div>' +
            '<div class="panel-body" style="height:50px">' +
            '<div id="event-filterer" class="btn-group pull-right" data-toggle="buttons" align="center">' +
            '</div>' +
            '</div>' +
            '<div class="panel-body" style="height:550px">' +
            '<div id="goldstone-event-chart">' +
            '<div class="clearfix"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div id="modal-container-' + ns.location.slice(1) +
            '"></div>'

        );

        $('#modal-container-' + ns.location.slice(1)).append(

            // event settings modal
            '<div class="modal fade" id="modal-' + ns.location.slice(1) + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '<h4 class="modal-title" id="myModalLabel">Chart Settings</h4>' +
            '</div>' +
            '<div class="modal-body">' +
            '<form class="form-horizontal" role="form">' +
            '<div class="form-group">' +
            '<label for="eventAutoRefresh" class="col-sm-3 control-label">Refresh: </label>' +
            '<div class="col-sm-9">' +
            '<div class="input-group">' +
            '<span class="input-group-addon">' +
            '<input type="checkbox" class="eventAutoRefresh" checked>' +
            '</span>' +
            '<select class="form-control" id="eventAutoRefreshInterval">' +
            '<option value="5" selected>5 seconds</option>' +
            '<option value="15">15 seconds</option>' +
            '<option value="30">30 seconds</option>' +
            '<option value="60">1 minute</option>' +
            '<option value="300">5 minutes</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<div class="form-group">' +
            '<button type="button" id="eventSettingsUpdateButton-' + ns.location.slice(1) + '" class="btn btn-primary" data-dismiss="modal">Update</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'

        );
    }
});
