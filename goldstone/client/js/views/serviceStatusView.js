var ServiceStatusView = Backbone.View.extend({

    defaults: {},

    initialize: function(options){
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.width = options.width;

        this.collection.on('sync', this.update, this);
    }


});
