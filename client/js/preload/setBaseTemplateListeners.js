/**
 * Copyright 2016 Solinea, Inc.
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
jQuery listeners to be instantiated after base.html template load.
Registering clicks on the menus and handling css changes that
govern the expanding menu actions.
*/

goldstone.setBaseTemplateListeners = function() {

    // set dashboard status initially to green
    $('.d-a-s-h-b-o-a-r-d').addClass('status-green');

    // function to remove existing menu tab highlighting
    // and highlight tab matching selector, if any
    var addMenuIconHighlighting = function(selector) {
        $('.top-bar.navbar div').removeClass('active');
        $(selector).addClass('active');
    };

    var routeNameToIconClassHash = {
        discover: '.d-a-s-h-b-o-a-r-d',
        apiPerfReport: '.m-e-t-r-i-c-s',
        topology: '.t-o-p-o-l-o-g-y',
        "logSearch": '.m-e-t-r-i-c-s',
        "savedSearchLog": '.m-e-t-r-i-c-s',
        "eventsBrowser": '.m-e-t-r-i-c-s',
        "savedSearchEvent": '.m-e-t-r-i-c-s',
        "apiBrowser": '.m-e-t-r-i-c-s',
        "savedSearchApi": '.m-e-t-r-i-c-s',
        "settings": '',
        "tenant": '',
        compliance: '.a-u-d-i-t'
    };

    var updateLicenseLink = function(name) {

        // if navigating to compliance, update license
        // link to proprietary software link
        if (name === 'compliance' || name === 'topology') {
            $('.dynamic-license').attr("href", "http://solinea.com/wp-content/uploads/2016/03/Solinea-Goldstone-Software-License-v1.0.pdf");
        } else {
            $('.dynamic-license').attr("href", "https://www.apache.org/licenses/LICENSE-2.0");
        }
    };

    // backbone router emits 'route' event on route change
    // and first argument is route name. Match to hash
    // to highlight the appropriate side menu nav icon
    goldstone.gsRouter.on('route', function(name) {
        updateLicenseLink(name);
    });
};
