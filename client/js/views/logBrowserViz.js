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

/* instantiated in logSearchPageView.js as:

        this.logSearchObserverCollection = new SearchObserverCollection({
            urlBase: '/core/logs/',
            skipFetch: true,
            specificHost: this.specificHost,
        });

        this.logBrowserViz = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Log Search', 'logbrowserpage'),
            collection: this.logSearchObserverCollection,
            el: '#log-viewer-visualization',
            infoText: 'logBrowser',
            marginLeft: 70,
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage'),
        });

        this.logBrowserTable = new LogBrowserDataTableView({
            chartTitle: goldstone.contextTranslate('Log Browser', 'logbrowserpage'),
            collectionMixin: this.logSearchObserverCollection,
            el: '#log-viewer-table',
            width: $('#log-viewer-table').width()
        });

        this.predefinedSearchDropdown = new PredefinedSearchView({
            collection: this.logSearchObserverCollection,
            index_prefix: 'logstash-*',
            settings_redirect: '/#reports/logbrowser/search'
        });

        this.logBrowserViz.$el.find('.panel-primary').prepend(this.predefinedSearchDropdown.el);

        this.logSearchObserverCollection.linkedViz = this.logBrowserViz;
        this.logSearchObserverCollection.linkedDataTable = this.logBrowserTable;
        this.logSearchObserverCollection.linkedDropdown = this.predefinedSearchDropdown;
*/

