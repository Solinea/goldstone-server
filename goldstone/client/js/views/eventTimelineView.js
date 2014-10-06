// view is linked to collection when instantiated in goldstone_discover.html

var EventTimelineView = Backbone.View.extend({
    defaults: {
        h: {
            "main": 150,
            "padding": 50,
            "tooltipPadding": 40
        }
    },

    initialize: function(options) {

        this.options = options || {};
        this.defaults = _.clone(this.defaults); 
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.chartTitle = options.chartTitle;
        this.defaults.width = options.width;

        var ns = this.defaults;
        var self = this;

        ns.animation = {
            pause: false,
            delay: 5
        };

        var appendSpinnerLocation = ns.location;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.h.main / 2 + ns.h.padding)
            });
        });

        this.collection.on('sync', this.update, this);
        this.appendHTML();
        this.initSettingsForm();

        ns.filter = {

            // "Filter Label":{
            // active: [true/false]
            // id: "(css id for loglevel_buttons.css)"
            // eventName: "(matches event type)"
            // }

            "Error": {
                active: true,
                id: "error",
                eventName: "Syslog Error"

            }
        };

        ns.margin = {
            top: 25,
            bottom: 25,
            right: 20,
            left: 40
        };

        ns.w = ns.width;
        ns.mw = ns.w - ns.margin.left - ns.margin.right;
        ns.mh = ns.h.main - ns.margin.top - ns.margin.bottom;

        // ns.r = d3.scale.sqrt();
        ns.loglevel = d3.scale.ordinal()
            .domain(["info", "warning", "error"])
            .range(["#d94801", "#238b45", "#2171b5"]);
        /* removed: "#6a51a3", "#cb181d"*/

        ns.topAxis = d3.svg.axis()
            .orient("top")
            .ticks(5)
            .tickFormat(d3.time.format("%a %b %e %Y"));
        ns.bottomAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(8)
            .tickFormat(d3.time.format("%H:%M:%S"));
        ns.xScale = d3.time.scale()
            .range([ns.margin.left, ns.w - ns.margin.right - 10]);

        // The log-level buttons toggle the specific log level into the total count

        d3.select(ns.location).select("#event-filterer").selectAll("input")
            .data(d3.keys(ns.filter), function(d) {
                return d;
            })
            .enter().append("div")
            .attr("class", "btn-group")
            .append("label")
            .attr("id", function(d) {
                return d;
            })
            .attr("class", function(d) {
                return "btn btn-log-" + ns.filter[d].id;
            })
            .classed("active", function(d) {
                return ns.filter[d].active;
            })
            .attr("type", "button")
            .text(function(d) {
                return d;
            })
            .on("click", function(d) {
                ns.filter[d].active = !ns.filter[d].active;
                self.redraw();
            });

        /*
         * The graph and axes
         */

        ns.svg = d3.select(ns.location).select(".panel-body").append("svg")
            .attr("width", ns.w + ns.margin.right)
            .attr("height", ns.h.main + (ns.h.padding + ns.h.tooltipPadding));

        // tooltipPadding adds room for tooltip popovers
        ns.graph = ns.svg.append("g").attr("id", "graph")
            .attr("transform", "translate(0," + ns.h.tooltipPadding + ")");

        ns.graph.append("g")
            .attr("class", "xUpper axis")
            .attr("transform", "translate(0," + ns.h.padding + ")");

        ns.graph.append("g")
            .attr("class", "xLower axis")
            .attr("transform", "translate(0," + ns.h.main + ")");

        ns.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {

                d.uuid = d.uuid || 'No uuid logged';
                d.message = d.message || 'No message logged';
                d.event_type = d.event_type || 'No event type logged';
                d.created = d.created || 'No date logged';

                return d.event_type + " (click event line to persist popup info)<br>" +
                    "uuid: " + d.uuid + "<br>" +
                    "Created: " + moment(d.created).fromNow() + "<br>" +
                    "Message: " + d.message.substr(0, 64) + "<br>";
            });

        ns.graph.call(ns.tooltip);

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

    opacityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (ns.filter[filterType].eventName === d.event_type && !ns.filter[filterType].active) {
                return 0;
            }
        }
        return 0.8;
    },

    visibilityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (ns.filter[filterType].eventName === d.event_type && !ns.filter[filterType].active) {
                return "hidden";
            }
        }
        return "visible";
    },

    redraw: function() {
        var ns = this.defaults;
        var self = this;

        ns.graph.selectAll("rect")
            .transition().duration(500)
            .attr("x", function(d) {
                return ns.xScale(d.created);
            })
            .style("opacity", function(d) {
                return self.opacityByFilter(d);
            })
            .style("visibility", function(d) {
                // to avoid showing popovers for hidden lines
                return self.visibilityByFilter(d);
            });
    },

    update: function() {
        var ns = this.defaults;
        var self = this;
        $(ns.location).find('#spinner').hide();

        // If we are paused or beyond the available jsons, exit
        if (ns.animation.pause) {
            return true;
        }

        // Set the animation to not step over itself
        ns.animation.pause = true;
        var allthelogs = (this.collection.toJSON());

        var xEnd = moment(d3.min(_.map(allthelogs, function(evt) {
            return evt.created;
        })));

        var xStart = moment(d3.max(_.map(allthelogs, function(evt) {
            return evt.created;
        })));

        ns.xScale = ns.xScale.domain([xEnd._d, xStart._d]);

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
                d.created = moment(d.created)._d;
                return d;
            });

        /*
         * Axes
         *   - calculate the new domain.
         *   - adjust each axis to its new scale.
         */

        ns.topAxis.scale(ns.xScale);
        ns.bottomAxis.scale(ns.xScale);

        ns.svg.select(".xUpper.axis")
            .transition()
            .call(ns.topAxis);

        ns.svg.select(".xLower.axis")
            .transition()
            .call(ns.bottomAxis);

        /*
         * New rectangles appear at the far right hand side of the graph.
         */
        var rectangle = ns.graph.selectAll("rect")
            .data(ns.dataset, function(d) {
                return d.uuid;
            });

        // enters at wider width and transitions to lesser width for a
        // dynamic resizing effect
        rectangle.enter()
            .append("rect")
            .attr("x", ns.width)
            .attr("y", ns.h.padding + 1)
            .attr("width", 5)
            .attr("height", ns.h.main - ns.h.padding - 2)
            .attr("class", function(d) {
                for (var evt in ns.filter) {
                    if (ns.filter[evt].eventName === d.event_type) {
                        return ns.filter[evt].id;
                    }
                }
                return 'none';
            })
            .style("opacity", function(d) {
                return self.opacityByFilter(d);
            })
            .style("visibility", function(d) {
                // to avoid showing popovers for hidden lines
                return self.visibilityByFilter(d);
            })
            .on("mouseover", ns.tooltip.show)
            .on("click", function() {
                if (ns.tooltip.pause === undefined) {
                    ns.tooltip.pause = true;
                } else {
                    ns.tooltip.pause = !ns.tooltip.pause;
                }
                if (ns.tooltip.pause === false) {
                    ns.tooltip.hide();
                }
            })
            .on("mouseout", function() {
                if (ns.tooltip.pause) {
                    return;
                }
                ns.tooltip.hide();
            });

        rectangle
            .transition()
            .attr("width", 2)
            .attr("x", function(d) {
                return ns.xScale(d.created);
            });

        rectangle.exit().remove();

        // Unpause the animation and rerun this function for the next frame
        ns.animation.pause = false;

        this.scheduleFetch();
        return true;
    },

    scheduleFetch: function() {
        var ns = this.defaults;
        var self = this;

        // to prevent a pile up of setTimeouts
        if (ns.scheduleTimeout !== undefined) {
            clearTimeout(ns.scheduleTimeout);
        }

        ns.scheduleTimeout = setTimeout(function() {

            self.collection.fetch({
                remove: false
            });

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
            '<div class="panel-body" style="height:' + (ns.h.padding * 2) + 'px">' +
            '<div id="event-filterer" class="btn-group pull-left" data-toggle="buttons" align="center">' +
            '</div>' +
            // '<div class="pull-right">Search:&nbsp; <input class="pull-right" id="goldstone-event-search"></input></div>' +
            '</div>' +
            '<div class="panel-body" style="height:' + ns.h.main + 'px">' +
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
