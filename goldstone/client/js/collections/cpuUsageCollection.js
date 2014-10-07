var CpuUsageCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data;
    },

    model: CpuUsageModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});
