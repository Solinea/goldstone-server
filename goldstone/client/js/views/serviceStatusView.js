var ServiceStatusView = Backbone.View.extend({

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

        var classSelector = function(item){
            if(item[0]){
                return 'alert alert-success';
            }
            return 'alert alert-danger';
        };

        _.each(payload, function(item, i) {
            $(this.defaults.location).append( '<div class="col-xs-2 ' + classSelector(_.values(payload[i])) + '">'  + _.keys(payload[i]) + '</div>');
        }, this);
        $(this.defaults.location).append('&nbsp;');
    }


});
