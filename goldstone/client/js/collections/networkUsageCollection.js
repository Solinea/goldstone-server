var NetworkUsageCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data;
    },

    model: NetworkUsageModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});
