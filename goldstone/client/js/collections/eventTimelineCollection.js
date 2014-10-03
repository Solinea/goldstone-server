// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        return data.results;
    },

    model: EventTimelineModel,

    initialize: function(options) {
        this.url = options.url;

        // adding {remove.false} to the initial fetch
        // will introduce an artifact that will
        // render via d3
        this.fetch();
    }
});
