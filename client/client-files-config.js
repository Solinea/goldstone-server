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
        'client/js/preload/goldstoneBasePageView.js',
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
    // edit order at: /client/js/site-lib/siteLibLoadOrder.js
    lib: siteLibLoadOrder,

    // location of test files for grunt watch tasks
    testMocks: ['test/mocks/test_mocks.js'],
    test: [
        'test/unit/*.js',
        'test/integration/*.js'
    ],
    testUnit: 'test/unit/*.js',
    testIntegration: 'test/integration/*.js',
    jshintAddons: 'goldstone/**/*.js',
    testAddons: 'goldstone/**/client-test/*.js',
    testAddonsJavaScript: 'goldstone/compliance/static/client-js/compliance.js',
    e2e: ['test/e2e/*.js'],

    // output locations of concatenated files
    clientBundle: 'goldstone/static/bundle/bundle.js',
    libBundle: 'goldstone/static/bundle/libs.js',

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
    scssWatch: 'client/scss/**/*.scss',
    scssDark: 'client/scss/styleDark.scss',
    cssDark: 'goldstone/static/css',
    scssLight: 'client/scss/styleLight.scss',
    cssLight: 'goldstone/static/css',

    // location of .po files and resulting json blobs
    poSourceFiles: 'goldstone/static/i18n/po_files/*.po',
    poJsonDest: 'goldstone/static/i18n/po_json/i18n_combined.json',

    // location of source and destination of compliance files
    // files in `/head/` will come first, `/middle/` next, and `/tail/` last
    complianceConcatWildcards: [
        'goldstone/compliance/static/client-dev/head/*.js',
        'goldstone/compliance/static/client-dev/middle/*.js',
        'goldstone/compliance/static/client-dev/tail/*.js',
    ],
    complianceConcatBundle: 'goldstone/compliance/static/client-js/compliance.js',
    complianceCopyFolder: 'goldstone/compliance/static/',
    complianceWatch: 'goldstone/compliance/static/client-dev/**/*'
};
