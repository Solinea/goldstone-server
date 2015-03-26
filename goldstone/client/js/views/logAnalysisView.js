/**
 * Copyright 2014 - 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
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

/* instantiated in logSearchView.js as:

    this.logAnalysisCollection = new LogAnalysisCollection({});

    this.logAnalysisView = new LogAnalysisView({
        collection: this.logAnalysisCollection,
        width: $('.log-analysis-container').width(),
        height: 300,
        el: '.log-analysis-container',
        featureSet: 'logEvents',
        chartTitle: 'Log Analysis',
        urlRoot: "/logging/summarize?",

    });
*/

// extends UtilizationCpuView
var LogAnalysisView = UtilizationCpuView.extend({
    defaults: {
        margin: {
            top: 20,
            right: 40,
            bottom: 35,
            left: 63
        },

        // populated dynamically by
        // returned levels param of data
        // in this.collectionPrep
        // and will look something like this:

        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in ns.filter


        filter: {
            emergency: true,
            alert: true,
            critical: true,
            error: true,
            warning: true,
            notice: true,
            info: true,
            debug: true
        },

        // filter: null,

        // will prevent updating when zoom is active
        isZoomed: false

    },

    processOptions: function() {

        LogAnalysisView.__super__.processOptions.apply(this, arguments);

        var ns = this.defaults;
        ns.yAxisLabel = 'Log Events';
        ns.urlRoot = this.options.urlRoot;
    },

    processMargins: function() {
        var ns = this.defaults;
        ns.mw = ns.width - ns.margin.left - ns.margin.right;
        ns.mh = ns.height - ns.margin.top - ns.margin.bottom;
    },

    constructUrl: function() {
        var self = this;
        var ns = this.defaults;

        var seconds = (ns.end - ns.start) / 1000;
        var interval = Math.max(1, Math.floor((seconds / (ns.width / 10))));

        this.collection.url = ns.urlRoot + 'per_host=False&@timestamp__range={' +
            '"gte":' + ns.start + ',"lte":' + ns.end + '}&interval=' + interval + 's';
    },

    startEndToGlobalLookback: function() {
        var self = this;
        var ns = this.defaults;

        var globalLookback = $('#global-lookback-range').val();

        ns.end = +new Date();
        ns.start = ns.end - (globalLookback * 60 * 1000);
    },

    triggerSearchTable: function() {

        this.drawSearchTable('#log-search-table', this.defaults.start, this.defaults.end);
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', function() {
            self.update();
        });

        this.collection.on('error', this.dataErrorMessage, this);

        this.on('lookbackIntervalReached', function(params) {

            if (ns.isZoomed === true) {
                return;
            }

            ns.start = params[0];
            ns.end = params[1];

            $(this.el).find('#spinner').show();
            this.constructUrl();
            this.collection.fetchWithRemoval();

        });

        this.on('lookbackSelectorChanged', function(params) {
            $(this.el).find('#spinner').show();
            ns.isZoomed = false;
            ns.start = params[0];
            ns.end = params[1];
            this.constructUrl();
            this.collection.fetchWithRemoval();
        });
    },

    standardInit: function() {
        LogAnalysisView.__super__.standardInit.apply(this, arguments);

        var ns = this.defaults;

        ns.xAxis = d3.svg.axis()
            .scale(ns.x)
            .orient("bottom")
            .ticks(7);

        this.startEndToGlobalLookback();
        this.triggerSearchTable();
        this.constructUrl();
        this.collection.fetchWithRemoval();

    },

    specialInit: function() {
        var ns = this.defaults;
        var self = this;

        // ZOOM IN
        this.$el.find('.fa-search-plus').on('click', function() {
            self.paintNewChart([ns.width, 0], 4);
        });

        // ZOOM IN MORE
        this.$el.find('.fa-forward').on('click', function() {
            self.paintNewChart([ns.width, 0], 12);
        });

        // ZOOM OUT
        this.$el.find('.fa-search-minus').on('click', function() {
            self.paintNewChart([ns.width * 0.7, 0], 0.45);
        });

        // ZOOM OUT MORE
        this.$el.find('.fa-backward').on('click', function() {
            self.paintNewChart([ns.width * 0.7, 0], 0.25);
        });
    },

    paintNewChart: function(coordinates, mult) {
        var ns = this.defaults;
        var self = this;

        $(this.el).find('#spinner').show();
        ns.isZoomed = true;
        $('.global-refresh-selector select').val(-1);

        var zoomedStart;
        var zoomedEnd;

        var leftMarginX = 64;
        var rightMarginX = 42;

        var adjustedClick = Math.max(0, Math.min(coordinates[0] - leftMarginX, (ns.width - leftMarginX - rightMarginX)));

        var fullDomain = [+ns.x.domain()[0], +ns.x.domain()[1]];

        var domainDiff = fullDomain[1] - fullDomain[0];

        var clickSpot = +ns.x.invert(adjustedClick);

        var zoomMult = mult || 4;

        zoomedStart = Math.floor(clickSpot - (domainDiff / zoomMult));
        zoomedEnd = Math.floor(clickSpot + (domainDiff / zoomMult));

        ns.start = zoomedStart;
        ns.end = Math.min(+new Date(), zoomedEnd);

        if (ns.end - ns.start < 2000) {
            ns.start -= 1000;
            ns.end += 1000;
        }

        this.constructUrl();

        this.collection.fetchWithRemoval();
        return null;
    },

    dblclicked: function(coordinates) {
        this.paintNewChart(coordinates);
    },

    collectionPrep: function() {

        var ns = this.defaults;
        var self = this;

        // this.collection.toJSON() returns an object
        // with keys: timestamps, levels, data.
        var collectionDataPayload = this.collection.toJSON()[0];

        // We will store the levels for the loglevel
        // construction and add it back in before returning
        var logLevels = collectionDataPayload.levels;

        // if ns.filter isn't defined yet, only do
        // this once
        if (ns.filter === null) {
            ns.filter = {};
            _.each(logLevels, function(item) {
                ns.filter[item] = true;
            });
        }

        // we use only the 'data' for the construction of the chart
        var data = collectionDataPayload.data;

        // prepare empty array to return at end
        finalData = [];

        // 3 layers of nested _.each calls
        // the first one iterates through each object
        // in the 'data' array as 'item':
        // {
        //     "1426640040000": [
        //         {
        //             "audit": 7
        //         },
        //         {
        //             "info": 0
        //         },
        //         {
        //             "warning": 0
        //         }
        //     ]
        // }

        // the next _.each iterates through the array of
        // nested objects that are keyed to the timestamp
        // as 'subItem'
        // [
        //     {
        //         "audit": 7
        //     },
        //     {
        //         "info": 0
        //     },
        //     {
        //         "warning": 0
        //     }
        // ]

        // and finally, the last _.each iterates through
        // the most deeply nested objects as 'subSubItem'
        // such as:
        //  {
        //      "audit": 7
        //  }

        _.each(data, function(item) {

            var tempObject = {};

            _.each(item, function(subItem) {
                _.each(subItem, function(subSubItem) {

                    // each key/value pair of the subSubItems is added to tempObject
                    var key = _.keys(subSubItem)[0];
                    var value = _.values(subSubItem)[0];
                    tempObject[key] = value;
                });
            });

            // and then after tempObject is populated
            // it is standardized for chart consumption
            // by making sure to add '0' for unreported
            // values, and adding the timestamp

            _.each(ns.filter, function(item, i) {
                tempObject[i] = tempObject[i] || 0;
            });
            tempObject.date = _.keys(item)[0];

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
        return {
            finalData: finalData,
            logLevels: logLevels
        };

    },

    sums: function(datum) {
        var ns = this.defaults;

        // Return the sums for the filters that are on
        return d3.sum(ns.color.domain().map(function(k) {

            if (ns.filter[k]) {
                return datum[k];
            } else {
                return 0;
            }
        }));
    },

    update: function() {
        LogAnalysisView.__super__.update.apply(this, arguments);

        this.hideSpinner();

        var ns = this.defaults;
        var self = this;

        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in ns.filter

        // populate the modal based on the event types.
        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(_.keys(ns.filter), function(item) {

            if (item === 'none') {
                return null;
            }

            var addCheckIfActive = function(item) {
                if (ns.filter[item]) {
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
                'style="opacity: 0.8; background-color:' + ns.loglevel([item]) + '">' +
                '<input id="' + item + '" type="checkbox" ' + checkMark + '>' +
                '</span>' +
                '<span type="text" class="form-control">' + item + '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        $(this.el).find('#populateEventFilters :checkbox').on('click', function() {
            var checkboxId = this.id;
            ns.filter[checkboxId] = !ns.filter[checkboxId];
            self.update();
        });

        this.refreshSearchTable(ns.start, ns.end);
        this.redraw();

    },

    searchDataErrorMessage: function(message, errorMessage, location) {

        // 2nd parameter will be supplied in the case of an
        // 'error' event such as 504 error. Othewise,
        // function will append message supplied such as 'no data'.

        if (errorMessage !== undefined) {
            message = errorMessage.responseText;
            message = '' + errorMessage.status + ' error: ' + message;
        }

        // calling raiseAlert with the 3rd param will supress auto-hiding
        // goldstone.raiseAlert($(location), message, true);
        goldstone.raiseAlert($(location), message, true);

    },

    clearSearchDataErrorMessage: function(location) {
        // if error message already exists on page,
        // remove it in case it has changed
        if ($(location).length) {
            $(location).fadeOut("slow");
        }
    },

    urlGen: function(start, end) {
        var ns = this.defaults;
        var self = this;

        var uri = '/logging/search?@timestamp__range={"gte":' +
            start +
            ',"lte":' +
            end +
            '}&loglevel__terms=[';

        levels = ns.filter || {};
        for (var k in levels) {
            if (levels[k]) {
                uri = uri.concat('"', k.toUpperCase(), '",');
            }
        }
        uri += "]";

        return uri;

        /*
        makes a url such as:
        /logging/search?@timestamp__range={%22gte%22:1426981050017,%22lte%22:1426984650017}&loglevel__terms=[%22EMERGENCY%22,%22ALERT%22,%22CRITICAL%22,%22ERROR%22,%22WARNING%22,%22NOTICE%22,%22INFO%22,%22DEBUG%22]
        */
    },

    refreshSearchTable: function(start, end) {
        var ns = this.defaults;
        var self = this;

        var oTable;

        var uri = this.urlGen(start, end);

        if ($.fn.dataTable.isDataTable("#log-search-table")) {
            oTable = $("#log-search-table").DataTable();
            oTable.ajax.url(uri);
            oTable.ajax.reload();
        }
    },

    drawSearchTable: function(location, start, end) {
        var self = this;
        var ns = this.defaults;

        $("#log-table-loading-indicator").show();

        var oTable;

        var uri = this.urlGen(start, end);

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.ajax.url(uri);
            oTable.ajax.reload();
        } else {
            var oTableParams = {
                "info": false,
                "bAutoWidth": false,
                "autoWidth": true,
                "processing": true,
                "lengthChange": true,
                "paging": true,
                "searching": true,
                "ordering": true,
                "order": [
                    [0, 'desc']
                ],
                "serverSide": true,
                "ajax": {
                    dataSrc: "results",
                    beforeSend: function(obj, settings) {
                        var searchQuery = $('.log-search-container').find('input.form-control').val();

                        settings.url = settings.url.slice(0, settings.url.indexOf(',]'));
                        settings.url += "]";

                        if (searchQuery) {
                            settings.url += "&log_message__regexp=.*" +
                                searchQuery + ".*";
                        }

                    },
                    url: uri,
                    error: function(data) {
                        self.searchDataErrorMessage(null, data, '.search-popup-message');
                    }
                },
                "columnDefs": [{
                    "data": "@timestamp",
                    "type": "date",
                    "targets": 0,
                    "render": function(data, type, full, meta) {
                        self.clearSearchDataErrorMessage('.search-popup-message');
                        return moment(data).format();
                    }
                }, {
                    "data": "syslog_severity",
                    "targets": 1
                }, {
                    "data": "component",
                    "targets": 2
                }, {
                    "data": "host",
                    "targets": 3
                }, {
                    "data": "log_message",
                    "targets": 4
                }]
            };
            oTable = $(location).DataTable(oTableParams);
        }
        $("#log-table-loading-indicator").hide();
    },

    redraw: function() {

        var ns = this.defaults;
        var self = this;

        ns.y.domain([
            0,
            d3.max(ns.data.map(function(d) {
                return self.sums(d);
            }))
        ]);

        d3.select(this.el).select('.x.axis')
            .transition()
            .duration(500)
            .call(ns.xAxis.scale(ns.x));

        d3.select(this.el).select('.y.axis')
            .transition()
            .duration(500)
            .call(ns.yAxis.scale(ns.y));

    },

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>'),

    modal2: _.template(
        // event filter modal
        '<div class="modal fade" id="modal-filter-<%= this.el.slice(1) %>' +
        '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        // header
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
        '<h4 class="modal-title" id="myModalLabel">Log Severity Filters</h4>' +
        '</div>' +

        // body
        '<div class="modal-body">' +
        '<h5>Uncheck log-type to hide from display</h5><br>' +
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

    render: function() {
        this.$el.append(this.template());
        $(this.el).find('.special-icon-pre').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 15px;"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-forward pull-right" style="margin: 0 4px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-plus pull-right" style="margin: 0 5px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-minus pull-right" style="margin: 0 20px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-backward pull-right" style="margin: 0 5px 0 0"></i>');
        this.$el.append(this.modal2());
        return this;
    }

});
