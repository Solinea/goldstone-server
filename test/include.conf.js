// Defines files that will be scanned with jshint is run.
// The order of these files is significant if 'grunt concat' is set up.

module.exports = [

    'goldstone/client/js/lib/base.js',
    'goldstone/client/js/lib/goldstone.js',

    'goldstone/client/js/lib/nova.js',
    'goldstone/client/js/lib/neutron.js',
    'goldstone/client/js/lib/keystone.js',
    'goldstone/client/js/lib/glance.js',
    'goldstone/client/js/lib/cinder.js',
    'goldstone/client/js/lib/api_perf.js',

    'goldstone/client/js/models/apiPerfModel.js',
    'goldstone/client/js/collections/apiPerfCollection.js',
    'goldstone/client/js/views/apiPerfView.js'
];
