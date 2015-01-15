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
        filter: {
            error: true,
            warning: true,
            audit: true,
            info: true,
            debug: true
        },

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

        this.collection.url = ns.urlRoot + 'start_time=' + Math.floor(ns.start / 1000) + '&end_time=' + Math.floor(ns.end / 1000) + '&interval=' + interval + 's';
    },

    startEndToGlobalLookback: function() {
        var self = this;
        var ns = this.defaults;

        var globalLookback = $('#global-lookback-range').val();

        ns.end = +new Date();
        ns.start = ns.end - (globalLookback * 60 * 1000);
    },

    triggerSearchTable: function() {

        drawSearchTable('#log-search-table', this.defaults.start, this.defaults.end);
    },

    processListeners: function() {
        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', function() {
            self.update();
        });

        this.collection.on('error', this.dataErrorMessage, this);

        this.on('refreshReached', function(params) {

            if (ns.isZoomed === true) {
                return;
            }

            ns.start = params[0];
            ns.end = params[1];

            $(this.el).find('#spinner').show();
            this.constructUrl();
            this.collection.fetchWithRemoval();

        });

        this.on('selectorChanged', function(params) {
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
            ns.isZoomed = true;
            console.log('clicked plus');
            self.dblclicked([ns.width * 0.8, 0], 4);

        });

        // ZOOM IN MORE
        this.$el.find('.fa-forward').on('click', function() {
            ns.isZoomed = true;
            console.log('clicked forward');
            self.dblclicked([ns.width * 0.6, 0], 12);

        });

        // ZOOM OUT
        this.$el.find('.fa-search-minus').on('click', function() {
            ns.isZoomed = true;
            console.log('clicked minus');
            $(self.el).find('#spinner').show();

            self.dblclicked([ns.width / 2, 0], 0.45);

        });

        // ZOOM OUT MORE
        this.$el.find('.fa-backward').on('click', function() {
            ns.isZoomed = true;
            console.log('clicked fa-backward');
            $(self.el).find('#spinner').show();
            self.dblclicked([ns.width / 2, 0], 0.25);


        });
    },

    dblclicked: function(coordinates, mult) {
        console.log('coordinates', coordinates);
        $(this.el).find('#spinner').show();

        var ns = this.defaults;
        var self = this;
        var zoomedStart;
        var zoomedEnd;

        var leftMarginX = 64;
        var rightMarginX = 42;

        var adjustedClick = Math.max(0, Math.min(coordinates[0] - leftMarginX, (ns.width - leftMarginX - rightMarginX)));

        var fullDomain = [+ns.x.domain()[0], +ns.x.domain()[1]];

        var domainDiff = fullDomain[1] - fullDomain[0];

        var clickSpot = +ns.x.invert(adjustedClick);

        var zoomMult = mult || 4;

        if (zoomMult >= 1) {
            zoomedStart = clickSpot - (domainDiff / zoomMult);
            zoomedEnd = clickSpot + (domainDiff / 4);
        } else {
            zoomedStart = clickSpot - domainDiff / zoomMult;
            zoomedEnd = clickSpot + (domainDiff / zoomMult);
        }

        ns.start = zoomedStart;
        ns.end = zoomedEnd;

        this.constructUrl();

        this.collection.fetchWithRemoval();
        return null;
    },

    collectionPrep: function() {
        var ns = this.defaults;
        var self = this;

        var data = this.collection.toJSON();

        finalData = [];

        _.each(data, function(item) {

            finalData.push({
                debug: item.debug || 0,
                audit: item.audit || 0,
                info: item.info || 0,
                warning: item.warning || 0,
                error: item.error || 0,
                date: item.time,
            });

        });

        return finalData;

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

        this.refreshSearchTable(ns.start, ns.end, ns.filter);
        this.redraw();

    },

    refreshSearchTable: function(start, end, levels) {
        var ns = this.defaults;
        var self = this;

        var oTable,
            startTs = Math.floor(start / 1000),
            endTs = Math.floor(end / 1000),
            uri = '/intelligence/log/search/data'.concat(
                "?start_time=", startTs,
                "&end_time=", endTs);

        levels = ns.filter || {};
        for (var k in levels) {
            uri = uri.concat("&", k, "=", levels[k]);
        }

        if ($.fn.dataTable.isDataTable("#log-search-table")) {
            oTable = $("#log-search-table").DataTable();
            oTable.ajax.url(uri);
            oTable.ajax.reload();
        }
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

        // drawSearchTable('#log-search-table', ns.start, ns.end);

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
        $(this.el).find('.special-icon-post').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 20px;"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-forward pull-right" style="margin: 0 50px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-plus pull-right" style="margin: 0 5px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-minus pull-right" style="margin: 0 20px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-backward pull-right" style="margin: 0 5px 0 0"></i>');
        this.$el.append(this.modal2());
        return this;
    }

});
