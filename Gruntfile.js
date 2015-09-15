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
    grunt.loadNpmTasks('grunt-po2json');

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // list of files for concatenation order / watching / linting, etc
    var clientIncludeOrder = require('./client/client-files-config.js');

    // grunt setup
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // messages to display as OS X notifications
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
            },
            concat_message_openTrail: {
                options: {
                    message: "OpenTrail concat is finished"
                }
            },
            copy_message_openTrail: {
                options: {
                    message: "OpenTrail files copied to external repo"
                }
            },
            copy_message_openTrailTest: {
                options: {
                    message: "OpenTrail tests copied to external repo"
                }
            },
            copy_message_openTrailCss: {
                options: {
                    message: "OpenTrail css copied to external repo"
                }
            },
            pojson: {
                options: {
                    message: ".po > json conversion complete"
                }
            }
        },

        // linting
        jshint: {
            gruntfile: 'Gruntfile.js',
            karmaConfig: 'karma.conf.js',
            client: clientIncludeOrder.clientWildcards,
            test: [clientIncludeOrder.test, clientIncludeOrder.e2e],
            openTrail: clientIncludeOrder.opentrailWildcards,
            options: {
                globals: {
                    eqeqeq: true
                }
            }
        },

        // karma headless browser unit/integration test runner
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

        // casperjs headless browser e2e test runner
        casperjs: {
            options: {},
            e2e: {
                files: {
                    'results/casper': clientIncludeOrder.e2e
                }
            }
        },

        // transpile sass > css
        sass: {
            dev: {
                options: {
                    compass: false,
                    lineNumbers: false,
                    style: 'compact',
                    noCache: true
                },
                files: [{
                    expand: true,
                    src: clientIncludeOrder.scssDark,
                    dest: clientIncludeOrder.cssDark,
                    ext: '.css'
                }, {
                    expand: true,
                    src: clientIncludeOrder.scssLight,
                    dest: clientIncludeOrder.cssLight,
                    ext: '.css'
                }]
            }
        },

        // changes to the designated files kick off tasks as a result
        watch: {
            client: {
                files: clientIncludeOrder.clientWildcards,
                tasks: ['c', 'lint']
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
                files: clientIncludeOrder.scssWatch,
                tasks: ['scss']
            },
            opentrail: {
                files: clientIncludeOrder.opentrailWildcards,
                tasks: ['clean:ot', 'concat-ot', 'concat:ot_goldstone', 'lint', 'copy-ot']
            },
            opentrailTest: {
                files: clientIncludeOrder.otTest,
                tasks: ['lint', 'karma', 'clean:otTest', 'copy-otTest']
            },
            opentrailCss: {
                files: clientIncludeOrder.opentrailCss,
                tasks: ['copy-otCss']
            },
            po2json: {
                files: clientIncludeOrder.poSourceFiles,
                tasks: ['pojson']
            }
        },

        // start watch tasks that only observe the specified files
        focus: {
            dev: {
                include: ['unitTests', 'integrationTests', 'client']
            },
            e2e: {
                include: ['e2eTests']
            }
        },

        // configure grunt-concat for JavaScript file combining
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
            },
            ot: {
                nonull: true,
                options: {
                    separator: '\n'
                },
                src: clientIncludeOrder.opentrailWildcards,
                dest: clientIncludeOrder.otBundle
            },
            ot_goldstone: {
                nonull: true,
                options: {
                    separator: '\n'
                },
                src: clientIncludeOrder.opentrailWildcards,
                dest: clientIncludeOrder.otBundleGoldstone
            }
        },

        // copy files between folders and/or repos
        copy: {
            ot: {
                files: [{
                    src: [clientIncludeOrder.opentrailWildcards],
                    dest: clientIncludeOrder.otCopy,
                    flatten: true,
                    expand: true,
                    nonull: true
                }]
            },
            otTest: {
                files: [{
                    src: [clientIncludeOrder.otTest],
                    dest: clientIncludeOrder.otTestCopy,
                    flatten: true,
                    expand: true,
                    nonull: true
                }]
            },
            otCss: {
                files: [{
                    src: [clientIncludeOrder.opentrailCss],
                    dest: clientIncludeOrder.otCssCopy,
                    flatten: true,
                    expand: true,
                    nonull: true
                }]
            },
            otCssGoldstone: {
                files: [{
                    src: [clientIncludeOrder.opentrailCss],
                    dest: clientIncludeOrder.otCssCopyGoldstone,
                    flatten: true,
                    expand: true,
                    nonull: true
                }]
            },
            otCssGit: {
                files: [{
                    src: [clientIncludeOrder.opentrailCss],
                    dest: clientIncludeOrder.otCssCopyGit,
                    flatten: true,
                    expand: true,
                    nonull: true
                }]
            }
        },

        // clean out directories, usually used prior to a 'copy' task
        clean: {
            ot: {
                src: [clientIncludeOrder.otCopy.concat('/*.js')],
                options: {
                    force: true
                }
            },
            otTest: {
                src: [clientIncludeOrder.otTestCopy.concat('/*.js')],
                options: {
                    force: true
                }
            }
        },

        // translate files from .po format to a Jed.js compatible json file
        po2json: {
            options: {
                format: 'jed1.x',
            },
            all: {
                src: [clientIncludeOrder.poSourceFiles],
                dest: clientIncludeOrder.poJsonDest
            }
        },

    });

    // Start watching and run tests when files change
    grunt.registerTask('default', ['lint', 'karma', 'watch']);
    grunt.registerTask('c', ['concat:clientjs', 'notify:concat_message']);
    grunt.registerTask('casper', ['casperjs:e2e']);
    grunt.registerTask('clib', ['concat:lib', 'notify:concat_message_lib']);
    grunt.registerTask('concat-ot', ['concat:ot', 'notify:concat_message_openTrail']);
    grunt.registerTask('copy-ot', ['copy:ot', 'notify:copy_message_openTrail']);
    grunt.registerTask('copy-otTest', ['copy:otTest', 'notify:copy_message_openTrailTest']);
    grunt.registerTask('copy-otCss', ['copy:otCssGoldstone', 'copy:otCssGit', 'copy:otCss', 'notify:copy_message_openTrailCss']);
    grunt.registerTask('e', ['casperjs:e2e']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('lintAndTest', ['lint', 'test']);
    grunt.registerTask('scss', ['sass:dev', 'notify:scss']);
    grunt.registerTask('test', ['karma', 'casperjs:e2e']);
    grunt.registerTask('testDev', ['lint', 'karma', 'focus:dev']);
    grunt.registerTask('testDevE', ['lint', 'focus:e2e']);
    grunt.registerTask('pojson', ['po2json', 'notify:pojson']);
};
