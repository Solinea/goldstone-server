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
        'client/js/opentrail/*.js',
        'client/js/views/*.js'
    ],
    lib: ['client/js/lib/jquery.js', 'client/js/lib/bootstrap.js', 'client/js/lib/jquery.dataTables.js', 'client/js/lib/dataTables.bootstrap.js', 'client/js/lib/colorbrewer.js', 'client/js/lib/d3.js', 'client/js/lib/d3-tip.js', 'client/js/lib/d3-legend.js', 'client/js/lib/underscore.js', 'client/js/lib/backbone.js', 'client/js/lib/moment-with-locales.js', 'client/js/lib/moment-timezone-with-data-2010-2020.js'],
    test: [
        'test/unit/*.js',
        'test/integration/*.js'
    ],
    testUnit: 'test/unit/*.js',
    testIntegration: 'test/integration/*.js',
    e2e: ['test/e2e/*.js'],
    clientBundle: 'goldstone/static/bundle/bundle.js',
    libBundle: 'goldstone/static/bundle/libs.js',
    coverageReportTargets: {
        'client/js/preload/*.js': ['coverage'],
        'client/js/models/*.js': ['coverage'],
        'client/js/collections/*.js': ['coverage'],
        'client/js/views/*.js': ['coverage']
    },
    coverageReportOutput: 'test/results/coverage',
    scssWatch: 'client/scss/*.scss',
    scss: 'client/scss/style.scss',
    css: 'goldstone/static/css/base.css'
};
