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

goldstone.colorPalette.colorSets.distinct[3] (Range of 3 distinct colors)
goldstone.colorPalette.colorSets.distinct[5] (Range of 5 distinct colors)
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

    // legacy chart color palette
    var blue1 = '#1560B7';
    var lightBlue = '#88CCEE';
    var turquoise = '#5AC6DA';
    var orange1 = '#EB6F26';
    var green1 = '#6BA757';
    var green2 = '#117733';
    var yellow1 = '#DDCC77';
    var ochre = '#E5AD1E';
    var purple1 = '#5C4591';
    var purpleDark = '#332288';
    var redPurple = '#AA4499';
    var salmon = '#CC6677';
    var salmonDark = '#AA4466';
    var splitPea = '#999933';
    var maroon = '#882255';
    var brown = '#661100';

    // updated color palette
    var dark_grey = '#3C3C3C';
    var solinea_grey = '#666666';
    var medium_grey = '#999999';
    var light_grey = '#CCCCCC';
    var extra_light_grey = '#f2f2f2';
    var hover_blue = '#0095D3';
    var solinea_blue = '#23ADE1';
    var highlight_blue = '#E2F7FF';
    var solinea_green = '#57BE1B';
    var solinea_red = '#FF0000';
    var solinea_teal = '#0095D3';
    var solinea_orange = '#23ADE1';
    var solinea_purple = '#B55AFF';

    return {
        distinct: {
            1: [blue1],
            2: [orange1, blue1],
            '2R': [blue1, orange1],
            3: [green1, blue1, orange1],
            '3R': [orange1, blue1, green1],
            4: [blue1, green2, yellow1, ochre],
            5: [green1, orange1, blue1, ochre, purple1],
            6: [purple1, turquoise, green2, yellow1, salmon, redPurple],
            7: [purple1, turquoise, green1, green2, yellow1, salmon, redPurple],
            8: [purple1, turquoise, green1, green2, splitPea, yellow1, salmon, redPurple],
            9: [purple1, turquoise, green1, green2, splitPea, yellow1, salmon, maroon, redPurple],
            10: [purple1, turquoise, green1, green2, splitPea, yellow1, brown, salmon, maroon, redPurple],
            11: [purple1, blue1, turquoise, green1, green2, splitPea, yellow1, brown, salmon, maroon, redPurple],
            12: [purple1, blue1, turquoise, green1, green2, splitPea, yellow1, brown, salmon, salmonDark, maroon, redPurple],
            0: [purple1, green1, turquoise, yellow1, salmonDark, green2, blue1, brown, splitPea, salmon, maroon, redPurple],
            openStackSeverity8: [redPurple, purpleDark, splitPea, salmon, yellow1, lightBlue, green1, green2]
        },
        grey: {
            0: ['#bdbdbd']
        },
        individual: {
            blue1: blue1,
            lightBlue: lightBlue,
            turquoise: turquoise,
            orange1: orange1,
            green1: green1,
            green2: green2,
            yellow1: yellow1,
            ochre: ochre,
            purple1: purple1,
            purpleDark: purpleDark,
            redPurple: redPurple,
            salmon: salmon,
            salmonDark: salmonDark,
            splitPea: splitPea,
            maroon: maroon,
            brown: brown,
            // new
            dark_grey: dark_grey,
            solinea_grey: solinea_grey,
            medium_grey: medium_grey,
            light_grey: light_grey,
            extra_light_grey: extra_light_grey,
            hover_blue: hover_blue,
            solinea_blue: solinea_blue,
            highlight_blue: highlight_blue,
            solinea_green: solinea_green,
            solinea_red: solinea_red,
            solinea_teal: solinea_teal,
            solinea_orange: solinea_orange,
            solinea_purple: solinea_purple,
        }
    };
})();
