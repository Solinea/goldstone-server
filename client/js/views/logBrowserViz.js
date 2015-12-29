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

    this.logAnalysisCollection = new LogAnalysisCollection({});

    this.logAnalysisView = new LogAnalysisView({
        collection: this.logAnalysisCollection,
        width: $('.log-analysis-container').width(),
        height: 300,
        el: '.log-analysis-container',
        featureSet: 'logEvents',
        chartTitle: 'Log Analysis',
        urlRoot: "/logging/summarize/?",

    });
*/

// refactored version in process
var LogBrowserViz = GoldstoneBaseView.extend({

    margin: {
        top: 20,
        right: 40,
        bottom: 35,
        left: 63
    },

    // IMPORTANT: the order of the entries in the
    // Log Severity Filters modal is set by the order
    // of the event types in self.filter

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

    // will prevent updating when zoom is active
    isZoomed: false,

    setZoomed: function(bool) {
        this.isZoomed = bool;
        this.collection.isZoomed = bool;
    },

    instanceSpecificInit: function() {
        LogBrowserViz.__super__.instanceSpecificInit.call(this, arguments);

        this.standardInit();
        this.specialInit();
    },

    constructUrl: function() {
        var self = this;
        this.collection.urlGenerator();
        // this.collection.fetchWithReset();
    },

    processListeners: function() {
        var self = this;

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
            if (self.isZoomed === true) {
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

        self.svg = d3.select(this.el).append("svg")
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

        self.colorArray = new GoldstoneColors().get('colorSets');

        self.yAxis = d3.svg.axis()
            .scale(self.y)
            .orient("left");

        if (self.featureSet === "cpuUsage") {
            self.yAxis
                .tickFormat(self.formatPercent);
        }

        if (self.featureSet === 'logEvents') {

            self.color = d3.scale.ordinal().domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"])
                .range(self.colorArray.distinct.openStackSeverity8);
        } else {
            self.color = d3.scale.ordinal().range(self.colorArray.distinct['2R']);
        }

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

        var $gls = $('.global-refresh-selector select');
        if ($gls.length) {
            $('.global-refresh-selector select').val(-1);
        }

        var zoomedStart;
        var zoomedEnd;

        var leftMarginX = 64;
        var rightMarginX = 42;

        var adjustedClick = Math.max(0, Math.min(coordinates[0] - leftMarginX, (self.width - leftMarginX - rightMarginX)));

        var fullDomain = [+self.x.domain()[0], +self.x.domain()[1]];

        var domainDiff = fullDomain[1] - fullDomain[0];

        var clickSpot = +self.x.invert(adjustedClick);

        var zoomMult = mult || 4;

        zoomedStart = Math.floor(clickSpot - (domainDiff / zoomMult));
        zoomedEnd = Math.floor(clickSpot + (domainDiff / zoomMult));

        // self.start = zoomedStart;
        // self.end = Math.min(+new Date(), zoomedEnd);

        if (zoomedEnd - zoomedStart < 2000) {
            zoomedStart -= 1000;
            zoomedEnd += 1000;
        }

        this.collection.zoomedStart = zoomedStart;
        this.collection.zoomedEnd = Math.min(+new Date(), zoomedEnd);

        this.constructUrl();
        return null;
    },

    dblclicked: function(coordinates) {
        this.paintNewChart(coordinates);
    },

    collectionPrep: function() {

        var self = this;

        // this.collection.toJSON() returns an object
        // with keys: timestamps, levels, data.
        var collectionDataPayload = this.collection.toJSON()[0];

        // We will store the levels for the loglevel
        // construction and add it back in before returning
        var logLevels = collectionDataPayload.levels;

        // if self.filter isn't defined yet, only do
        // this once
        if (self.filter === null) {
            self.filter = {};
            _.each(logLevels, function(item) {
                self.filter[item] = true;
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

            _.each(self.filter, function(item, i) {
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

        if (self.featureSet === 'logEvents') {
            self.data = allthelogs.finalData;
            self.loglevel = d3.scale.ordinal()
                .domain(["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"])
                .range(self.colorArray.distinct.openStackSeverity8);
        }

        // If we didn't receive any valid files, append "No Data Returned" and halt
        if (this.checkReturnedDataSet(allthelogs) === false) {
            return;
        }

        // remove No Data Returned once data starts flowing again
        this.clearDataErrorMessage();

        self.color.domain(d3.keys(self.data[0]).filter(function(key) {

            if (self.featureSet === 'logEvents') {
                return (self.filter[key] && key !== "date" && key !== "total" && key !== "time");
            } else {
                return key !== "date";
            }
        }));

        var components;
        if (self.featureSet === 'logEvents') {

            var curr = false;
            var anyLiveFilter = _.reduce(self.filter, function(curr, status) {
                return status || curr;
            });

            if (!anyLiveFilter) {
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

        } else {

            components = self.stack(self.color.domain().map(function(name) {
                return {
                    name: name,
                    values: self.data.map(function(d) {
                        return {
                            date: d.date,
                            y: self.featureSet === 'cpuUsage' ? d[name] / 100 : d[name]
                        };
                    })
                };
            }));
        }

        $(this.el).find('.axis').remove();

        self.x.domain(d3.extent(self.data, function(d) {
            return d.date;
        }));

        if (self.featureSet === 'memUsage') {
            self.y.domain([0, self.memTotal / self.divisor]);
        }

        if (self.featureSet === 'netUsage') {
            self.y.domain([0, d3.max(allthelogs, function(d) {
                return d.rx + d.tx;
            })]);
        }

        if (self.featureSet === 'logEvents') {
            self.y.domain([
                0,
                d3.max(self.data.map(function(d) {
                    return self.sums(d);
                }))
            ]);
        }

        self.chart.selectAll('.component')
            .remove();

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
                if (self.featureSet === "logEvents") {
                    return self.loglevel(d.name);
                }
            })
            .style("stroke-width", function(d) {
                if (self.featureSet === "logEvents") {
                    return 1.5;
                }
            })
            .style("stroke-opacity", function(d) {
                if (self.featureSet === "logEvents") {
                    return 1;
                }
            })
            .style("fill", function(d) {

                if (self.featureSet === "cpuUsage") {
                    if (d.name.toLowerCase() === "idle") {
                        return "none";
                    }
                    return self.color(d.name);
                }

                if (self.featureSet === "memUsage") {
                    if (d.name.toLowerCase() === "free") {
                        return "none";
                    }
                    return self.color(d.name);
                }

                if (self.featureSet === "netUsage") {
                    return self.color(d.name);
                }

                if (self.featureSet === "logEvents") {
                    return self.loglevel(d.name);
                }

                console.log('define featureSet in utilizationCpuView.js');

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

                if (self.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return -3;
                    } else {
                        return 0;
                    }
                }

                if (self.featureSet === 'cpuUsage') {
                    return -i * 3;
                }

                if (self.featureSet === 'netUsage') {
                    return -i * 8;
                }

                if (self.featureSet === 'logEvents') {
                    return 0;
                }

                console.log('define feature set in utilizationCpuView.js');
                return null;

            })
            .attr("text-anchor", function(d) {
                if (self.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return 'end';
                    }
                }
            })
            .style("font-size", ".8em")
            .text(function(d) {

                if (self.featureSet === 'cpuUsage') {
                    return d.name;
                }

                if (self.featureSet === 'memUsage') {
                    if (d.name === 'total') {
                        return 'Total: ' + ((Math.round(self.memTotal / self.divisor * 100)) / 100) + 'GB';
                    }
                    if (d.name === 'free') {
                        return '';
                    } else {
                        return d.name;
                    }
                }

                if (self.featureSet === 'netUsage') {
                    return d.name + " (kB)";
                }

                if (self.featureSet === 'logEvents') {
                    return null;
                }

                console.log('define feature set in utilizationCpuView.js');
                return 'feature set undefined';

            });

        self.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.mh + ")")
            .call(self.xAxis);

        self.chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis);



        // IMPORTANT: the order of the entries in the
        // Log Severity Filters modal is set by the order
        // of the event types in self.filter

        // populate the modal based on the event types.
        // clear out the modal and reapply based on the unique events
        if ($(this.el).find('#populateEventFilters').length) {
            $(this.el).find('#populateEventFilters').empty();
        }

        _.each(_.keys(self.filter), function(item) {

            if (item === 'none') {
                return null;
            }

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
                'style="opacity: 0.8; background-color:' + self.loglevel([item]) + '">' +
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
            self.filter[checkboxId] = !self.filter[checkboxId];
            self.update();
        });

        // eliminates the immediate re-rendering of search table
        // upon initial chart instantiation
        // this.refreshSearchTableAfterOnce();

        this.redraw();

    },

    // refreshSearchTableAfterOnce: function() {
    //     var self = this;
    //     var self = this;
    //     if (--self.refreshCount < 1) {
    //         self.refreshSearchTable();
    //     }
    // },

    // searchDataErrorMessage: function(message, errorMessage, location) {

    //     // 2nd parameter will be supplied in the case of an
    //     // 'error' event such as 504 error. Othewise,
    //     // function will append message supplied such as 'no data'.

    //     if (errorMessage !== undefined) {
    //         message = errorMessage.responseText;
    //         message = '' + errorMessage.status + ' error: ' + message;
    //     }

    //     // calling raiseAlert with the 3rd param will supress auto-hiding
    //     // goldstone.raiseAlert($(location), message, true);
    //     goldstone.raiseAlert($(location), message, true);

    // },

    // clearSearchDataErrorMessage: function(location) {
    //     // if error message already exists on page,
    //     // remove it in case it has changed
    //     if ($(location).length) {
    //         $(location).fadeOut("slow");
    //     }
    // },

    // urlGen: function() {
    //     var self = this;

    //     var uri = '/logging/search/?';

    //     if (self.specificHost) {
    //         uri += 'host=' + self.specificHost + '&';
    //     }

    //     uri += '@timestamp__range={"gte":' +
    //         self.start +
    //         ',"lte":' +
    //         self.end +
    //         '}&syslog_severity__terms=[';

    //     levels = self.filter || {};
    //     for (var k in levels) {
    //         if (levels[k]) {
    //             uri = uri.concat('"', k.toUpperCase(), '",');
    //         }
    //     }
    //     uri += "]";

    //     uri = uri.slice(0, uri.indexOf(',]'));
    //     uri += "]";

    //     this.url = uri;

    //     /*
    //     makes a url such as:
    //     /logging/search/?@timestamp__range={%22gte%22:1426981050017,%22lte%22:1426984650017}&loglevel__terms=[%22EMERGENCY%22,%22ALERT%22,%22CRITICAL%22,%22ERROR%22,%22WARNING%22,%22NOTICE%22,%22INFO%22,%22DEBUG%22]
    //     with "&host=node-01" added in if this is a node report page
    //     */
    // },

    // dataPrep: function(data) {
    //     var self = this;

    //     data = JSON.parse(data);
    //     _.each(data.results, function(item) {

    //         // if any field is undefined, dataTables throws an alert
    //         // so set to empty string if otherwise undefined
    //         item['@timestamp'] = item['@timestamp'] || '';
    //         item.syslog_severity = item.syslog_severity || '';
    //         item.component = item.component || '';
    //         item.log_message = item.log_message || '';
    //         item.host = item.host || '';
    //     });

    //     return {
    //         recordsTotal: data.count,
    //         recordsFiltered: data.count,
    //         result: data.results
    //     };
    // },

    // refreshSearchTable: function() {
    //     var self = this;
    //     var self = this;

    //     var oTable;

    //     if ($.fn.dataTable.isDataTable("#log-search-table")) {
    //         oTable = $("#log-search-table").DataTable();
    //         // oTable.ajax.url(uri);
    //         oTable.ajax.reload();
    //     }
    // },

    // drawSearchTable: function(location, start, end) {
    //     var self = this;
    //     var self = this;

    //     $("#log-table-loading-indicator").show();

    //     var oTable;

    //     var uri = this.urlGen(start, end);

    //     if ($.fn.dataTable.isDataTable(location)) {
    //         oTable = $(location).DataTable();
    //         // oTable.ajax.url(uri);
    //         // oTable.ajax.reload();
    //     } else {
    //         var oTableParams = {
    //             "info": true,
    //             "bAutoWidth": false,
    //             "autoWidth": true,
    //             "processing": true,
    //             "lengthChange": true,
    //             "paging": true,
    //             "searching": true,
    //             "ordering": true,
    //             "order": [
    //                 [0, 'desc']
    //             ],
    //             "serverSide": true,
    //             "ajax": {
    //                 beforeSend: function(obj, settings) {

    //                     // the url generated by urlGen will be available
    //                     // as this.url
    //                     self.urlGen();

    //                     // the pageSize and searchQuery are jQuery values
    //                     var pageSize = $('div#intel-search-data-table').find('select.form-control').val();
    //                     var searchQuery = $('div#intel-search-data-table').find('input.form-control').val();

    //                     // the paginationStart is taken from the dataTables
    //                     // generated serverSide query string that will be
    //                     // replaced by this.url after the required
    //                     // components are parsed out of it
    //                     var paginationStart = settings.url.match(/start=\d{1,}&/gi);
    //                     paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
    //                     var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
    //                     var urlColumnOrdering = decodeURIComponent(settings.url).match(/order\[0\]\[column\]=\d*/gi);

    //                     // capture which column was clicked
    //                     // and which direction the sort is called for

    //                     var urlOrderingDirection = decodeURIComponent(settings.url).match(/order\[0\]\[dir\]=(asc|desc)/gi);

    //                     // the url that will be fetched is now about to be
    //                     // replaced with the urlGen'd url before adding on
    //                     // the parsed components
    //                     settings.url = self.url + "&page_size=" + pageSize +
    //                         "&page=" + computeStartPage;

    //                     // here begins the combiation of additional params
    //                     // to construct the final url for the dataTable fetch
    //                     if (searchQuery) {
    //                         settings.url += "&_all__regexp=.*" +
    //                             searchQuery + ".*";
    //                     }

    //                     // if no interesting sort, ignore it
    //                     if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

    //                         // or, if something has changed, capture the
    //                         // column to sort by, and the sort direction

    //                         var columnLabelHash = {
    //                             0: '@timestamp',
    //                             1: 'syslog_severity',
    //                             2: 'component',
    //                             3: 'host',
    //                             4: 'log_message'
    //                         };

    //                         var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

    //                         var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

    //                         var ascDec;
    //                         if (orderByDirection === 'asc') {
    //                             ascDec = '';
    //                         } else {
    //                             ascDec = '-';
    //                         }

    //                         // TODO: uncomment when ordering is in place.
    //                         // settings.url = settings.url + "&ordering=" +
    //                         //     ascDec + columnLabelHash[orderByColumn];
    //                     }
    //                 },
    //                 dataFilter: function(data) {

    //                     /* dataFilter is analagous to the purpose of ajax 'success',
    //                     but you can't also use 'success' as then dataFilter
    //                     will not be triggered */

    //                     // clear any error messages when data begins to flow again
    //                     self.clearSearchDataErrorMessage('.search-popup-message');

    //                     var result = self.dataPrep(data);

    //                     // dataTables expects JSON encoded result
    //                     // return result;
    //                     return JSON.stringify(result);

    //                 },
    //                 error: function(data) {
    //                     self.searchDataErrorMessage(null, data, '.search-popup-message');
    //                 },
    //                 dataSrc: "result"
    //             },
    //             "columnDefs": [{
    //                 "data": "@timestamp",
    //                 "type": "date",
    //                 "targets": 0,
    //                 "render": function(data, type, full, meta) {
    //                     return moment(data).format();
    //                 }
    //             }, {
    //                 "data": "syslog_severity",
    //                 "targets": 1
    //             }, {
    //                 "data": "component",
    //                 "targets": 2
    //             }, {
    //                 "data": "host",
    //                 "targets": 3
    //             }, {
    //                 "data": "log_message",
    //                 "targets": 4
    //             }]
    //         };
    //         oTable = $(location).DataTable(oTableParams);
    //     }
    //     $("#log-table-loading-indicator").hide();
    // },

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

    template: _.template(
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<div class="compliance-predefined-search-container"></div>'),

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

    addModalAndHeadingIcons: function() {
        $(this.el).find('.special-icon-pre').append('<i class="fa fa-filter pull-right" data-toggle="modal"' +
            'data-target="#modal-filter-' + this.el.slice(1) + '" style="margin: 0 15px;"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-forward pull-right" style="margin: 0 4px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-plus pull-right" style="margin: 0 5px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-search-minus pull-right" style="margin: 0 20px 0 0"></i>');
        $(this.el).find('.special-icon-pre').append('<i class ="fa fa-lg fa-backward pull-right" style="margin: 0 5px 0 0"></i>');
        this.$el.append(this.modal2());
        return this;
    },


});