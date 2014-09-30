// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data.results;
    },

    model: EventTimelineModel,

    thisXhr: null,

    setXhr: function() {
        this.thisXhr = this.fetch();
    },

    initialize: function(options) {
        this.url = options.url;
        this.setXhr();
    }
});
