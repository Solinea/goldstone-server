// define collection and link to model

var NodeAvailCollection = Backbone.Collection.extend({

    parse: function(data) {
        return data.results;
    },

    model: NodeAvailModel,

    thisXhr: null,

    setXhr: function() {
        this.thisXhr = this.fetch();
    },

    initialize: function(options) {
        this.url = options.url;
        this.setXhr();
    }
});
