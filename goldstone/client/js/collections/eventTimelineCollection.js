// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        // console.log('data', this.thisXhr.responseText);
        // console.log('getallresponseheaders', this.thisXhr.getAllResponseHeaders());
        // console.log('does data have it?',this.thisXhr.getResponseHeader('LogCountEnd'));
        return data.results;
    },

    model: EventTimelineModel,

    thisXhr: null,

    setXhr: function() {
        this.thisXhr = this.fetch();
    },

    initialize: function(options) {
        this.url = options.url;
        this.setXhr();
    }
});
