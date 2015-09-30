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

/*
This config file defines list of files, and file-matching patterns that will
be applied during various Grunt.js tasks.
*/

// when adding or removing a client lib file, add it to this list:
var siteLibLoadOrder = require('./js/site-lib/siteLibLoadOrder.js');

module.exports = {

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

    // discrete order of 3rd party lib files to be concatenated into
    // goldstone/static/bundle/libs.js .
    // see siteLibLoadOrder require statement at top of file
    lib: siteLibLoadOrder,

    // location of test files for grunt watch tasks
    testMocks: ['test/mocks/test_mocks.js'],
    test: [
        'test/unit/*.js',
        'test/integration/*.js'
    ],
    testUnit: 'test/unit/*.js',
    testIntegration: 'test/integration/*.js',
    testAddons: 'goldstone/static/addons/**/client-test/*.js',
    /*  testAddonsJavaScript only works
        if addons have js contained in main.js */
    testAddonsJavaScript: 'goldstone/static/addons/**/main.js',
    e2e: ['test/e2e/*.js'],

    // output locations of concatenated files
    clientBundle: 'goldstone/static/bundle/bundle.js',
    libBundle: 'goldstone/static/bundle/libs.js',

    // location of source and destination of opentrail files
    opentrailWildcards: [
        'client/js/addons/opentrail/head/header.js',
        'client/js/addons/opentrail/*.js',
        'client/js/addons/opentrail/tail/routes.js',
    ],
    otBundle: '../django-opentrail/opentrail/static/client-js/main.js',
    otBundleGoldstone: 'goldstone/static/addons/opentrail/client-js/main.js',
    otTest: 'test/addons/openTrail/*.js',
    otCopy: '../django-opentrail/client-dev/',
    otTestCopy: '../django-opentrail/opentrail/static/client-test/',
    otCssCopyGit: '../django-opentrail/client-css/',
    otCssCopyGoldstone: 'goldstone/static/addons/opentrail/client-css/',
    otCssCopy: '../django-opentrail/opentrail/static/client-css/',
    opentrailCss: 'client/js/addons/opentrail/*.css',

    // istanbul coversage report file settings
    coverageReportTargets: {
        'client/js/preload/*.js': ['coverage'],
        'client/js/models/*.js': ['coverage'],
        'client/js/collections/*.js': ['coverage'],
        'client/js/views/*.js': ['coverage'],
        'goldstone/static/addons/**/client-js/*.js': ['coverage']
    },
    coverageReportOutput: 'test/results/coverage',

    // sass scss > css target/dest locations
    scssWatch: 'client/scss/*.scss',
    scssDark: 'client/scss/styleDark.scss',
    cssDark: 'goldstone/static/css',
    scssLight: 'client/scss/styleLight.scss',
    cssLight: 'goldstone/static/css',

    // location of .po files and resulting json blobs
    poSourceFiles: 'goldstone/static/i18n/po_files/*.po',
    poJsonDest: 'goldstone/static/i18n/po_json/i18n_combined.json'
};
