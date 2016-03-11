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

// define collection and link to model

var ServiceStatusCollection = GoldstoneBaseCollection.extend({
    // Overwriting. Additinal pages not needed.
    checkForAdditionalPages: function(data) {
        return true;
    },

    // order results by up/down, then service name, then host
    addCustom: function() {
        return '?ordering=state,name,host';
    }
});
