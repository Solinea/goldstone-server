var clientIncludes = require('./client/client-files-config.js');

module.exports = function(config) {
    config.set({

        //base path used to resolve files and excludes
        basePath: './',

        frameworks: ['mocha', 'chai', 'sinon'],

        //preload .js files
        files: clientIncludes.lib.concat(clientIncludes.clientWildcards).concat(clientIncludes.opentrailWildcards).concat(clientIncludes.testMocks).concat(clientIncludes.test).concat(clientIncludes.otTest),

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
        preprocessors: clientIncludes.coverageReportTargets,

        // coverage config
        coverageReporter: {
            type: 'html',
            dir: clientIncludes.coverageReportOutput
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
