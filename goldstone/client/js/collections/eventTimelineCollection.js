// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        return JSON.parse(data);
    },

    model: EventTimelineModel,

    initialize: function(options) {
        this.url = options.url;
        // this.fetch();
    }
});
