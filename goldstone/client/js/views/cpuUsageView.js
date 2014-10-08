var CpuUsageView = Backbone.View.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.url = this.collection.url;
        this.defaults.location = options.location;
        this.defaults.width = options.width;

        this.collection.on('sync', this.update, this);
    },

    update: function() {
        var payload = this.collection.toJSON();
        $(this.defaults.location).append('<br>');

        _.each(payload, function(item) {
            $(this.defaults.location).append(new Date((_.keys(item.timestamp) * 1000)) + '<br> Value: ' + item.value + '<br>');
        }, this);
    }

});
