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

// view is linked to collection when instantiated in goldstone_discover.html

var TopologyTreeView = GoldstoneBaseView.extend({

    defaults: {},

    // this block is run upon instantiating the object
    initialize: function(options) {

        this.options = options || {};
        this.defaults = _.clone(this.defaults); 
        this.el = options.el;

        this.defaults.blueSpinnerGif = options.blueSpinnerGif;
        this.defaults.chartHeader = options.chartHeader || null;

        // data may be coming from a collection fetch soon
        this.defaults.data = options.data;
        this.defaults.h = options.h;

        // frontPage affects clicking of leaves.
        // whether it will redirect or append
        // results to resource list
        this.defaults.frontPage = options.frontPage;
        this.defaults.multiRsrcViewEl = options.multiRsrcViewEl || null;
        this.defaults.w = options.width;
        this.defaults.leafDataUrls = options.leafDataUrls;
        this.defaults.filterMultiRsrcDataOverride = options.filterMultiRsrcDataOverride || null;

        var ns = this.defaults;
        var self = this;

        this.render();
        this.initSvg();

        // when extended to zoomablePartitionView, a collection
        // is used to fetch the data and update will be triggered
        // by the listener on that subView.
        if(this.collection === undefined) {
            this.update();
        } else {
            this.processListeners();
        }
    },

    filterMultiRsrcData: function(data) {

        // this allows for passing in arrays of paramaters
        // to omit from the returned data before rendering
        // as a data table in 'resource list'

        var ns = this.defaults;
        var self = this;

        if (ns.filterMultiRsrcDataOverride === null) {
            return data;
        } else {
            var newData = jQuery.extend(true, {}, data);
            newData = _.map(newData, function(item) {
                return _.omit(item, ns.filterMultiRsrcDataOverride);
            });
            return newData;
        }

    },

    initSvg: function() {
        var self = this;
        var ns = this.defaults;

        ns.margin = {
            top: 10,
            bottom: 10,
            right: 10,
            left: 30
        };
        ns.mw = ns.w - ns.margin.left - ns.margin.right;
        ns.mh = ns.h - ns.margin.top - ns.margin.bottom;
        ns.svg = d3.select(self.el).select('#topology-tree')
            .append("svg")
            .attr("width", ns.w)
            .attr("height", ns.h);
        ns.tree = d3.layout.tree()
            .size([ns.mh, ns.mw])
            .separation(function(a, b) {
                var sep = a.parent === b.parent ? 3 : 2;
                return sep;
            });
        ns.i = 0; // used in processTree for node id
        ns.diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });
        ns.chart = ns.svg.append("g")
            .attr('class', 'chart')
            .attr("transform", "translate(" + ns.margin.left + "," + ns.margin.top + ")");
    },
    hasRemovedChildren: function(d) {
        return d._children && _.findWhere(d._children, {
            'lifeStage': 'removed'
        });
    },
    isRemovedChild: function(d) {
        return d.lifeStage === 'removed';
    },
    toggleAll: function(d) {
        var self = this;
        if (d.children) {
            d.children.forEach(self.toggleAll, this);
            self.toggle(d);
        }
    },
    toggle: function(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    },
    drawSingleRsrcInfoTable: function(scrollYpx, json) {
        // make a dataTable
        var location = '#single-rsrc-table';
        var oTable;
        var keys = Object.keys(json);
        var data = _.map(keys, function(k) {
            if (json[k] === Object(json[k])) {
                return [k, JSON.stringify(json[k])];
            } else {
                return [k, json[k]];
            }
        });

        $("#multi-rsrc-body").popover({
            trigger: "manual",
            placement: "left",
            html: true,
            title: '<div>Resource Info<button type="button" style="color:#fff; opacity:1.0;" id="popover-close" class="close pull-right" data-dismiss="modal"' +
                'aria-hidden="true">&times;</button></div>',
            content: '<div id="single-rsrc-body" class="panel-body">' +
                '<table id="single-rsrc-table" class="table table-hover"></table>' +
                '</div>'
        });
        $("#multi-rsrc-body").popover("show");
        $("#popover-close").on("click", function() {
            $("#multi-rsrc-body").popover("hide");
        });
        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "scrollY": "300px",
                "autoWidth": true,
                "info": false,
                "paging": false,
                "searching": false,
                "columns": [{
                    "title": "Key"
                }, {
                    "title": "Value"
                }]
            };
            oTable = $(location).dataTable(oTableParams);
        }
    },

    loadLeafData: function(dataUrl) {
        var self = this;
        var ns = this.defaults;

        $(ns.multiRsrcViewEl).find('#spinner').show();

        // This .get call has been converted to take advantage of
        // the 'promise' format that it supports. The 'success' and
        // 'fail' pathways will be followed based on the response
        // from the dataUrl API call. The 'always' route pathway
        // will be followed in every case, removing the loading
        // spinner from the chart.

        $.get(dataUrl, function() {}).success(function(payload) {

            // a click listener shall be appended below which
            // will determine if the data associated with the
            // leaf contains "hypervisor_hostname" or "host_name"
            // and if so, a click will redirect, instead of
            // merely appending a resource info chart popup

            // clear any existing error message
            self.clearDataErrorMessage(ns.multiRsrcViewEl);

            // the response may have multiple lists of services for different
            // timestamps.  The first one will be the most recent.
            var firstTsData = payload[0] !== 'undefined' ? payload[0] : [];
            var myUuid = goldstone.uuid()();
            var filteredFirstTsData;
            var keys;
            var columns;
            var columnDefs;
            var oTable;

            // firstTsData[0] if it exists, contains key/values representative
            // of table structure.
            if (firstTsData[0] !== 'undefined') {
                firstTsData = _.map(firstTsData, function(e) {
                    e.datatableRecId = goldstone.uuid()();
                    return e;
                });

                if ($.fn.dataTable.isDataTable("#multi-rsrc-table")) {
                    oTable = $("#multi-rsrc-table").DataTable();
                    oTable.destroy(true);
                }

                filteredFirstTsData = self.filterMultiRsrcData(firstTsData);
                if (filteredFirstTsData.length > 0) {
                    keys = Object.keys(filteredFirstTsData[0]);
                    columns = _.map(keys, function(k) {
                        if (k === 'datatableRecId') {
                            return {
                                'data': k,
                                'title': k,
                                'visible': false,
                                'searchable': false
                            };
                        } else {
                            return {
                                'data': k,
                                'title': k
                            };
                        }
                    });

                    $("#multi-rsrc-body").prepend('<table id="multi-rsrc-table" class="table table-hover"><thead></thead><tbody></tbody></table>');
                    oTable = $("#multi-rsrc-table").DataTable({
                        "processing": true,
                        "serverSide": false,
                        "data": filteredFirstTsData,
                        "columns": columns,
                        "scrollX": true
                    });
                    $("#multi-rsrc-table tbody").on('click', 'tr', function() {
                        // we want to identify the row, find the datatable id,
                        // then find the matching element in the full data.s
                        var row = oTable.row(this).data();
                        var data = _.where(firstTsData, {
                            'datatableRecId': row.datatableRecId
                        });
                        var singleRsrcData = jQuery.extend(true, {}, data[0]);
                        if (singleRsrcData !== 'undefined') {
                            delete singleRsrcData.datatableRecId;

                            var supress;

                            var storeDataLocally = function(data) {
                                localStorage.setItem('detailsTabData', JSON.stringify(data));
                            };
                            // if hypervisor or instance with hypervisor in
                            // the name, redirect to report page
                            _.each(_.keys(data[0]), function(item) {
                                if (item.indexOf('hypervisor_hostname') !== -1) {
                                    storeDataLocally(data[0]);
                                    self.reportRedirect(data[0], item);
                                    supress = true;
                                }
                                if (item.indexOf('host_name') !== -1) {
                                    storeDataLocally(data[0]);
                                    self.reportRedirect(data[0], item);
                                    supress = true;
                                }
                            });

                            // otherwise, render usual resource info    popover
                            if (!supress) {
                                self.drawSingleRsrcInfoTable(ns.mh, data[0]);
                            }
                        }
                    });
                } else {
                    goldstone.raiseAlert($(ns.multiRsrcViewEl).find('.popup-message'), 'No data', true);
                }
            }
        }).fail(function(error) {

            // ns.multiRscsView is defined in this.render
            if (ns.multiRscsView !== undefined) {

                // there is a listener defined in the
                // multiRsrcView that will append the
                // error message to that div

                // trigger takes 2 args:
                // 1: 'triggerName'
                // 2: array of additional params to pass
                ns.multiRscsView.trigger('errorTrigger', [error]);
            }

            // TODO: if this view is instantiated in a case where there
            // is no multiRscsViewEl defined, there will be no
            // ns.multiRscsView defined. In that case, error messages
            // will need to be appended to THIS view. So there will need
            // to be a fallback instantiation of this.dataErrorMessage that will render on THIS view.

        }).always(function() {

            // always remove the spinner after the API
            // call returns
            $(ns.multiRsrcViewEl).find('#spinner').hide();
        });
    },
    reportRedirect: function(data, keyName) {

        // used to redirect to nodeReports when relevant
        // dataTable results are clicked
        var redirectNodeName = data[keyName];
        if (redirectNodeName.indexOf('.') !== -1) {
            redirectNodeName = redirectNodeName.slice(0, redirectNodeName.indexOf('.'));
        }
        window.location.href = '#/report/node/' + redirectNodeName;
    },

    appendLeafNameToResourceHeader: function(text, location) {

        // appends the name of the resource list currently being displayed
        location = location || '.panel-header-resource-title';
        $(location).text(': ' + text);
    },

    processTree: function(json) {
        // not used in zoomablePartitionView
        // but must keep for old collapsable tree style viz

        var ns = this.defaults;
        var that = this;
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        var nodes = ns.tree.nodes(ns.data).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * 100;
        });

        // Update the nodes…
        var node = ns.chart.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++ns.i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", function(d) {
                if (d.rsrcType.match(/-leaf$/)) {
                    return "data-leaf node";
                } else {
                    return "node";
                }
            })
            .attr("id", function(d, i) {
                return "node-" + d.label + i;
            })
            .attr("transform", function(d) {
                return "translate(" + json.y0 + "," + json.x0 + ")";
            })
            .on("click", function(d) {

                // for appending to resource chart header
                var origClickedLabel = d.label;

                if (d.rsrcType.match(/-leaf$/) && ns.leafDataUrls !== undefined) {
                    var url = ns.leafDataUrls[d.rsrcType];
                    if (url !== undefined) {
                        var hasParam = false;
                        if (d.hasOwnProperty('region')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "region=" + d.region;
                        }
                        if (d.hasOwnProperty('zone')) {
                            url = hasParam ? url + "&" : url + "?";
                            hasParam = true;
                            url = url + "zone=" + d.zone;
                        }

                        // !front page = load results
                        if (!ns.frontPage) {
                            that.loadLeafData(url);
                            that.appendLeafNameToResourceHeader(origClickedLabel);
                        }

                        // front page = redirect to new page
                        // if leaf is clicked
                        if (ns.frontPage) {

                            // if not a leaf, don't redirect
                            if (d.rsrcType === 'region' || d.rsrcType === 'module') {
                                return true;
                            } else {
                                var parentModule;

                                // traverse up the tree until the
                                // parent module is reached
                                while (d.rsrcType !== 'module') {
                                    d = d.parent;
                                }
                                parentModule = d.label;

                                // set resource url in localStorage
                                url = "/" + parentModule + url;
                                localStorage.setItem('urlForResourceList', url);
                                localStorage.setItem('origClickedLabel', origClickedLabel);
                                window.location.href = '#/' +
                                    parentModule + '/discover';
                            }
                        }
                    }

                } else {
                    that.toggle(d);
                    that.processTree(d);
                }
            });

        // add a circle to make clicking cleaner
        nodeEnter.append("svg:circle")
            .attr("id", function(d, i) {
                return "circle" + i;
            })
            .attr("cx", 8)
            .attr("cy", 2)
            .attr("r", 15)
            .style("fill-opacity", 1e-6)
            .style("stroke-opacity", 1e-6);

        // Add the text label (initially transparent)
        nodeEnter.append("svg:text")
            .attr("x", function(d) {
                return d.children ? 0 : 40;
            })
            .attr("dy", function(d) {
                return d.children ? "-1em" : ".5em";
            })
            .attr("text-anchor", function(d) {
                return d.children ? "middle" : "left";
            })
            .text(function(d) {
                return d.label;
            })
            .style("fill-opacity", 1e-6);

        // Add the main icon (initially miniscule)
        nodeEnter
            .append("g")
            .attr("class", function(d) {
                return "icon main " + (d.rsrcType || "cloud") + "-icon";
            })
            .attr("transform", "scale(0.0000001)");

        // Map of icons to the classes in which they'll be used
        d3.map({
            icon_backup: ['backups-leaf', 'snapshots-leaf'],
            icon_cloud: ['cloud', 'region'],
            icon_endpoint: ['endpoints-leaf'],
            icon_host: ['host', 'hosts-leaf', 'hypervisors-leaf',
                'servers-leaf'
            ],
            icon_image: ['images-leaf'],
            icon_module: ['module', 'secgroups-leaf'],
            icon_role: ['roles-leaf'],
            icon_service: ['service', 'services-leaf'],
            icon_tenant: ['tenants-leaf'],
            icon_types: ['volume-types-leaf'],
            icon_user: ['users-leaf'],
            icon_volume: ['volume', 'volumes-leaf'],
            icon_vol_transfer: ['agents-leaf', 'transfers-leaf'],
            icon_zone: ['zone', 'aggregates-leaf', 'cloudpipes-leaf',
                'flavors-leaf', 'floating-ip-pools-leaf', 'networks-leaf'
            ],

        }).forEach(function(icon, classes) {
            // Acutally attach the icons to the classes
            d3.xml(imgFile(icon), "image/svg+xml", function(img) {
                classes.forEach(function(c) {
                    ns.chart.selectAll(".icon.main." + c + "-icon")
                        .each(function() {
                            d3.select(this).node().appendChild(
                                img.getElementsByTagName("svg")[0].cloneNode(true));
                        });
                });
            }); // d3.xml()
        }); // forEach

        function imgFile(icon) {
            return "/static/images/" + icon + ".svg";
        }

        // Transition nodes to their new position.
        var nodeUpdate = node;

        nodeUpdate.select(".icon.main")
            .attr("transform", 'translate(-5, -10) scale(0.05)')
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeUpdate.select("text")
            .attr("x", function(d) {
                return d.children ? 0 : 25;
            })
            .attr("dy", function(d) {
                return d.children ? "-1em" : ".5em";
            })
            .attr("text-anchor", function(d) {
                return d.children ? "middle" : "left";
            })
            .style("fill-opacity", 1)
            .style("text-decoration", function(d) {
                return (that.hasRemovedChildren(d) || that.isRemovedChild(d)) ?
                    "line-through" : "";
            });

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + json.y + "," + json.x + ")";
            })
            .remove();

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = ns.chart.selectAll("path.link")
            .data(ns.tree.links(nodes), function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: json.x0,
                    y: json.y0
                };
                return ns.diagonal({
                    source: o,
                    target: o
                });
            })
            .transition()
            .duration(duration)
            .attr("d", ns.diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", ns.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: json.x,
                    y: json.y
                };
                return ns.diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    },
    update: function() {
        var ns = this.defaults;
        var self = this;

        if (ns.data !== 'undefined') {
            if (Object.keys(ns.data).length === 0) {
                $(self.el).find('#topology-tree').prepend("<p> Response was empty.");
            } else {
                (function(ns) {
                    ns.data.x0 = ns.h / 2;
                    ns.data.y0 = 0;
                    self.processTree(ns.data);
                })(ns);

                // render resource url in localStorage, if any
                if (localStorage.getItem('urlForResourceList') !== null) {
                    this.loadLeafData(localStorage.getItem('urlForResourceList'));
                }
                // append stored front-page leaf name to chart header
                if (localStorage.getItem('origClickedLabel') !== null) {
                    this.appendLeafNameToResourceHeader(localStorage.getItem('origClickedLabel'));
                }

                // delete localStorage keys that have been used to pre-fetch the
                // items that were clicke to arrive at this page
                localStorage.removeItem('urlForResourceList');
                localStorage.removeItem('origClickedLabel');
            }
        }
    },

    render: function() {

        var ns = this.defaults;

        // appends chart header to el with params passed in as array
        if (ns.chartHeader !== null) {
            new ChartHeaderView({
                el: ns.chartHeader[0],
                chartTitle: ns.chartHeader[1],
                infoText: ns.chartHeader[2],
                columns: 13
            });
        }

        // appends Resource List dataTable View if applicable
        if (ns.multiRsrcViewEl !== null) {
            ns.multiRscsView = new MultiRscsView({
                el: ns.multiRsrcViewEl,
            });

            var appendSpinnerLocation = $(ns.multiRsrcViewEl).find('#spinner-container');
            $('<img id="spinner" src="' + ns.blueSpinnerGif + '">').load(function() {
                $(this).appendTo(appendSpinnerLocation).css({
                    'position': 'absolute',
                    'margin-left': (ns.w / 2),
                    'margin-top': 5,
                    'display': 'none'
                });
            });

        }

        $(this.el).append(this.template);
        return this;
    },

    template: _.template('' +
        '<div class="panel-body" style="height:600px">' +
        '<div id="topology-tree">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )
});
