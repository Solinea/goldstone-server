var UtilizationView = Backbone.View.extend({

    defaults: {
        margin: {
            left: 20,
            bottom: 20,
            top: 20,
            right: 20
        }
    },

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.width = options.width;

        var ns = this.defaults;
        var self = this;

        this.collection.on('sync', this.update, this);

        ns.w = ns.width;

        // initialize axis and svg
        ns.bottomAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(5)
            .tickFormat(d3.time.format("%H:%M"));

        var color = d3.scale.category20();

        ns.leftAxis = d3.svg.axis()
            .orient("left")
            .ticks(5)
            .tickFormat(d3.format(",.0f"));

        ns.xScale = d3.time.scale()
            .range([ns.margin.left, ns.w-ns.margin.right]);

        ns.yScale = d3.time.scale()
            .range([ns.w, ns.w - ns.margin.top - ns.margin.bottom]);

        ns.svg = d3.select(ns.location).append("svg")
            .attr("width", ns.w)
            .attr("height", ns.w);


        ns.graph = ns.svg.append("g").attr("id", "graph")
            .attr("transform", "translate(0,0)");

        ns.graph.append("g")
            .attr("class", "xLower axis")
            .attr("transform", "translate(0," + (ns.w - ns.margin.bottom) + ")");

        ns.graph.append("g")
            .attr("class", "yLeft axis")
            .attr("transform", "translate("+ns.margin.left+",0)");


        $('<img id="spinner" src="' + blueSpinnerGif + '">').load(function() {
            console.log(ns.width);
            $(this).appendTo(ns.location).css({
                'position': 'relative',
                'margin-left': (ns.width / 2),
                'margin-top': -(ns.width / 2)
            });
        });

    },

    update: function() {

        var ns = this.defaults;
        var self = this;
        $(ns.location).find('#spinner').hide();

        var allTheLogs = this.collection.toJSON();

        console.log(allTheLogs);

        $(this.defaults.location).append('<br>');

        var xEnd = moment(d3.min(_.map(allTheLogs, function(evt) {
            return evt.timestamp;
        })));

        var xStart = moment(d3.max(_.map(allTheLogs, function(evt) {
            return evt.timestamp;
        })));

        var yEnd = d3.min(_.map(allTheLogs, function(evt) {
            return evt.value;
        }));

        var yStart = d3.max(_.map(allTheLogs, function(evt) {
            return evt.value;
        }));

        ns.xScale = ns.xScale.domain([xEnd, xStart]);

        ns.yScale = ns.xScale.domain([yStart, 0]);

        // If we didn't receive any valid files, abort and pause
        if (allTheLogs.length === 0) {
            console.log('no data returned');
            return;
        }

        // Shape the dataset

        ns.dataset = allTheLogs
            .map(function(d) {
                d.timestamp = moment(d.timestamp)._d;
                return d;
            });


        // calculate the new domain.
        // adjust each axis to its new scale.

        ns.bottomAxis.scale(ns.xScale);
        ns.leftAxis.scale(ns.yScale);

        ns.svg.select(".xLower.axis")
            .transition()
            .call(ns.bottomAxis);

        ns.svg.select(".yLeft.axis")
            .transition()
            .call(ns.leftAxis);




        // _.each(allTheLogs, function(item) {
        //     $(this.defaults.location).append(new Date((_.keys(item.timestamp) * 1000)) + '<br> Value: ' + item.value + '<br>');
        // }, this);
    }

});
