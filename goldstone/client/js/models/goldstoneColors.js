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

*/

var GoldstoneColors = GoldstoneBaseModel.extend({
    defaults: {
        colorSets: {
            // distinct = colorBlindFriendly
            distinct: {
                1: ['#4477AA'],
                2: ['#4477AA', '#CC6677'],
                3: ['#4477AA', '#DDCC77', '#CC6677'],
                4: ['#4477AA', '#117733', '#DDCC77', '#CC6677'],
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

                // EMERGENCY: system is unusable
                // ALERT: action must be taken immediately
                // CRITICAL: critical conditions
                // ERROR: error conditions
                // WARNING: warning conditions
                // NOTICE: normal but significant condition
                // INFO: informational messages
                // DEBUG: debug-level messages

            },
            grey: {
                0: ['#bdbdbd']
            }
        }
    }
});
