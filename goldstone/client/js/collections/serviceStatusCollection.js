var ServiceStatusCollection = Backbone.Collection.extend({

    parse: function(data) {
        return this.dummy.results;
    },

    model: ServiceStatusModel,

    initialize: function(options) {
        this.url = options.url;
        this.fetch();
    },

    dummy: {
        results: [{
            "nova-compute1": true
        }, {
            "ovs-agent1": false,
        }, {
            "neutron-agent1": true
        }, {
            "nova-compute2": false
        }, {
            "ovs-agent2": true,
        }, {
            "neutron-agent2": true
        }, {
            "nova-compute3": true
        }, {
            "ovs-agent3": true,
        }, {
            "neutron-agent3": false
        }, {
            "nova-compute1": true
        }, {
            "ovs-agent1": false,
        }, {
            "neutron-agent1": true
        }, {
            "nova-compute2": false
        }, {
            "ovs-agent2": true,
        }, {
            "neutron-agent2": true
        }, {
            "nova-compute3": true
        }, {
            "ovs-agent3": true,
        }, {
            "neutron-agent3": false
        }]
    }
});
