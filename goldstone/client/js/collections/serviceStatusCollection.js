var ServiceStatusCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data;
    },

    model: ServiceStatusModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});
