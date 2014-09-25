// view is linked to collection when instantiated in api_perf_report.html

var EventTimelineView = Backbone.View.extend({

    defaults: {
        dataset: [{
            "uuid": "15de9364-a220-4adf-af05-fd817c2bf2dc",
            "name": "controller-01",
            "created": "2014-09-22T17:53:23Z",
            "updated": "2014-09-24T21:21:43Z",
            "last_seen": "2014-09-24T21:21:43Z",
            "last_seen_method": "LOGS",
            "admin_disabled": false,
            "error_count": 0,
            "warning_count": 15,
            "info_count": 2454,
            "audit_count": 144,
            "debug_count": 0,
            "polymorphic_ctype": 13,
            "relationships": []
        }, {
            "uuid": "5ddb70a0-ef3a-44ed-98ac-953ebb31bcee",
            "name": "compute-01",
            "created": "2014-09-22T17:53:24Z",
            "updated": "2014-09-24T21:18:04Z",
            "last_seen": "2014-09-24T21:18:04Z",
            "last_seen_method": "PING",
            "admin_disabled": false,
            "error_count": 0,
            "warning_count": 0,
            "info_count": 0,
            "audit_count": 0,
            "debug_count": 0,
            "polymorphic_ctype": 13,
            "relationships": []
        }, {
            "uuid": "c40e11d1-9207-402e-8ac6-11c505c844c9",
            "name": "compute-02",
            "created": "2014-09-22T17:53:21Z",
            "updated": "2014-09-24T21:21:04Z",
            "last_seen": "2014-09-24T21:21:04Z",
            "last_seen_method": "PING",
            "admin_disabled": false,
            "error_count": 0,
            "warning_count": 4,
            "info_count": 30,
            "audit_count": 39,
            "debug_count": 0,
            "polymorphic_ctype": 13,
            "relationships": []
        }]
    },

    initialize: function(options) {
        console.log('in event initialize');

        this.options = options || {};
        this.defaults = _.clone(this.defaults); 
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.width = options.width;
        this.defaults.h = options.h;

        var ns = this.defaults;
        var self = this;

        ns.animation = {
            pause: false,
            delay: 5,
            index: 1
        };

        /*
        var appendSpinnerLocation = ns.location;

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.height / 2)
            });
        });
        */

        this.initSettingsForm();


        $(ns.location).append(
            '<div id = "goldstone-event-panel" class="panel panel-primary">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title"><i class="fa fa-tasks"></i> ' +
            'Event Timeline' +
            '<i class="fa fa-cog pull-right" data-toggle="modal"' +
            'data-target="#eventTimelineSettingsModal"></i>' +
            '<i class="pull-right fa fa-info-circle panel-info"  id="goldstone-event-info"' +
            'style="opacity: 0.0"></i>' +
            '</h3>' +
            '</div>' +
            '<div class="panel-body" style="height:50px">' +
            '<div id="event-filterer" class="btn-group pull-right" data-toggle="buttons" align="center">' +
            '</div>' +
            '</div><!--.btn-group-->' +
            '<div class="panel-body" style="height:550px">' +
            '<div id="goldstone-event-chart">' +
            '<div class="clearfix"></div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );

        ns.margin = {
            top: 25,
            bottom: 25,
            right: 40,
            left: 60
        };

        ns.w = ns.width;
        ns.mw = ns.w - ns.margin.left - ns.margin.right;
        ns.mh = ns.h.main - ns.margin.top - ns.margin.bottom;

        ns.r = d3.scale.sqrt();
        ns.loglevel = d3.scale.ordinal()
            .domain(["debug", "audit", "info", "warning", "error"])
            .range(["#6a51a3", "#2171b5", "#238b45", "#d94801", "#cb181d"]);

        ns.pingAxis = d3.svg.axis()
            .orient("top")
            .ticks(7)
            .tickFormat(d3.time.format("%H:%M:%S"));
        ns.unadminAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(7)
            .tickFormat(d3.time.format("%H:%M:%S"));
        ns.xScale = d3.time.scale()
            .range([ns.margin.left, ns.mw - ns.margin.right])
            .nice()
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




        ns.filter = {
            none: true,
            debug: true,
            audit: true,
            info: true,
            warning: true,
            error: true
        };


        // The log-level buttons toggle the specific log level into the total count

        d3.select("#event-filterer").selectAll("input")
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
            })
            .append("input")
            .attr("type", "checkbox");


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

        // ns.dataset = null;

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
        d3.select(".swim.axis")
            .call(ns.swimAxis.scale(ns.ySwimLane));

        // Transform the swim lane ticks into place
        d3.select(".swim.axis").selectAll("text")
            .attr("transform", function(d, i) {
                // The "ping" label needs to be nudged upwards
                // The "unadmin" label needs to be nudged downwards
                // The "logs" label needs to be nudged to the left
                var nudge = ns.ySwimLane.rangeBand() / 2 * (d === "unadmin" ? 1 : d === "ping" ? -1 : -0.5);
                var l = ns.ySwimLane.domain().length;
                var ret = "translate(0," + nudge + ")";
                // Rotate the middle label, as it covers the widest swim lane
                return ((i > 0 && i < l - 1) ? "rotate(" + (i === Math.floor(l / 2) ? -90 : 0) + ") " : "") + ret;
            });

        // this.initSvg();
        this.update(this.ns);

    },

    isRefreshSelected: function() {
        console.log('in event isRefreshSelected');

        return $(".eventAutoRefresh").prop("checked");
    },

    refreshInterval: function() {
        console.log('in event refreshInterval');

        return $("select#eventAutoRefreshInterval").val();
    },


    initSettingsForm: function() {
        var self = this;
        var ns = this.defaults;

        console.log('in event initSettingsForm');

        var updateSettings = function() {
            ns.animation.delay = self.refreshInterval();
            ns.animation.pause = !self.isRefreshSelected();
            if (!ns.animation.pause) {
                // d3.timer(self.update.bind(this, ns), ns.animation.delay * 1000);

                setTimeout(function() {
                    self.update();
                }, ns.animation.delay * 1000);

            }
        };
        $("#eventSettingsUpdateButton").click(updateSettings);
    },


    redraw: function() {
        console.log('in event redraw');

        var ns = this.defaults;
        var self = this;


        ns.yLogs.domain([
            0,
            d3.max(ns.dataset.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(".swim.axis")
            .transition()
            .duration(500);

        d3.select(".y.axis")
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
        console.log('in event sums');
        var ns = this.defaults;
        // Return the sums for the filters that are on
        return d3.sum(ns.loglevel.domain().map(function(k) {
            return ns.filter[k] ? datum[k + "_count"] : 0;
        }));
    }, // sums()

    update: function() {
        console.log('in event update');

        var ns = this.defaults;
        var self = this;
        var uri = ns.url;

        // If we are paused or beyond the available jsons, exit

        if (ns.animation.pause) {
            console.log('in pause - not updating');
            return true;
        }

        console.log('updating');

        // Set the animation to not step over itself
        ns.animation.pause = true;

        d3.xhr(uri, function(error, response) {
            var allthelogs = JSON.parse(response.responseText);
            var xStart = moment(response.getResponseHeader('LogCountStart'));
            var xEnd = moment(response.getResponseHeader('LogCountEnd'));

            ns.xScale = ns.xScale.domain([xStart, xEnd]);

            // If we didn't receive any valid files, abort and pause
            // there may need to be a user notification added here at
            // some point.  We'll see.

            // TODO should paint the empty chart anyway, then start refreshing
            if (typeof allthelogs.results === "undefined") {
                ns.animation.pause = true;
                return;
            }


            /*
             * Shape the dataset
             *   - Convert datetimes to integer
             *   - Sort by last seen (from most to least recent)
             */
            ns.dataset = allthelogs.results
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

            self.redraw();

            // This behaviour is not yet fully understood
            circle.exit()
                .attr("class", function(d) {
                    return "older";
                });

            // Increment the index
            // This will probably go away for production data
            ns.animation.index += 1;

            // Unpause the animation and rerun this function for the next frame
            ns.animation.pause = false;
            // d3.timer(ns.self.update.bind(this, ns), ns.animation.delay * 1000);

            setTimeout(function() {
                self.update();
            }, ns.animation.delay * 1000);

            return true;
        });
    }

});
