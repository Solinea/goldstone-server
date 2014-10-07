var HypervisorCoreCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data;
    },

    model: HypervisorCoreModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});
