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
nb: GREY, not GRAY

goldstone.colorPalette.distinct[3] (Range of 3 distinct colors)
goldstone.colorPalette.distinct[5] (Range of 5 distinct colors)
goldstone.colorPalette.single.redPurple // => '#AA4499'
etc...

OPENSTACK SEVERITY LEVELS
=========================
EMERGENCY: system is unusable
ALERT: action must be taken immediately
CRITICAL: critical conditions
ERROR: error conditions
WARNING: warning conditions
NOTICE: normal but significant condition
INFO: informational messages
DEBUG: debug-level messages
*/

var goldstone = goldstone || {};

goldstone.colorPalette = (function() {

    var c = {};

    // legacy chart color palette
    c.blue1 = '#1560B7';
    c.lightBlue = '#88CCEE';
    c.turquoise = '#5AC6DA';
    c.orange1 = '#EB6F26';
    c.green1 = '#6BA757';
    c.green2 = '#117733';
    c.yellow1 = '#DDCC77';
    c.ochre = '#E5AD1E';
    c.purple1 = '#5C4591';
    c.purpleDark = '#332288';
    c.redPurple = '#AA4499';
    c.salmon = '#CC6677';
    c.salmonDark = '#AA4466';
    c.splitPea = '#999933';
    c.maroon = '#882255';
    c.brown = '#661100';

    // updated color palette
    c.dark_grey = '#3C3C3C';
    c.solinea_grey = '#666666';
    c.medium_grey = '#999999';
    c.light_grey = '#CCCCCC';
    c.extra_light_grey = '#f2f2f2';
    c.hover_blue = '#0095D3';
    c.solinea_blue = '#23ADE1';
    c.highlight_blue = '#E2F7FF';
    c.solinea_green = '#57BE1B';
    c.solinea_red = '#FF0000';
    c.solinea_teal = '#0095D3';
    c.solinea_orange = '#23ADE1';
    c.solinea_purple = '#B55AFF';

    return {
        distinct: {
            1: [c.blue1],
            2: [c.orange1, c.blue1],
            '2R': [c.blue1, c.orange1],
            3: [c.green1, c.blue1, c.orange1],
            '3R': [c.orange1, c.blue1, c.green1],
            4: [c.blue1, c.green2, c.yellow1, c.ochre],
            5: [c.green1, c.orange1, c.blue1, c.ochre, c.purple1],
            6: [c.purple1, c.turquoise, c.green2, c.yellow1, c.salmon, c.redPurple],
            7: [c.purple1, c.turquoise, c.green1, c.green2, c.yellow1, c.salmon, c.redPurple],
            8: [c.purple1, c.turquoise, c.green1, c.green2, c.splitPea, c.yellow1, c.salmon, c.redPurple],
            9: [c.purple1, c.turquoise, c.green1, c.green2, c.splitPea, c.yellow1, c.salmon, c.maroon, c.redPurple],
            10: [c.purple1, c.turquoise, c.green1, c.green2, c.splitPea, c.yellow1, c.brown, c.salmon, c.maroon, c.redPurple],
            11: [c.purple1, c.blue1, c.turquoise, c.green1, c.green2, c.splitPea, c.yellow1, c.brown, c.salmon, c.maroon, c.redPurple],
            12: [c.purple1, c.blue1, c.turquoise, c.green1, c.green2, c.splitPea, c.yellow1, c.brown, c.salmon, c.salmonDark, c.maroon, c.redPurple],
            0: [c.purple1, c.green1, c.turquoise, c.yellow1, c.salmonDark, c.green2, c.blue1, c.brown, c.splitPea, c.salmon, c.maroon, c.redPurple],
            openStackSeverity8: [c.redPurple, c.purpleDark, c.splitPea, c.salmon, c.yellow1, c.lightBlue, c.green1, c.green2]
        },
        grey: {
            0: ['#bdbdbd']
        },
        single: c
    };
})();
