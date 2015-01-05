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

var EventTimelineView = GoldstoneBaseView.extend({
    defaults: {
        margin: {
            top: 25,
            bottom: 25,
            right: 20,
            left: 40
        },

        h: {
            "main": 100,
            "padding": 30,
            "tooltipPadding": 50
        }
    },

    processOptions: function() {

        this.defaults.colorArray = new GoldstoneColors().get('colorSets');
        this.defaults.url = this.collection.url;
        this.el = this.options.el;
        this.defaults.chartTitle = this.options.chartTitle;
        this.defaults.width = this.options.width;
        this.defaults.delay = null;

    },

    processListeners: function() {
        this.collection.on('sync', this.update, this);
        this.collection.on('error', this.dataErrorMessage, this);
    },

    showSpinner: function() {
        var ns = this.defaults;
        var self = this;

        ns.spinnerDisplay = 'inline';

        var appendSpinnerLocation = this.el;
        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.h.main / 2 + ns.h.padding),
                'display': ns.spinnerDisplay
            });
        });
    },

    initialize: function(options) {

        EventTimelineView.__super__.initialize.apply(this, arguments);

        this.setInfoButtonPopover();
        this.setGlobalLookbackListeners();
        this.updateSettings();
    },

    standardInit: function() {
        var ns = this.defaults;
        var self = this;

        ns.mw = ns.width - ns.margin.left - ns.margin.right;
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
            .range([ns.margin.left, ns.width - ns.margin.right - 10]);


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

        ns.svg = d3.select(this.el).select(".panel-body").append("svg")
            .attr("width", ns.width + ns.margin.right)
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

                if (d.message.length > 280) {
                    d.message = d.message.slice(0, 300) + "...";
                }

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
        return $('.global-refresh-selector .form-control').val() >= 0;
    },

    refreshInterval: function() {
        refreshSeconds = $('.global-refresh-selector .form-control').val();
        // refreshSeconds will be a string
        return parseInt(refreshSeconds, 10);
    },

    lookbackRange: function() {
        var lookbackMinutes;
        lookbackMinutes = $('.global-lookback-selector .form-control').val();
        return parseInt(lookbackMinutes, 10);
    },

    updateSettings: function() {
        var ns = this.defaults;
        ns.delay = this.refreshInterval();
        ns.lookbackRange = this.lookbackRange();
    },

    setGlobalLookbackListeners: function() {
        var self = this;
        var ns = this.defaults;

        $('.global-lookback-selector .form-control').on('change', function() {
            self.updateSettings();
            self.fetchNowWithReset();

        });
        $('.global-refresh-selector .form-control').on('change', function() {
            self.updateSettings();
            self.scheduleFetch();

        });
    },

    fetchNowWithReset: function() {
        var ns = this.defaults;
        this.collection.urlUpdate(ns.lookbackRange);
        this.collection.fetchWithReset();
    },

    fetchNowNoReset: function() {
        var ns = this.defaults;
        this.collection.urlUpdate(ns.lookbackRange);
        this.collection.fetchNoReset();
    },

    clearScheduledFetch: function() {
        var ns = this.defaults;
        clearTimeout(ns.scheduleTimeout);
    },

    scheduleFetch: function() {
        var ns = this.defaults;
        var self = this;

        this.clearScheduledFetch();
        var timeoutDelay = ns.delay * 1000;

        if (timeoutDelay < 0) {
            return true;
        }

        ns.scheduleTimeout = setTimeout(function() {
            self.fetchNowNoReset();
        }, timeoutDelay);
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

    dataErrorMessage: function(message, errorMessage) {

        EventTimelineView.__super__.dataErrorMessage.apply(this, arguments);

        // reschedule next fetch at selected interval
        this.scheduleFetch();
    },

    update: function() {
        var ns = this.defaults;
        var self = this;

        this.hideSpinner();

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
        if (this.checkReturnedDataSet(allthelogs) === false) {
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


        // compile an array of the unique event types
        ns.uniqueEventTypes = _.uniq(_.map(allthelogs, function(item) {
            return item.event_type;
        }));

        // populate ns.filter based on the array of unique event types
        // add uniqueEventTypes to filter modal
        ns.filter = ns.filter || {};

        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(ns.uniqueEventTypes, function(item) {

            // regEx to create separate words out of the event types
            // GenericSyslogError --> Generic Syslog Error
            var re = /([A-Z])/g;
            if (item === undefined) {
                item = 'UnspecifiedErrorType';
            }
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

            $(this.el).find('#populateEventFilters')
                .append(
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
        }, this);

        $(this.el).find('#populateEventFilters :checkbox').on('click', function() {

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

    render: function() {
        this.$el.html(this.template());
        // $('#modal-container-' + this.el.slice(1)).append(this.modal1());
        $('#modal-container-' + this.el.slice(1)).append(this.modal2());
        return this;
    },

    setInfoButtonPopover: function() {

        var infoButtonText = new InfoButtonText().get('infoText');

        // attach click listeners to chart heading info button
        $('#goldstone-event-info').popover({
            trigger: 'manual',
            content: '<div class="infoButton">' +
                infoButtonText.eventTimeline +
                '</div>',
            placement: 'bottom',
            html: 'true'
        })
            .on("click", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('toggle');
            }).on("mouseout", function(d) {
                var targ = "#" + d.target.id;
                $(targ).popover('hide');
            });
    },

    template: _.template(
        '<div id = "goldstone-event-panel" class="panel panel-primary">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-tasks"></i> <%= this.defaults.chartTitle %>' +

        // cog icon
        // '<i class="fa fa-cog pull-right" data-toggle="modal"' +
        // 'data-target="#modal-settings-<%= this.el.slice(1) %>' +
        // '"></i>' +

        // filter icon
        '<i class="fa fa-filter pull-right" data-toggle="modal"' +
        'data-target="#modal-filter-<%= this.el.slice(1) %>' + '" style="margin-right: 15px;"></i>' +

        // info-circle icon
        '<i class="fa fa-info-circle panel-info pull-right "  id="goldstone-event-info"' +
        'style="margin-right: 15px;"></i>' +
        '</h3></div>' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="panel-body" style="height:<%= (this.defaults.h.padding * 2) %>' +
        'px">' +
        '<div id="event-filterer" class="btn-group pull-left" data-toggle="buttons" align="center">' +
        '</div>' +
        '</div>' +
        '<div class="panel-body" style="height:<%= this.defaults.h.main %>' + 'px">' +
        '<div id="goldstone-event-chart">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div id="modal-container-<%= this.el.slice(1) %>' +
        '"></div>'

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
        '<h4 class="modal-title" id="myModalLabel">Event Type Filters</h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5>Uncheck event-type to hide from display</h5><br>' +
        '<div id="populateEventFilters"></div>' +


        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal">Exit</button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    ),

    modal1: _.template(
        // event settings modal
        // don't render if using global refresh/lookback
        '<div class="modal fade" id="modal-settings-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title" id="myModalLabel">Chart Range Settings</h4>' +
        '</div>' +
        '<div class="modal-body">' +

        // insert start/end form elements:

        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="lookbackRange" class="col-sm-2 control-label">Lookback: </label>' +
        '<div class="col-sm-5">' +
        '<div class="input-group">' +
        '<select class="form-control" id="lookbackRange">' +
        '<option value="15">15 minutes</option>' +
        '<option value="60" selected>1 hour</option>' +
        '<option value="360">6 hours</option>' +
        '<option value="1440">1 day</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +

        // end of new start/end elements

        '<form class="form-horizontal" role="form">' +
        '<div class="form-group">' +
        '<label for="eventAutoRefresh" class="col-sm-2 control-label">Refresh: </label>' +
        '<div class="col-sm-5">' +
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
        '<button type="button" id="eventSettingsUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal">Update</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )
});
