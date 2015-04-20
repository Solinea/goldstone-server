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
        'goldstone/client/js/base.js',
        'goldstone/client/js/goldstoneBaseModel.js',
        'goldstone/client/js/goldstoneBaseView.js',
        'goldstone/client/js/goldstoneBasePageView.js',
        'goldstone/client/js/goldstoneRouter.js',
        'goldstone/client/js/utilizationCpuView.js',
        'goldstone/client/js/models/*.js',
        'goldstone/client/js/collections/*.js',
        'goldstone/client/js/views/*.js'
    ],
    lib: ['goldstone/client/js/lib/jquery.js', 'goldstone/client/js/lib/bootstrap.js', 'goldstone/client/js/lib/jquery.dataTables.js', 'goldstone/client/js/lib/dataTables.bootstrap.js', 'goldstone/client/js/lib/jquery.datetimepicker.js', 'goldstone/client/js/lib/colorbrewer.js', 'goldstone/client/js/lib/d3.js', 'goldstone/client/js/lib/d3-tip.js', 'goldstone/client/js/lib/d3-legend.js', 'goldstone/client/js/lib/underscore.js', 'goldstone/client/js/lib/backbone.js', 'goldstone/client/js/lib/moment-with-locales.js', 'goldstone/client/js/lib/moment-timezone-with-data-2010-2020.js', 'goldstone/client/js/lib/jquery.sidr.min.js']
};
