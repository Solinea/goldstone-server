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
to invoke:
1. include goldstoneColors.js in the template script tags
2. assign the palatte as a variable: var colorArray = new GoldstoneColors().get('colorSets');
3. invoke via colorArray, a subset, and an index corresponding to the size of the array desired

colorArray.distinct[3] (Range of 3 colorBlindFriendly colors)
colorArray.distinct[5] (Range of 5 colorBlindFriendly colors)
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

var GoldstoneColors = GoldstoneBaseModel.extend({
    defaults: {
        colorSets: {
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
            oldDistinct: {
                // archives original 'color blind' palette
                1: ['#1560B7'],
                2: ['#1560B7', '#CC6677'],
                3: ['#1560B7', '#DDCC77', '#CC6677'],
                4: ['#1560B7', '#117733', '#DDCC77', '#CC6677'],
                5: ['#332288', '#88CCEE', '#117733', '#DDCC77', '#CC6677'],
                6: ['#332288', '#88CCEE', '#117733', '#DDCC77', '#CC6677', '#AA4499'],
                7: ['#332288', '#88CCEE', '#44AA99', '#117733', '#DDCC77', '#CC6677', '#AA4499'],
                8: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#AA4499'],
                9: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499'],
                10: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#661100', '#CC6677', '#882255', '#AA4499'],
                11: ['#332288', '#6699CC', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#661100', '#CC6677', '#882255', '#AA4499'],
                12: ['#332288', '#6699CC', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#661100', '#CC6677', '#AA4466', '#882255', '#AA4499'],
                0: ['#332288', '#44AA99', '#88CCEE', '#DDCC77', '#AA4466', '#117733', '#6699CC', '#661100', '#999933', '#CC6677', '#882255', '#AA4499'],
                openStackSeverity8: ['#AA4499', '#332288', '#999933', '#CC6677', '#DDCC77', '#88CCEE', '#44AA99', '#117733']
            }
        }
    }
});
