// Defines files that will be scanned with jshint is run.
// The order of these files is significant if 'grunt concat' is set up.

module.exports = [

    'goldstone/static/js/base.js',
    'goldstone/static/js/goldstone.js',

    'goldstone/apps/nova/static/nova/js/nova.js',
    'goldstone/apps/neutron/static/neutron/js/neutron.js',
    'goldstone/apps/keystone/static/keystone/js/keystone.js',
    'goldstone/apps/glance/static/glance/js/glance.js',
    'goldstone/apps/cinder/static/cinder/js/cinder.js',
    'goldstone/apps/api_perf/static/api_perf/js/api_perf.js',

    'goldstone/client/js/models/apiPerfModel.js',
    'goldstone/client/js/collections/apiPerfCollection.js',
    'goldstone/client/js/views/apiPerfView.js'
];
