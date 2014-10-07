var HypervisorVmCpuCollection = Backbone.Collection.extend({

    parse: function(data) {
        console.log(data);
        return data;
    },

    model: HypervisorVmCpuModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    }
});
