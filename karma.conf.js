var clientIncludes = require('./test/client-files.conf.js');
var testFiles = clientIncludes.test;

module.exports = function(config) {
    config.set({

        //base path used to resolve files and excludes
        basePath: './',

        frameworks: ['mocha', 'chai', 'sinon'],

        //preload .js files
        files: [
            //from base.html
            'client/js/lib/jquery.js',
            'client/js/lib/bootstrap.js',
            'client/js/lib/jquery.dataTables.js',
            'client/js/lib/dataTables.bootstrap.js',
            'client/js/lib/jquery.datetimepicker.js',
            'client/js/lib/colorbrewer.js',
            'client/js/lib/d3.js',
            'client/js/lib/d3-tip.js',
            'client/js/lib/d3-legend.js',
            'client/js/lib/underscore.js',
            'client/js/lib/backbone.js',
            'client/js/lib/moment-with-locales.js',
            'client/js/lib/moment-timezone-with-data-2010-2020.js',
            'client/js/goldstoneBaseModel.js',
            'client/js/models/goldstoneColors.js',
            'client/js/models/infoButtonText.js',
            'client/js/views/chartHeaderView.js',
            'client/js/base.js',

            // super-classes must be instantiated
            // in the test config file.
            'client/js/goldstoneBaseView.js',
            'client/js/goldstoneBasePageView.js',
            'client/js/goldstoneBaseCollection.js',

            // superclass for other charts, must be declared here
            'client/js/utilizationCpuView.js'

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

            'client/js/*.js': ['coverage'],
            'client/js/models/*.js': ['coverage'],
            'client/js/collections/*.js': ['coverage'],
            'client/js/views/*.js': ['coverage']

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
