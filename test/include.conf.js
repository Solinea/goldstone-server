// Defines files that will be scanned with jshint is run.
// The order of these files is significant if 'grunt concat' is set up.

module.exports = {
    clientWildcards: [
        'goldstone/client/js/base.js',
        'goldstone/client/js/goldstoneBaseModel.js',
        'goldstone/client/js/goldstoneBaseView.js',
        'goldstone/client/js/goldstoneBasePageView.js',
        'goldstone/client/js/goldstoneRouter.js',
        'goldstone/client/js/utilizationCpuView.js',
        'goldstone/client/js/models/*.js',
        'goldstone/client/js/collections/*.js',
        'goldstone/client/js/views/*.js'
    ],
    lib: ['goldstone/client/js/lib/jquery.js', 'goldstone/client/js/lib/bootstrap.js', 'goldstone/client/js/lib/jquery.dataTables.js', 'goldstone/client/js/lib/dataTables.bootstrap.js', 'goldstone/client/js/lib/jquery.datetimepicker.js', 'goldstone/client/js/lib/colorbrewer.js', 'goldstone/client/js/lib/d3.js', 'goldstone/client/js/lib/d3-tip.js', 'goldstone/client/js/lib/d3-legend.js', 'goldstone/client/js/lib/underscore.js', 'goldstone/client/js/lib/backbone.js', 'goldstone/client/js/lib/moment-with-locales.js', 'goldstone/client/js/lib/moment-timezone-with-data-2010-2020.js', 'goldstone/client/js/lib/jquery.sidr.min.js']
};
