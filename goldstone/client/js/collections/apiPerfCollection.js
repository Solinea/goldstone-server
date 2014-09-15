// define collection and link to model

var ApiPerfCollection = Backbone.Collection.extend({

    parse: function(data) {
        return JSON.parse(data);
    },

    model: ApiPerfModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});
