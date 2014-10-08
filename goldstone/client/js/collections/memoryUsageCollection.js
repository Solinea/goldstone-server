var MemoryUsageCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data;
    },

    model: MemoryUsageModel,

    initialize: function(options) {
        this.url = options.url;
        // this.fetch();
        this.parse('hello, world!');
    }
});
