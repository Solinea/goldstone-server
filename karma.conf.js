var clientIncludes = require('./test/include.conf.js');
var testFiles = require('./test/tests.conf.js');

module.exports = function(config) {
    config.set({

        //base path used to resolve files and excludes
        basePath: './',

        frameworks: ['mocha', 'chai', 'sinon'],

        //preload .js files
        files: [
            //from base.html
            'goldstone/client/js/lib/jquery.min.js',
            'goldstone/static/js/bootstrap.min.js',
            'goldstone/static/dataTables/jquery.dataTables.js',
            'goldstone/static/dataTables/dataTables.bootstrap.js',
            'goldstone/static/js/plugins/datetimepicker/jquery.datetimepicker.js',
            'goldstone/static/js/colorbrewer.js',
            'goldstone/static/js/d3.js',
            'goldstone/static/js/d3-tip.js',
            'goldstone/static/js/d3-legend.js',
            'goldstone/static/js/crossfilter.js',
            'goldstone/static/js/dc.js',
            'goldstone/client/js/lib/underscore-min.js',
            'goldstone/client/js/lib/backbone.js',
            'goldstone/static/js/moment-with-locales.js',
            'goldstone/static/js/moment-timezone-with-data-2010-2020.js'
        ].concat(clientIncludes, testFiles),

        exclude: [
            'karma.conf.js'
        ],

        // progress reporter: lists each test run and whether they pass/fail
        // coverage reporter: creates coverage reports for every tested browser
        reporters: ['progress', 'coverage'],

        // web server port
        port: 9988,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // test with:
        browsers: ['Chrome'],

        // Source files you want to generate coverage reports for
        // This should not include tests or libraries
        // These files will be instrumented by Istanbul
        preprocessors: {

            'goldstone/apps/nova/static/nova/js/nova.js': ['coverage'],
            'goldstone/apps/neutron/static/neutron/js/neutron.js': ['coverage'],
            'goldstone/apps/keystone/static/keystone/js/keystone.js': ['coverage'],
            'goldstone/apps/glance/static/glance/js/glance.js': ['coverage'],
            'goldstone/apps/cinder/static/cinder/js/cinder.js': ['coverage'],
            'goldstone/apps/api_perf/static/api_perf/js/api_perf.js': ['coverage'],
            'goldstone/client/js/models/apiPerfModel.js': ['coverage'],
            'goldstone/client/js/collections/apiPerfCollection.js': ['coverage'],
            'goldstone/client/js/views/apiPerfView.js': ['coverage'],
            'goldstone/static/js/base.js': ['coverage'],
            'goldstone/static/js/goldstone.js': ['coverage']

        },

        // coverage config
        coverageReporter: {
            type: 'html',
            dir: 'test/results/coverage'
        },

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 10000,

        // Auto run tests on start (when browsers are captured) and exit
        singleRun: false,

        // report which specs fall below this ms count:
        reportSlowerThan: 500,

        // additional plugins needed for testing
        plugins: [
            'karma-coverage',
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-chrome-launcher'
        ]
    });
};
