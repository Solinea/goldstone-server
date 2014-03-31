goldstone.namespace('nova.dom')
goldstone.namespace('nova.discover')
goldstone.namespace('nova.report')
goldstone.namespace('nova.spawns')
goldstone.namespace('nova.spawns.renderlets')
goldstone.namespace('nova.cpu')
goldstone.namespace('nova.cpu.renderlets')
goldstone.namespace('nova.mem')
goldstone.namespace('nova.mem.renderlets')
goldstone.namespace('nova.disk')
goldstone.namespace('nova.disk.renderlets')
goldstone.namespace('nova.zones')
goldstone.namespace('nova.zones.renderlets')

goldstone.nova._url = function (ns, start, end, interval, render, path) {
    "use strict";
    var gt = goldstone.time
    start = start ? gt.toPyTs(start) : gt.toPyTs(ns.start)
    end = end ? gt.toPyTs(end) : gt.toPyTs(ns.end)
    interval = interval ? interval : ns.interval

    var url = path +
        "?start=" + start +
        "&end=" + end +
        "&interval=" + interval
    if (typeof render !== 'undefined') {
        url += "&render=" + render
    }
    return url
}

goldstone.nova.spawns.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.spawns,
        path = "/nova/hypervisor/spawns"
    return goldstone.nova._url(ns, start, end, interval, render, path)
}

goldstone.nova.cpu.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.cpu,
        path = "/nova/hypervisor/cpu"
    return goldstone.nova._url(ns, start, end, interval, render, path)
}

goldstone.nova.mem.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.mem,
        path = "/nova/hypervisor/mem"
    return goldstone.nova._url(ns, start, end, interval, render, path)
}


goldstone.nova.disk.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.disk,
        path = "/nova/hypervisor/disk"
    return goldstone.nova._url(ns, start, end, interval, render, path)
}

goldstone.nova.zones.url = function (start, end, interval, render) {
    "use strict";
    var ns = goldstone.nova.zones,
        path = "/nova/zones"
    return goldstone.nova._url(ns, start, end, interval, render, path)
}

goldstone.nova._loadUrl = function (ns, start, end, interval, location, render) {
    "use strict";
    location = location ? location : ns.parent

    ns.parent = location
    ns.start = start
    ns.end = end
    ns.interval = interval

    render = typeof render !== 'undefined' ? render : false
    if (render) {
        $(ns.parent).load(ns.url(start, end, interval, render))
    } else {
        // just get the data and set it in the spawn object
        $.getJSON(ns.url(start, end, interval, render), function (data) {
            ns.data = data
            // TODO trigger a redraw of the chart with the new data
        })
    }
}

goldstone.nova.spawns.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.spawns

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.cpu.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.cpu

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.mem.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.mem

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.disk.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.disk

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.zones.loadUrl = function (start, end, interval, location, render) {
    "use strict";
    var ns = goldstone.nova.zones

    goldstone.nova._loadUrl(ns, start, end, interval, location, render)
}

