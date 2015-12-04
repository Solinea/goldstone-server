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
Instantiated on topologyPageView as:

var eventTimelineChart = new EventTimelineCollection({});

this.eventTimelineChartView = new EventTimelineView({
    collection: this.eventTimelineChart,
    el: '#goldstone-discover-r1-c1',
    chartTitle: goldstone.translate('Event Timeline'),
    width: $('#goldstone-discover-r1-c1').width()
});
*/

var EventTimelineView = GoldstoneBaseView.extend({
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
    },

    instanceSpecificInit: function() {
        this.processOptions();
        // sets page-element listeners, and/or event-listeners
        this.processListeners();
        // creates the popular mw / mh calculations for the D3 rendering
        this.processMargins();
        // Appends this basic chart template, usually overwritten
        this.render();
        // basic assignment of variables to be used in chart rendering
        this.standardInit();
        // appends spinner to el
        this.setSpinner();
        this.showSpinner();
    },

    processListeners: function() {

        var self = this;
        this.listenTo(this.collection, 'sync', this.update);
        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.on('lookbackSelectorChanged', function() {
            self.getGlobalLookbackRefresh();
            self.fetchNowWithReset();
        });

        this.on('lookbackIntervalReached', function() {
            self.getGlobalLookbackRefresh();
            self.fetchNowNoReset();
        });
    },

    processMargins: function() {
        this.mw = this.width - this.margin.left - this.margin.right;
        this.mh = this.height - this.margin.top - this.margin.bottom;
    },

    setSpinner: function() {

        // appends spinner with sensitivity to the fact that the View object
        // may render before the .gif is served by django. If that happens,
        // the hideSpinner method will set the 'display' css property to
        // 'none' which will prevent it from appearing on the page

        var self = this;
        this.spinnerDisplay = 'inline';

        var appendSpinnerLocation;
        if (this.spinnerPlace) {
            appendSpinnerLocation = $(this.el).find(this.spinnerPlace);
        } else {
            appendSpinnerLocation = this.el;
        }

        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            $(this).appendTo(appendSpinnerLocation).css({
                'position': 'relative',
                'margin-left': (self.width / 2),
                'margin-top': (self.h.padding + self.h.tooltipPadding),
                'display': self.spinnerDisplay
            });
        });
    },

    standardInit: function() {
        var self = this;

        self.mw = self.width - self.margin.left - self.margin.right;
        self.mh = self.h.main - self.margin.top - self.margin.bottom;

        self.topAxis = d3.svg.axis()
            .orient("top")
            .ticks(3)
            .tickFormat(d3.time.format("%a %b %e %Y"));
        self.bottomAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(5)
            .tickFormat(d3.time.format("%H:%M:%S"));
        self.xScale = d3.time.scale()
            .range([self.margin.left, self.width - self.margin.right - 10]);


        /*
         * colors
         */

        // you can change the value in colorArray to select
        // a particular number of different colors
        var colorArray = new GoldstoneColors().get('colorSets');
        self.color = d3.scale.ordinal().range(colorArray.distinct[3]);

        /*
         * The graph and axes
         */

        self.svg = d3.select(this.el).select(".panel-body").append("svg")
            .attr("width", self.width + self.margin.right)
            .attr("height", self.h.main + (self.h.padding + self.h.tooltipPadding));

        // tooltipPadding adds room for tooltip popovers
        self.graph = self.svg.append("g").attr("id", "graph")
            .attr("transform", "translate(0," + self.h.tooltipPadding + ")");

        self.graph.append("g")
            .attr("class", "xUpper axis")
            .attr("transform", "translate(0," + self.h.padding + ")");

        self.graph.append("g")
            .attr("class", "xLower axis")
            .attr("transform", "translate(0," + self.h.main + ")");

        self.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .offset(function() {
                var leftOffset;
                // [top-offset, left-offset]
                var halfToolWidth = 260;
                if (this.getBBox().x < halfToolWidth) {
                    leftOffset = halfToolWidth - this.getBBox().x;
                } else if (this.getBBox().x > self.width - halfToolWidth) {
                    leftOffset = -(halfToolWidth - (self.width - this.getBBox().x));
                } else {
                    leftOffset = 0;
                }
                return [0, leftOffset];
            })
            .html(function(d) {

                d.doc_type = d.doc_type || 'No event type logged';
                d.initiator_name = d.traits.initiator_name || 'No initiator logged';
                d.target_name = d.traits.target_name || 'No target logged';
                d.outcome = d.traits.outcome || 'No outcome logged';
                d.timestamp = d.timestamp || 'No date logged';

                return "" +
                    "Doc type: " + d.doc_type + "<br>" +
                    "Initiator: " + d.initiator_name + "<br>" +
                    "Target: " + d.target_name + "<br>" +
                    "Outcome: " + d.outcome + "<br>" +
                    "Created: " + d.timestamp + "<br>";
            });

        self.graph.call(self.tooltip);

    },

    fetchNowWithReset: function() {
        this.showSpinner();
        this.collection.urlUpdate(this.globalLookback);
        this.collection.fetchWithReset();
    },

    fetchNowNoReset: function() {
        this.showSpinner();
        this.collection.urlUpdate(this.globalLookback);
        this.collection.fetchNoReset();
    },

    opacityByFilter: function(d) {
        for (var filterType in this.filter) {
            if (filterType === d.doc_type && !this.filter[filterType].active) {
                return 0;
            }
        }
        return 0.8;
    },

    visibilityByFilter: function(d) {
        for (var filterType in this.filter) {
            if (filterType === d.doc_type && !this.filter[filterType].active) {
                return "hidden";
            }
        }
        return "visible";
    },

    update: function() {
        var self = this;

        this.hideSpinner();

        var allthelogs = (this.collection.toJSON());

        var xEnd = moment(d3.min(_.map(allthelogs, function(evt) {
            return evt.timestamp;
        })));

        var xStart = moment(d3.max(_.map(allthelogs, function(evt) {
            return evt.timestamp;
        })));

        self.xScale = self.xScale.domain([xEnd._d, xStart._d]);

        // If we didn't receive any valid files, append "No Data Returned"
        this.checkReturnedDataSet(allthelogs);

        /*
         * Shape the dataset
         *   - Convert datetimes to integer
         *   - Sort by last seen (from most to least recent)
         */
        self.dataset = allthelogs
            .map(function(d) {
                d.timestamp = moment(d.timestamp)._d;
                return d;
            });


        // compile an array of the unique event types
        self.uniqueEventTypes = _.uniq(_.map(allthelogs, function(item) {
            return item.doc_type;
        }));

        // populate self.filter based on the array of unique event types
        // add uniqueEventTypes to filter modal
        self.filter = self.filter || {};

        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(self.uniqueEventTypes, function(item) {

            // regEx to create separate words out of the event types
            // GenericSyslogError --> Generic Syslog Error
            var re = /([A-Z])/g;
            if (item === undefined) {
                item = 'UnspecifiedErrorType';
            }
            itemSpaced = item.replace(re, ' $1').trim();

            self.filter[item] = self.filter[item] || {
                active: true,
                // color: self.color(self.uniqueEventTypes.indexOf(item) % self.color.range().length),
                displayName: itemSpaced
            };

            var addCheckIfActive = function(item) {
                if (self.filter[item].active) {
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
                    'style="opacity: 0.8; background-color:' + self.filter[item].color + ';">' +
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
            self.filter[this.id].active = !self.filter[this.id].active;
            self.redraw();

        });

        /*
         * Axes
         *   - calculate the new domain.
         *   - adjust each axis to its new scale.
         */

        self.topAxis.scale(self.xScale);
        self.bottomAxis.scale(self.xScale);

        self.svg.select(".xUpper.axis")
            .transition()
            .call(self.topAxis);

        self.svg.select(".xLower.axis")
            .transition()
            .call(self.bottomAxis);

        /*
         * New rectangles appear at the far right hand side of the graph.
         */

        var rectangle = self.graph.selectAll("rect")

        // bind data to d3 nodes and create uniqueness based on
        // th.timestamparam. This could possibly create some
        // issues due to duplication of a supposedly unique
        // param, but has not yet been a problem in practice.
        .data(self.dataset, function(d) {
            return d.timestamp;
        });

        // enters at wider width and transitions to lesser width for a
        // dynamic resizing effect
        rectangle.enter()
            .append("rect")
            .attr("x", self.margin.left)
            .attr("y", self.h.padding + 1)
            .attr("width", 2)
            .attr("height", self.h.main - self.h.padding - 2)
            .attr("class", "single-event")
            .style("opacity", function(d) {
                return self.opacityByFilter(d);
            })
            .style("visibility", function(d) {
                // to avoid showing popovers for hidden lines
                return self.visibilityByFilter(d);
            })
            .attr("fill", function(d) {
                var result;
                if (d && d.traits && d.traits.outcome) {
                    result = d.traits.outcome;

                    // 0: green, 1: blue, 2: orange
                    return result === 'success' ? self.color(0) : result === 'pending' ? self.color(1) : self.color(2);
                } else {
                    return self.color(2);
                }
            })
            .on("mouseover", self.tooltip.show)
            .on("mouseout", function() {
                self.tooltip.hide();
            });

        rectangle
            .transition()
            .attr("x", function(d) {
                return self.xScale(d.timestamp);
            });

        rectangle.exit().remove();

        return true;
    },

    redraw: function() {
        var self = this;

        self.graph.selectAll("rect")
            .transition().duration(500)
            .attr("x", function(d) {
                return self.xScale(d.timestamp);
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
        this.appendChartHeading();
        this.$el.append(this.template());

        // append the modal that is triggered by
        // clicking the filter icon
        $('#modal-container-' + this.el.slice(1)).append(this.eventFilterModal());
        this.$el.find('.special-icon-post').append(this.filterButton());


        // standard Backbone convention is to return this
        return this;
    },

    filterButton: _.template('' +
        '<i class="fa fa-filter pull-right" data-toggle="modal"' +
        'data-target="#modal-filter-<%= this.el.slice(1) %>' + '" style="margin-left: 15px;"></i>'
    ),

    template: _.template(
        '<div id = "goldstone-event-panel" class="panel panel-primary">' +

        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="panel-body" style="height:<%= this.h.main %>' + 'px">' +
        '<div>' +
        '<div id="goldstone-event-chart">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +

        '<div id="modal-container-<%= this.el.slice(1) %>' +
        '"></div>'
    ),

    eventFilterModal: _.template(
        // event filter modal
        '<div class="modal fade" id="modal-filter-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +

        '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
        '<h4 class="modal-title" id="myModalLabel"><%=goldstone.translate(\'Event Type Filters\')%></h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5><%=goldstone.translate(\'Uncheck event-type to hide from display\')%></h5><br>' +
        '<div id="populateEventFilters"></div>' +


        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal"><%=goldstone.contextTranslate(\'Exit\', \'eventtimeline\')%></button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    )

});
