module.exports = function(grunt) {
    // load up all of the necessary grunt plugins
    grunt.loadNpmTasks('grunt-casperjs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-focus');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-notify');

    // in what order should the files be concatenated
    var clientIncludeOrder = require('./test/include.conf.js');
    var testInclude = require('./test/tests.conf.js');

    // grunt setup
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // what files should be linted
        jshint: {
            gruntfile: 'Gruntfile.js',
            karmaConfig: 'karma.conf.js',
            client: clientIncludeOrder,
            test: [testInclude, 'test/e2e/e2eTests.js'],
            options: {
                globals: {
                    eqeqeq: true
                }
            }
        },

        // configure karma
        karma: {
            options: {
                configFile: 'karma.conf.js',
                reporters: ['progress', 'coverage']
            },
            // Single-run configuration for development
            single: {
                singleRun: true,
            }
        },

        // configure casperjs
        casperjs: {
            options: {},
            e2e: {
                files: {
                    'results/casper': ['test/e2e/e2eAuth.js', 'test/e2e/e2eTests.js', 'test/e2e/e2eLogout.js']
                }
            },
            skipLogout: {
                files: {
                    'results/casper': ['test/e2e/e2eAuth.js', 'test/e2e/e2eTests.js']
                }
            },
            logoutOnly: {
                files: {
                    'results/casper': ['test/e2e/e2eLogout.js']
                }
            },
            skipAuth: {
                files: {
                    'results/casper': ['test/e2e/e2eTests.js']
                }
            }
        },

        // create a watch task for tracking
        // any changes to the following files
        watch: {
            client: {
                files: clientIncludeOrder,
                tasks: ['lintAndTest']
            },
            gruntfile: {
                files: ['Gruntfile.js', 'karma.conf.js'],
                tasks: ['jshint:gruntfile', 'jshint:karmaConfig', 'lintAndTest']
            },
            unitTests: {
                files: ['test/unit/*.js'],
                tasks: ['lint', 'karma']
            },
            integrationTests: {
                files: ['test/integration/*.js'],
                tasks: ['lint', 'karma']
            },
            e2eTests: {
                files: ['test/e2e/*.js'],
                tasks: 'lintAndTest'
            }
        },

        focus: {
            dev: {
                include: ['unitTests', 'integrationTests']
            }
        }

    });

    // Start watching and run tests when files change
    grunt.registerTask('default', ['lint', 'test']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('test', ['karma', 'casperjs:e2e']);
    grunt.registerTask('lintAndTest', ['lint', 'test']);
    grunt.registerTask('testDev', ['lint', 'karma', 'focus:dev']);
    grunt.registerTask('casper', ['casperjs:e2e']);
    grunt.registerTask('e', ['casperjs:e2e']);
    grunt.registerTask('eNoLogout', ['casperjs:skipLogout']);
    grunt.registerTask('eLogout', ['casperjs:logoutOnly']);
    grunt.registerTask('eNoAuth', ['casperjs:skipAuth']);
};
