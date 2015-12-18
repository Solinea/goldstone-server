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
            pojson: {
                options: {
                    message: ".po > json conversion complete"
                }
            },
            compliance: {
                options: {
                    message: "Compliance tasks complete"
                }
            }
        },

        // linting
        jshint: {
            gruntfile: 'Gruntfile.js',
            karmaConfig: 'karma.conf.js',
            client: clientIncludeOrder.clientWildcards,
            test: [clientIncludeOrder.test, clientIncludeOrder.e2e],
            addons: clientIncludeOrder.jshintAddons,
            options: {
                globals: {
                    eqeqeq: true
                }
            }
        },

        // karma headless browser unit/integration test runner
        karma: {
            options: {
                configFile: 'karma.conf.js'
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
            po2json: {
                files: clientIncludeOrder.poSourceFiles,
                tasks: ['pojson']
            },
            compliance: {
                files: clientIncludeOrder.complianceWatch,
                tasks: ['concat:compliance', 'clean:compliance', 'copy:compliance', 'lint', 'notify:compliance']
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
                src: clientIncludeOrder.opentrailConcatWildcards,
                dest: clientIncludeOrder.otConcatBundle
            },
            leases: {
                nonull: true,
                options: {
                    separator: '\n'
                },
                src: clientIncludeOrder.leasesConcatWildcards,
                dest: clientIncludeOrder.leasesConcatBundle
            },
            compliance: {
                nonull: true,
                options: {
                    separator: '\n'
                },
                src: clientIncludeOrder.complianceConcatWildcards,
                dest: clientIncludeOrder.complianceConcatBundle
            }
        },

        // copy files between folders and/or repos
        copy: {
            compliance: {
                files: [{
                    cwd: clientIncludeOrder.complianceCopyFolder,
                    src: ['**'],
                    dest: clientIncludeOrder.complianceRepoCopy,
                    flatten: false,
                    expand: true,
                    nonull: true
                }]
            }
        },

        // clean out directories, usually used prior to a 'copy' task
        clean: {
            compliance: {
                src: [clientIncludeOrder.complianceRepoCopy],
                options: {
                    force: true
                }
            }
        },

        // translate files from .po format to a Jed.js compatible json file
        po2json: {
            options: {
                format: 'jed1.x',
                singleFile: true,
                pretty: true
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
    grunt.registerTask('e', ['casperjs:e2e']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('lintAndTest', ['lint', 'test']);
    grunt.registerTask('scss', ['sass:dev', 'notify:scss']);
    grunt.registerTask('test', ['karma']);
    grunt.registerTask('pojson', ['po2json', 'notify:pojson']);
};
