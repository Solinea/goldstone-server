// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {

        if (data.previous !== null) {

            this.url = data.previous.slice(data.previous.indexOf('/logging')).trim();

            // {remove:false} will aggregate
            // successive calls instead of
            // resetting the models each time
            this.fetch({
                remove: false
            });
        }

        return data.results;
    },

    model: EventTimelineModel,

    initialize: function(options) {
        this.url = options.url;

        // adding {remove.false} to the initial fetch
        // will introduce an artifact that will
        // render via d3
        this.fetch();
    }
});