goldstone.nova.spawns.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [successes(Number), failures(Number)], ...}
    var ns = goldstone.nova.spawns
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                successGroup = timeDim.group().reduceSum(function (d) { return d[1] }),
                failureGroup = timeDim.group().reduceSum(function (d) { return d[2] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(successGroup, "Success").valueAccessor(function (d) {
                    return d.value
                })
                .stack(failureGroup, "Fail", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value + " events"
                })
                .yAxisLabel("Spawn Events")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.spawns.renderlets.clickDrill = function (_chart) {
    "use strict";
    var ns = goldstone.nova.spawns
    var gt = goldstone.time
    _chart.selectAll("circle.dot")
        .on("click", function (d) {
            var oldInterval = Number(ns.interval.slice(0, -1))
            var start = (new Date(d.data.key)).addSeconds(-1 * oldInterval),
                end = (new Date(d.data.key)).addSeconds(oldInterval),
                newInterval = gt.autoSizeInterval(start, end)

            ns.loadUrl(start, end, newInterval, ns.parent, true)

        })
}

goldstone.nova.cpu.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [total_phys(Number), used_phys(Number),
        //                       [total_virt(Number), used_virt(Number)], ...}
    var ns = goldstone.nova.cpu
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1], v[2], v[3]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                totalPhys = timeDim.group().reduceSum(function (d) { return d[1] }),
                usedPhys = timeDim.group().reduceSum(function (d) { return d[2] }),
                totalVirt = timeDim.group().reduceSum(function (d) { return d[3] }),
                usedVirt = timeDim.group().reduceSum(function (d) { return d[4] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(usedVirt, "Used vCPUs").valueAccessor(function (d) {
                    return d.value
                })
                .stack(usedPhys, "Used pCPUs", function (d) {
                    return d.value
                })
                .stack(totalPhys, "Total pCPUs", function (d) {
                    return d.value
                })
                .stack(totalVirt, "Total vCPUs", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value
                })
                .yAxisLabel("CPU Count")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.mem.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [total_phys(Number), used_phys(Number),
        //                       [total_virt(Number), used_virt(Number)], ...}
    var ns = goldstone.nova.mem
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1], v[2], v[3]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                totalPhys = timeDim.group().reduceSum(function (d) { return d[1] }),
                usedPhys = timeDim.group().reduceSum(function (d) { return d[2] }),
                totalVirt = timeDim.group().reduceSum(function (d) { return d[3] }),
                usedVirt = timeDim.group().reduceSum(function (d) { return d[4] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(usedVirt, "Used vRAM").valueAccessor(function (d) {
                    return d.value
                })
                .stack(usedPhys, "Used pRAM", function (d) {
                    return d.value
                })
                .stack(totalPhys, "Total pRAM", function (d) {
                    return d.value
                })
                .stack(totalVirt, "Total vRAM", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value
                })
                .yAxisLabel("RAM GBs")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.disk.drawChart = function () {
    // now we can customize it to handle our data.  Data structure looks like:
        // {'timestamp'(String): [successes(Number), failures(Number)], ...}
    var ns = goldstone.nova.disk
    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            // this gets us a basic chart
            ns.chart = goldstone.charts.lineChartBase(ns.location, null, ns.renderlets.clickDrill)
            var events = _.map(ns.data, function (v, k) {
                return [new Date(Number(k)), v[0], v[1]]
            })
            var xf = crossfilter(events),
                timeDim = xf.dimension(function (d) {
                    return d[0]
                }),
                minDate = timeDim.bottom(1)[0][0],
                maxDate = timeDim.top(1)[0][0],
                totalPhys = timeDim.group().reduceSum(function (d) { return d[1] }),
                usedPhys = timeDim.group().reduceSum(function (d) { return d[2] })

            ns.chart
                .height(ns.height)
                .elasticY(true)
                .hidableStacks(true)
                .dimension(timeDim)
                .group(usedPhys, "Used").valueAccessor(function (d) {
                    return d.value
                })
                .stack(totalPhys, "Total", function (d) {
                    return d.value
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .title(function (d) {
                    return d.key + ": " + d.value
                })
                .yAxisLabel("Disk GB")
                .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5).horizontal(true))

            ns.chart.render()
            $(ns.spinner).hide()
        }
    }
}

goldstone.nova.zones.drawChart = function () {
    "use strict";
    var ns = goldstone.nova.zones,
        panelWidth = $(ns.location).width(),
        force = d3.layout.force()
            .size([panelWidth, ns.height])
            .on("tick", tick),
        labelForce = d3.layout.force()
            .size([panelWidth, ns.height])
            .on("tick", tick),
        svg = d3.select(ns.location).append("svg")
            .attr("width", panelWidth)
            .attr("height", ns.height),
        link = svg.selectAll(".link"),
        node = svg.selectAll(".node"),
        labelLink = svg.selectAll("g.labelLink"),
        labelNode = svg.selectAll("g.labelNode"),
        labelDistance = 0,
        root

    function update() {
        var nodes = flatten(root),
            links = d3.layout.tree().links(nodes),
            labelNodes = [],
            labelLinks = []

        _.forEach(nodes, function (node) {
            labelNodes.push({node : node })
            labelNodes.push({node : node })
        })
        for (var i = 0 ; i < nodes.length; i++) {
            labelLinks.push({
					source : i * 2,
					target : i * 2 + 1,
					weight : 1
				});

        }

        // Restart the force layout.
        force
          .nodes(nodes)
          .links(links)
          .gravity(0)
          .charge(function (d) { return d._children ? -d.size / 100 : -60; })
          .linkDistance(function (d) { return d.target._children ? 80 : 30; })
          .start()

        // Update the links…
        link = link.data(links, function (d) {
            console.log("updating link, d =  " + JSON.stringify(d))
            console.log("updating link, returning " + d.target.id)
            return d.target.id;
        })

        // Exit any old links.
        link.exit().remove()

        // Enter any new links.
        link.enter().insert("line", ".node")
          .attr("class", "link")
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; })

        // Update the nodes…
        node = node.data(nodes, function (d) {
            return d.id
        }).style("fill", color)

        // Exit any old nodes.
        node.exit().remove();

        // Enter any new nodes.
        node.enter().append("circle")
          .attr("class", "node")
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; })
          .attr("r", function (d) { return Math.sqrt(d.size) / 10 || 4.5; })
          .style("fill", color)
          .on("click", click)
          .call(force.drag)

        // now we take care of the labels
        labelForce
            .nodes(labelNodes)
            .links(labelLinks)
            .gravity(0)
            .linkDistance(0)
            .linkStrength(8)
            .charge(-100)
            .start()

        labelLink = labelLink.data(labelLinks)

        labelLink.enter()
            .insert("line", ".labelNode")
            .attr("class", "labelLink")
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; })
            //.append("svg:line")
            //.attr("class", "labelLink")
            .style("stroke", "#333333");

        labelLink.exit()
            .remove()

        labelNode = labelNode.data(labelForce.nodes())

        labelNode.enter()
            .append("circle")
            .attr("class", "labelNode")
            .style("fill", "#111111")
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .attr("r", 0)
            //.append("svg:g")
            //.attr("class", "labelNode")
            .on("click", click)
            .call(force.drag)

        labelNode
            .append("svg:circle")
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .attr("r", 0)
            .style("fill", "#333333")

        labelNode
            .append("svg:text")
            .text(function (d, i) {
                console.log("adding name " + d.node.name + " to d " + JSON.stringify(d))
				return i % 2 == 0 ? "" : d.node.name
			})
            .style("fill", "#000000")
            .style("font-family", "Arial")
            .style("font-size", 12);

    }

    function tick() {
        link
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });

        node
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });

        labelNode.each(function (d, i) {
            if (i % 2 == 0) {
                console.log("label node id was even, x, y = [" + d.node.x + ", " + d.node.y + "]")
                d.x = d.node.x;
                d.y = d.node.y;
            } else {
                console.log("label node id was odd")
                var b = this.childNodes[1].getBBox()
                var diffX = d.x - d.node.x,
                    diffY = d.y - d.node.y,
                    dist = Math.sqrt(diffX * diffX + diffY * diffY),
                    shiftX = b.width * (diffX - dist) / (dist * 2),
                    shiftY = 5;

                shiftX = Math.max(-b.width, Math.min(0, shiftX))
                console.log("shift = [" + shiftX + ", " + shiftY + "]")
                this.childNodes[1]
                    .setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
            }
        })

        labelLink
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });

        labelNode
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });


    }

    // Color leaf nodes orange, and packages white or blue.
    function color(d) {
        //console.log("setting color to " + (d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c"))
        return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
    }

    // Toggle children on click.
    function click(d) {
        if (!d3.event.defaultPrevented) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update();
        }
    }

    // Returns a list of all nodes under the root.
    function flatten(root) {
        var nodes = [], i = 0;

        function recurse(node) {
            if (node.children) node.children.forEach(recurse);
            if (!node.id) node.id = ++i;
            nodes.push(node);

        }

        recurse(root);
        return nodes;
    }



    if (ns.data !== 'undefined') {
        if (Object.keys(ns.data).length === 0) {
            $(ns.location).append("<p> Response was empty.")
            $(ns.spinner).hide()
        } else {
            (function (json) {
                root = json;
                update();
            })(ns.data);
        }
    }
}


