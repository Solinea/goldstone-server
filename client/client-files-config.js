/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Defines files that will be scanned with jshint is run.
// The order of these files is significant if 'grunt concat' is set up.

module.exports = {

    // all files/folders to watch for triggering client grunt tasks
    clientWildcards: [
        'client/js/preload/base.js',
        'client/js/preload/goldstoneBaseModel.js',
        'client/js/preload/goldstoneBaseView.js',
        'client/js/preload/goldstoneBaseView2.js',
        'client/js/preload/goldstoneBasePageView.js',
        'client/js/preload/goldstoneBasePageView2.js',
        'client/js/preload/goldstoneBaseCollection.js',
        'client/js/preload/dataTableBaseView.js',
        'client/js/preload/goldstoneRouter.js',
        'client/js/preload/chartSet.js',
        'client/js/preload/utilizationCpuView.js',
        'client/js/models/*.js',
        'client/js/collections/*.js',
        'client/js/views/*.js'
    ],

    // all files/folders to watch for triggering opentrail grunt tasks
    opentrailWildcards: [
        'client/js/addons/opentrail/head/header.js',
        'client/js/addons/opentrail/*.js',
        'client/js/addons/opentrail/tail/routes.js',
    ],

    opentrailCss: 'client/js/addons/opentrail/*.css',

    // discrete order of 3rd party lib files to be concatenated into
    // goldstone/static/bundle/libs.js

    lib: ['client/js/lib/jquery.js', 'client/js/lib/bootstrap.js', 'client/js/lib/jquery.dataTables.js', 'client/js/lib/dataTables.bootstrap.js', 'client/js/lib/colorbrewer.js', 'client/js/lib/d3.js', 'client/js/lib/d3-tip.js', 'client/js/lib/d3-legend.js', 'client/js/lib/underscore.js', 'client/js/lib/backbone.js', 'client/js/lib/moment-with-locales.js', 'client/js/lib/moment-timezone-with-data-2010-2020.js', 'client/js/lib/jed.js'],

    // location of test files for grunt watch tasks
    test: [
        'test/unit/*.js',
        'test/integration/*.js'
    ],
    testUnit: 'test/unit/*.js',
    testIntegration: 'test/integration/*.js',
    testOpenTrail: 'test/openTrail/*.js',
    e2e: ['test/e2e/*.js'],

    // output locations of concatenated files
    clientBundle: 'goldstone/static/bundle/bundle.js',
    libBundle: 'goldstone/static/bundle/libs.js',
    otBundle: '../django-opentrail/opentrail/static/main.js',
    otBundleGoldstone: 'goldstone/static/addons/opentrail/main.js',

    // location of source and destination of opentrail files
    otTest: 'test/openTrail/*.js',
    otCopy: '../django-opentrail/client-dev/',
    otTestCopy: '../django-opentrail/client-test/',
    otCssCopyGit: '../django-opentrail/client-css/',
    otCssCopyGoldstone: 'goldstone/static/addons/opentrail/',
    otCssCopy: '../django-opentrail/opentrail/static/',

    // istanbul coversage report file settings
    coverageReportTargets: {
        'client/js/preload/*.js': ['coverage'],
        'client/js/models/*.js': ['coverage'],
        'client/js/collections/*.js': ['coverage'],
        'client/js/views/*.js': ['coverage'],
        'client/js/addons/**/*.js': ['coverage']
    },
    coverageReportOutput: 'test/results/coverage',

    // sass scss > css target/dest locations
    scssWatch: 'client/scss/*.scss',
    scssDark: 'client/scss/styleDark.scss',
    cssDark: 'goldstone/static/css',
    scssLight: 'client/scss/styleLight.scss',
    cssLight: 'goldstone/static/css',

    // location of .po files and resulting json blobs
    poSourceFiles: 'client/po_files/*.po',
    poJsonDest: 'client/po_files/'
};
