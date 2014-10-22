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

// view is linked to collection when instantiated in goldstone_discover.html

var EventTimelineView = Backbone.View.extend({
    defaults: {
        h: {
            "main": 100,
            "padding": 30,
            "tooltipPadding": 50
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
            pause: undefined,
            delay: null
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

        ns.margin = {
            top: 25,
            bottom: 25,
            right: 20,
            left: 40
        };

        ns.w = ns.width;
        ns.mw = ns.w - ns.margin.left - ns.margin.right;
        ns.mh = ns.h.main - ns.margin.top - ns.margin.bottom;

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


        /*
         * colors
         */

        // you can change the value in colorArray to select
        // a particular number of different colors
        var colorArray = new GoldstoneColors().get('colorSets');
        ns.color = d3.scale.ordinal().range(colorArray.distinct[5]);

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
            .offset(function() {
                var leftOffset;
                // [top-offset, left-offset]
                var halfToolWidth = 260;
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

                d.id = d.id || '';
                d.message = d.message || 'No message logged';
                d.event_type = d.event_type || 'No event type logged';
                d.created = d.created || 'No date logged';

                return d.event_type + " (click event line to persist popup info)<br>" +
                    "uuid: " + d.id + "<br>" +
                    "Created: " + d.created + "<br>" +
                    "Message: " + d.message + "<br>";
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

            if (ns.animation.pause === false) {
                self.scheduleFetch();
            }

        };
        $("#eventSettingsUpdateButton-" + ns.location.slice(1)).click(updateSettings);

        // set initial values for delay and pause based on modal settings
        updateSettings();
    },

    opacityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (filterType === d.event_type && !ns.filter[filterType].active) {
                return 0;
            }
        }
        return 0.8;
    },

    visibilityByFilter: function(d) {
        var ns = this.defaults;
        for (var filterType in ns.filter) {
            if (filterType === d.event_type && !ns.filter[filterType].active) {
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

        var allthelogs = (this.collection.toJSON());

        var xEnd = moment(d3.min(_.map(allthelogs, function(evt) {
            return evt.created;
        })));

        var xStart = moment(d3.max(_.map(allthelogs, function(evt) {
            return evt.created;
        })));

        ns.xScale = ns.xScale.domain([xEnd._d, xStart._d]);

        // reschedule next fetch at selected interval
        this.scheduleFetch();

        // If we didn't receive any valid files, append "No Data Returned"
        if (allthelogs.length === 0) {

            // if 'no data returned' already exists on page, don't reapply it
            if ($(ns.location).find('#noDataReturned').length) {
                return;
            }

            $('<span id="noDataReturned">No Data Returned</span>').appendTo(ns.location)
                .css({
                    'position': 'relative',
                    'margin-left': $(ns.location).width() / 2 - 14,
                    'top': -$(ns.location).height() / 2
                });

            return;
        }

        // remove No Data Returned once data starts flowing again
        if ($(ns.location).find('#noDataReturned').length) {
            $(ns.location).find('#noDataReturned').remove();
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


        // compile an array of the unique event types
        ns.uniqueEventTypes = _.uniq(_.map(allthelogs, function(item) {
            return item.event_type;
        }));

        // populate ns.filter based on the array of unique event types
        // add uniqueEventTypes to filter modal
        ns.filter = ns.filter || {};

        // clear out the modal and reapply based on the unique events
        if ($(ns.location).find('#populateEventFilters').length) {
            $(ns.location).find('#populateEventFilters').empty();
        }

        _.each(ns.uniqueEventTypes, function(item) {

            // regEx to create separate words out of the event types
            // GenericSyslogError --> Generic Syslog Error
            var re = /([A-Z])/g;
            itemSpaced = item.replace(re, ' $1').trim();

            ns.filter[item] = ns.filter[item] || {
                active: true,
                color: ns.color(ns.uniqueEventTypes.indexOf(item) % ns.color.range().length),
                displayName: itemSpaced
            };

            var addCheckIfActive = function(item) {
                if (ns.filter[item].active) {
                    return 'checked';
                } else {
                    return '';
                }
            };
            var checkMark = addCheckIfActive(item);

            $(ns.location).find('#populateEventFilters').
            append(

                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div class="input-group">' +
                '<span class="input-group-addon"' +
                'style="opacity: 0.8; background-color:' + ns.filter[item].color + ';">' +
                '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                '</span>' +
                '<span type="text" class="form-control">' + itemSpaced + '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        $(ns.location).find('#populateEventFilters :checkbox').on('click', function() {

            var checkboxId = this.id;
            ns.filter[this.id].active = !ns.filter[this.id].active;
            self.redraw();

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
                return d.id;
            });

        // enters at wider width and transitions to lesser width for a
        // dynamic resizing effect
        rectangle.enter()
            .append("rect")
            .attr("x", ns.width)
            .attr("y", ns.h.padding + 1)
            .attr("width", 5)
            .attr("height", ns.h.main - ns.h.padding - 2)
            .attr("class", "single-event")
            .style("opacity", function(d) {
                return self.opacityByFilter(d);
            })
            .style("visibility", function(d) {
                // to avoid showing popovers for hidden lines
                return self.visibilityByFilter(d);
            })
            .attr("fill", function(d) {
                return ns.color(ns.uniqueEventTypes.indexOf(d.event_type) % ns.color.range().length);
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

        return true;
    },

    scheduleFetch: function() {
        var ns = this.defaults;
        var self = this;

        // to prevent a pile up of setTimeouts
        if (ns.scheduleTimeout !== undefined) {
            clearTimeout(ns.scheduleTimeout);
        }

        if (ns.animation.pause) {
            return true;
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

            // filter icon
            '<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + ns.location.slice(1) + '"></i>' +

            // cog icon
            '<i class="fa fa-cog pull-right" data-toggle="modal"' +
            'data-target="#modal-settings-' + ns.location.slice(1) + '" style="margin-right: 30px;"></i>' +

            // info-circle icon
            '<i class="fa fa-info-circle panel-info pull-right "  id="goldstone-event-info"' +
            'style="margin-right: 30px;"></i>' +
            '</h3>' +
            '</div>' +
            '<div class="panel-body" style="height:' + (ns.h.padding * 2) + 'px">' +
            '<div id="event-filterer" class="btn-group pull-left" data-toggle="buttons" align="center">' +
            '</div>' +
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
            '<div class="modal fade" id="modal-settings-' + ns.location.slice(1) + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
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

        // add 2nd modal here:
        $('#modal-container-' + ns.location.slice(1)).append(

            // event settings modal
            '<div class="modal fade" id="modal-filter-' + ns.location.slice(1) + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +

            // header
            '<div class="modal-header">' +

            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
            '<h4 class="modal-title" id="myModalLabel">Event Type Filters</h4>' +
            '</div>' +

            // body
            '<div class="modal-body">' +
            '<h5>Uncheck event-type to hide from display</h5><br>' +
            '<div id="populateEventFilters"></div>' +


            '</div>' +

            // footer
            '<div class="modal-footer">' +
            '<button type="button" id="eventFilterUpdateButton-' + ns.location.slice(1) + '" class="btn btn-primary" data-dismiss="modal">Exit</button>' +
            '</div>' +

            '</div>' +
            '</div>' +
            '</div>'

        );



    }
});