var LogBrowserViz = GoldstoneBaseView.extend({

    margin: {
        top: 20,
        right: 40,
        bottom: 80,
        left: 70
    },

    // IMPORTANT: the order of the entries in the
    // Log Severity Filters modal is set by the order
    // of the event types in self.filter

    filter: {
        EMERGENCY: true,
        ALERT: true,
        CRITICAL: true,
        ERROR: true,
        WARNING: true,
        NOTICE: true,
        INFO: true,
        DEBUG: true
    },

    setZoomed: function(bool) {
        // state being tracked in the collection
        this.collection.isZoomed = bool;
    },

    instanceSpecificInit: function() {
        LogBrowserViz.__super__.instanceSpecificInit.call(this, arguments);

        this.standardInit();
        this.specialInit();
    },

    constructUrl: function() {
        // triggers the ajax call in the server-side dataTable
        this.collection.triggerDataTableFetch();
    },

    processListeners: function() {
        var self = this;

        // only renders via d3 when the server-side dataTable ajax
        // returns and 'sync' is triggered
        this.listenTo(this.collection, 'sync', function() {
            self.update();
        });
        this.listenTo(this.collection, 'error', this.dataErrorMessage);

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            self.showSpinner();
            self.setZoomed(false);
            self.constructUrl();
        });

        this.listenTo(this, 'refreshSelectorChanged', function() {
            self.showSpinner();
            self.setZoomed(false);
            self.constructUrl();
        });

        this.listenTo(this, 'lookbackIntervalReached', function() {

            // since refresh was changed via val() without select()
            // background timer will keep running and lookback will
            // continue to be triggered, so ignore if zoomed
            if (this.collection.isZoomed === true) {
                return;
            }
            this.showSpinner();
            this.constructUrl();
        });

    },

    standardInit: function() {

        var self = this;

        self.mw = self.width - self.margin.left - self.margin.right;
        self.mh = self.height - self.margin.top - self.margin.bottom;

        self.svg = d3.select(this.el).select('.panel-body').append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        self.chart = self.svg
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        // initialized the axes
        self.svg.append("text")
            .attr("class", "axis.label")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (self.height / 2))
            .attr("y", -5)
            .attr("dy", "1.5em")
            .text(self.yAxisLabel)
            .style("text-anchor", "middle");

        self.svg.on('dblclick', function() {
            var coord = d3.mouse(this);
            self.dblclicked(coord);
        });

        self.x = d3.time.scale()
            .rangeRound([0, self.mw]);

        self.y = d3.scale.linear()
            .range([self.mh, 0]);

        self.colorArray = goldstone.colorPalette;

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left")
            .tickFormat(d3.format("d"));

        self.color = d3.scale.ordinal().domain(["EMERGENCY", "ALERT", "CRITICAL", "ERROR", "WARNING", "NOTICE", "INFO", "DEBUG"])
            .range(self.colorArray.distinct.openStackSeverity8);

        self.area = d3.svg.area()
            .interpolate("monotone")
            .x(function(d) {
                return self.x(d.date);
            })
            .y0(function(d) {
                return self.y(d.y0);
            })
            .y1(function(d) {
                return self.y(d.y0 + d.y);
            });

        self.stack = d3.layout.stack()
            .values(function(d) {
                return d.values;
            });

        self.xAxis = d3.svg.axis()
            .scale(self.x)
            .orient("bottom")
            .ticks(7);
    },

    specialInit: function() {
        var self = this;

        // sets up filter for state tracking in logBrowserCollection
        this.collection.filter = this.filter;

        // ZOOM IN
        this.$el.find('.fa-search-plus').on('click', function() {
            self.paintNewChart([self.width, 0], 4);
        });

        // ZOOM IN MORE
        this.$el.find('.fa-forward').on('click', function() {
            self.paintNewChart([self.width, 0], 12);
        });

        // ZOOM OUT
        this.$el.find('.fa-search-minus').on('click', function() {
            self.paintNewChart([self.width * 0.7, 0], 0.45);
        });

        // ZOOM OUT MORE
        this.$el.find('.fa-backward').on('click', function() {
            self.paintNewChart([self.width * 0.7, 0], 0.25);
        });
    },

    paintNewChart: function(coordinates, mult) {
        var self = this;

        this.showSpinner();
        self.setZoomed(true);

        var zoomedStart;
        var zoomedEnd;

        var leftMarginX = 67;
        var rightMarginX = 26;

        var adjustedClick = Math.max(0, Math.min(coordinates[0] - leftMarginX, (self.width - leftMarginX - rightMarginX)));

        var fullDomain = [+self.x.domain()[0], +self.x.domain()[1]];

        var domainDiff = fullDomain[1] - fullDomain[0];

        var clickSpot = +self.x.invert(adjustedClick);

        var zoomMult = mult || 4;

        zoomedStart = Math.floor(clickSpot - (domainDiff / zoomMult));
        zoomedEnd = Math.floor(clickSpot + (domainDiff / zoomMult));


        // avoids getting stuck with times greater than now.
        if (zoomedEnd - zoomedStart < 2000) {
            zoomedStart -= 2000;
        }

        this.collection.zoomedStart = zoomedStart;
        this.collection.zoomedEnd = Math.min(+new Date(), zoomedEnd);


        var $gls = $('.global-refresh-selector select');
        if ($gls.length) {

            // setting value via val() will not fire change() event
            // which will prevent an unneeded ajax call from being made
            // due to listeners on the lookback selector
            if (parseInt($gls.val(), 10) > 0) {
                $gls.val(-1);
            }
        }

        this.constructUrl();
        return;
    },

    dblclicked: function(coordinates) {
        this.paintNewChart(coordinates);
    },

    collectionPrep: function() {

        var self = this;

        // this.collection.toJSON() returns the collection data
        var collectionDataPayload = this.collection.toJSON()[0];

        var data = [];

        if (collectionDataPayload.aggregations && collectionDataPayload.aggregations.per_interval) {
            // we use only the 'data' for the construction of the chart
            data = collectionDataPayload.aggregations.per_interval.buckets;
        } else {
            return [];
        }

        // prepare empty array to return at end
        var finalData = [];

        // layers of nested _.each calls
        // the first one iterates through each object
        // in the 'data' array as 'item':

        // {
        //     "per_level": {
        //         "buckets": [{
        //             "key": "INFO",
        //             "doc_count": 112
        //         }, {
        //             "key": "NOTICE",
        //             "doc_count": 17
        //         }, {
        //             "key": "ERROR",
        //             "doc_count": 5
        //         }, {
        //             "key": "WARNING",
        //             "doc_count": 2
        //         }],
        //         "sum_other_doc_count": 0,
        //         "doc_count_error_upper_bound": 0
        //     },
        //     "key_as_string": "2016-01-07T22:24:45.000Z",
        //     "key": 1452205485000,
        //     "doc_count": 190
        // },

        // the next _.each iterates through the array of
        // nested objects that are keyed to the timestamp
        // as 'subItem'
        // [{
        //     "key": "INFO",
        //     "doc_count": 112
        // }, {
        //     "key": "NOTICE",
        //     "doc_count": 17
        // }, {
        //     "key": "ERROR",
        //     "doc_count": 5
        // }, {
        //     "key": "WARNING",
        //     "doc_count": 2
        // }],

        _.each(data, function(item) {

            var tempObject = {};

            _.each(item.per_level.buckets, function(subItem) {
                _.each(subItem, function() {

                    // each key/value pair of the subSubItems is added to tempObject
                    var key = subItem.key;
                    var value = subItem.doc_count;
                    tempObject[key] = value;
                });
            });

            // and then after tempObject is populated
            // it is standardized for chart consumption
            // by making sure to add '0' for unreported
            // values, and adding the timestamp

            _.each(self.filter, function(item, i) {
                tempObject[i] = tempObject[i] || 0;
            });
            tempObject.date = item.key;
            // which is the equivalent of doing this:

            // tempObject.debug = tempObject.debug || 0;
            // tempObject.audit = tempObject.audit || 0;
            // tempObject.info = tempObject.info || 0;
            // tempObject.warning = tempObject.warning || 0;
            // tempObject.error = tempObject.error || 0;
            // tempObject.date = _.keys(item)[0];

            // and the final array is built up of these
            // individual objects for the viz
            finalData.push(tempObject);

        });

        // and finally return the massaged data and the
        // levels to the superclass 'update' function
        return finalData;

    },

    sums: function(datum) {
        var self = this;

        // Return the sums for the filters that are on
        return d3.sum(self.color.domain().map(function(k) {

            if (self.filter[k]) {
                return datum[k];
            } else {
                return 0;
            }
        }));
    },

    draw_filters: function() {

        var self = this;

        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in self.filter

        // populate the modal based on the event types.
        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        var check_all_marked = "checked";

        _.each(_.keys(self.filter), function(item) {

            if (item === 'none') {
                return null;
            }

            var addCheckIfActive = function(item) {
                if (self.filter[item]) {
                    return 'checked';
                } else {
                    check_all_marked = "";
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
                'style="opacity: 0.8; background-color:' + self.loglevel([item]) + '">' +
                '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                '</span>' +
                '<span type="text" class="form-control">' + item + '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        $(this.el).find('#populateEventFilters input:checkbox').not("#check-all").on('click', function() {
            var checkboxId = this.id;
            self.filter[checkboxId] = !self.filter[checkboxId];
            self.collection.filter = self.filter;

            // after changing filter, do not have d3 re-render,
            // but have dataTable refetch ajax
            // with filter params incluced
            self.constructUrl();
        });

       $(this.el).find('#populateEventFilters').
            prepend(

                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div class="input-group">' +
                '<span class="input-group-addon"' +
                'style="opacity: 0.8; background-color: white">' +
                '<input id="check-all" type="checkbox" ' + check_all_marked + '/>' +
                '</span>' +
                '<span type="text" class="form-control">Select All</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );

        $(this.el).find('#populateEventFilters #check-all').on('click', function() {
            var check_all = $(this);
            $("#populateEventFilters input:checkbox").not(this).each(function(){
                if($(this).prop("checked") != check_all.prop("checked")){
                    $(this).prop("checked", true).trigger( "click");
                }
            });
        });

    },

    update: function() {

        var self = this;

        // sets css for spinner to hidden in case
        // spinner callback resolves
        // after chart data callback
        this.hideSpinner();

        // define allthelogs and self.data even if
        // rendering is halted due to empty data set
        var allthelogs = this.collectionPrep();
        self.data = allthelogs;
        self.loglevel = d3.scale.ordinal()
            .domain(["EMERGENCY", "ALERT", "CRITICAL", "ERROR", "WARNING", "NOTICE", "INFO", "DEBUG"])
            .range(self.colorArray.distinct.openStackSeverity8);

        // clear viz
        self.chart.selectAll('.component')
            .remove();

        // If we didn't receive any valid files, append "No Data Returned" and halt
        if (this.checkReturnedDataSet(allthelogs) === false) {
            this.draw_filters();
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

        self.color.domain(d3.keys(self.data[0]).filter(function(key) {

            return (self.filter[key] && key !== "date" && key !== "total" && key !== "time");
        }));

        var components;
        var curr = false;
        var anyLiveFilter = _.reduce(self.filter, function(curr, status) {
            return status || curr;
        });

        if (!anyLiveFilter) {
            this.draw_filters();
            self.chart.selectAll('.component')
                .remove();
            return;
        }

        components = self.stack(self.color.domain().map(function(name) {
            return {
                name: name,
                values: self.data.map(function(d) {
                    return {
                        date: d.date,
                        y: d[name]
                    };
                })
            };
        }));

        $(this.el).find('.axis').remove();

        self.x.domain(d3.extent(self.data, function(d) {
            return d.date;
        }));

        self.y.domain([
            0,
            d3.max(self.data.map(function(d) {
                return self.sums(d);
            }))
        ]);

        var component = self.chart.selectAll(".component")
            .data(components)
            .enter().append("g")
            .attr("class", "component");

        component.append("path")
            .attr("class", "area")
            .attr("d", function(d) {
                return self.area(d.values);
            })
            .style("stroke", function(d) {
                return self.loglevel(d.name);
            })
            .style("stroke-width", function(d) {
                return 1.5;
            })
            .style("stroke-opacity", function(d) {
                return 1;
            })
            .style("fill", function(d) {
                return self.loglevel(d.name);
            });

        component.append("text")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + self.x(d.value.date) + "," + self.y(d.value.y0 + d.value.y / 2) + ")";
            })
            .attr("x", 1)
            .attr("y", function(d, i) {
                // make space between the labels
                return 0;
            })
            .style("font-size", ".8em");

        self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.mh + ")")
            .call(self.xAxis);

        self.chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis);

        this.draw_filters();

        this.redraw();

    },

    redraw: function() {

        var self = this;

        self.y.domain([
            0,
            d3.max(self.data.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(this.el).select('.x.axis')
            .transition()
            .duration(500)
            .call(self.xAxis.scale(self.x));

        d3.select(this.el).select('.y.axis')
            .transition()
            .duration(500)
            .call(self.yAxis.scale(self.y));

    },

    filterModal: _.template(
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
        '<h5><%=goldstone.translate(\'Uncheck log-type to hide from display\')%></h5><br>' +
        '<div id="populateEventFilters"></div>' +
        '</div>' +

        // footer
        '<div class="modal-footer">' +
        '<button type="button" id="eventFilterUpdateButton-<%= this.el.slice(1) %>' +
        '" class="btn btn-primary" data-dismiss="modal"><%=goldstone.translate(\'Exit\')%></button>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    ),

    addModalAndHeadingIcons: function() {
        $(this.el).find('.special-icon-pre').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 15px;"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-forward pull-right" style="margin: 0 4px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-plus pull-right" style="margin: 0 5px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-minus pull-right" style="margin: 0 20px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-backward pull-right" style="margin: 0 5px 0 0"></i>');
        this.$el.append(this.filterModal());
        return this;
    }

});
