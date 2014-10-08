var CpuUsageCollection = Backbone.Collection.extend({

    parse: function(data) {
        return this.dummy.results;
    },

    model: CpuUsageModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    },

    dummy: {
        "name": "os.cpu.system",
        "units": "percent",
        results: [{
            "timestamp": 1000000000,
            "value": 25
        }, {
            "timestamp": 1000360000,
            "value": 20
        }, {
            "timestamp": 1000720000,
            "value": 23
        }, {
            "timestamp": 1001080000,
            "value": 35
        }, {
            "timestamp": 1001440000,
            "value": 30
        }, {
            "timestamp": 1001800000,
            "value": 15
        }, {
            "timestamp": 1002160000,
            "value": 15
        }, {
            "timestamp": 1002540000,
            "value": 20
        }]
    }
});
