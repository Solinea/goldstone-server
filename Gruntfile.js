/*
If you are new to grunt, be sure to examine the list of grunt.
registerTasks at the bottom of the page. Once defined, a
registered tasks can be used within other task definitions.

************************************************
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Most of the grunt tasks (watch/concat/test) rely
on an external file that designates the order in
which to load files. That is located in
client/client-files-config.js.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
************************************************


When adding a Backbone View that will be extended into other
views, it must be added to goldstone/client/js/ and explicitly
added to karma.conf.js. If it is added into goldstone/client/js/
views it may not be concatenated in the proper order to be
available for extending. Adding it properly to karma.conf.js is
also required to make sure it is loaded into memory for the
headless browser testing.
*/

module.exports = function(grunt) {
    // load up all of the necessary grunt plugins
    grunt.loadNpmTasks('grunt-casperjs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-focus');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-notify');

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // list of files for concatenation order / watching / linting, etc
    var clientIncludeOrder = require('./client/client-files-config.js');

    // grunt setup
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        notify: {
            concat_message: {
                options: {
                    message: "Client concat is finished"
                }
            },
            concat_message_lib: {
                options: {
                    message: "Lib concat is finished"
                }
            },
            scss: {
                options: {
                    message: "SASS/CSS compile complete"
                }
            }
        },

        // what files should be linted
        jshint: {
            gruntfile: 'Gruntfile.js',
            karmaConfig: 'karma.conf.js',
            client: clientIncludeOrder.clientWildcards,
            test: [clientIncludeOrder.test, clientIncludeOrder.e2e],
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
                    'results/casper': clientIncludeOrder.e2e
                }
            }
        },

        sass: {
            dev: {
                options: {
                    style: 'expanded',
                    compass: false,
                },
                files: [{
                    expand: true,
                    src: clientIncludeOrder.scss,
                    dest: clientIncludeOrder.css,
                    ext: '.css'
                }]
            }
        },

        // create a watch task for tracking
        // any changes to the following files
        watch: {
            client: {
                files: clientIncludeOrder.clientWildcards,
                tasks: ['lint', 'c']
            },
            lib: {
                files: clientIncludeOrder.lib,
                tasks: ['clib']
            },
            gruntfile: {
                files: ['Gruntfile.js', 'karma.conf.js'],
                tasks: ['jshint:gruntfile', 'jshint:karmaConfig', 'lint']
            },
            unitTests: {
                files: clientIncludeOrder.testUnit,
                tasks: ['lint', 'karma']
            },
            integrationTests: {
                files: clientIncludeOrder.testIntegration,
                tasks: ['lint', 'karma']
            },
            e2eTests: {
                files: clientIncludeOrder.e2e,
                tasks: ['e']
            },
            css: {
                files: clientIncludeOrder.scss,
                tasks: ['scss']
            }
        },

        focus: {
            dev: {
                include: ['unitTests', 'integrationTests', 'client']
            },
            e2e: {
                include: ['e2eTests']
            }
        },

        // configure grunt-concat
        concat: {
            options: {
                separator: ';\n',
            },
            lib: {
                nonull: true,
                src: clientIncludeOrder.lib,
                dest: clientIncludeOrder.libBundle,
                stripBanners: true
            },
            clientjs: {
                nonull: true,
                src: clientIncludeOrder.clientWildcards,
                dest: clientIncludeOrder.clientBundle
            }
        },

    });

    // Start watching and run tests when files change
    grunt.registerTask('default', ['lint', 'karma', 'watch']);
    grunt.registerTask('c', ['concat:clientjs', 'notify:concat_message']);
    grunt.registerTask('casper', ['casperjs:e2e']);
    grunt.registerTask('clib', ['concat:lib', 'notify:concat_message_lib']);
    grunt.registerTask('e', ['casperjs:e2e']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('lintAndTest', ['lint', 'test']);
    grunt.registerTask('scss', ['sass:dev', 'notify:scss']);
    grunt.registerTask('test', ['karma', 'casperjs:e2e']);
    grunt.registerTask('testDev', ['lint', 'karma', 'focus:dev']);
    grunt.registerTask('testDevE', ['lint', 'focus:e2e']);
};
