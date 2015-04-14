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
            'goldstone/client/js/lib/jquery.js',
            'goldstone/client/js/lib/bootstrap.js',
            'goldstone/client/js/lib/jquery.dataTables.js',
            'goldstone/client/js/lib/dataTables.bootstrap.js',
            'goldstone/client/js/lib/jquery.datetimepicker.js',
            'goldstone/client/js/lib/colorbrewer.js',
            'goldstone/client/js/lib/d3.js',
            'goldstone/client/js/lib/d3-tip.js',
            'goldstone/client/js/lib/d3-legend.js',
            'goldstone/client/js/lib/underscore.js',
            'goldstone/client/js/lib/backbone.js',
            'goldstone/client/js/lib/moment-with-locales.js',
            'goldstone/client/js/lib/moment-timezone-with-data-2010-2020.js',
            'goldstone/client/js/goldstoneBaseModel.js',
            'goldstone/client/js/models/goldstoneColors.js',
            'goldstone/client/js/models/infoButtonText.js',
            'goldstone/client/js/views/chartHeaderView.js',
            'goldstone/client/js/base.js',

            // super-classes must be instantiated
            // in the test config file.
            'goldstone/client/js/goldstoneBaseView.js',
            'goldstone/client/js/goldstoneBasePageView.js',

            // superclass for other charts, must be declared here
            'goldstone/client/js/utilizationCpuView.js'

        ].concat(clientIncludes.clientWildcards, testFiles),

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

            'goldstone/client/js/*.js': ['coverage'],
            'goldstone/client/js/models/*.js': ['coverage'],
            'goldstone/client/js/collections/*.js': ['coverage'],
            'goldstone/client/js/views/*.js': ['coverage']

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
