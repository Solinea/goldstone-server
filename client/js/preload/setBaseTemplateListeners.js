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
This module handles:
* the updating of the secondary menu breadcrumb
* the updating of the license link href.
* initially setting the dashboard status to green
*/

goldstone.setBaseTemplateListeners = function() {

    // backbone router emits 'route' event on route change
    // and first argument is route name. Match to hash
    // to highlight the appropriate side menu nav icon
    goldstone.gsRouter.on('route', function(name) {
        addBreadcrumb(name);
        updateLicenseLink(name);
    });

    // set dashboard status initially to green
    goldstone.breadcrumbManager.trigger('updateDashboardStatus', 'green');

    // function to remove existing menu tab highlighting
    // and highlight tab matching selector, if any
    var addBreadcrumb = function(location) {
        goldstone.breadcrumbManager.trigger('updateBreadcrumb', routeNameBreadcrumbHash(location));
    };

    var routeNameBreadcrumbHash = function(location) {
        var breadcrumbCombo = breadcrumbComboHash[location] || breadcrumbComboHash.missingComboHash;
        // console.clear();
        console.log(location);
        console.log(breadcrumbCombo);

        var result = _.map(breadcrumbCombo, function(route) {
            return routeNameDetails[route] || routeNameDetails.missing;
        });
        console.log(result);
        return result;
    };

    var breadcrumbComboHash = {
        apiBrowser: ['discover', 'apiBrowser'],
        discover: ['discover'],
        eventsBrowser: ['discover', 'eventsBrowser'],
        logSearch: ['discover', 'logSearch'],
        savedSearchLog: ['discover', 'logSearch', 'savedSearchLog'],
        savedSearchEvent: ['discover', 'eventsBrowser', 'savedSearchEvent'],
        savedSearchApi: ['discover', 'apiBrowser', 'savedSearchApi'],
        settings: ['discover', 'settings'],
        tenant: ['discover', 'settings', 'tenant'],
        missingComboHash: ['missingComboHash'],

        // add-on modules
        Topology: ['discover', 'topology'],
        "OpenTrail Manager": ['discover', 'openTrail'],
        "OpenTrail Log List": ['discover', 'openTrail', 'OpenTrailLogList'],
        "Leases Manager": ['discover', 'leasesManager'],
        "Vulnerability Advisor": ['discover', 'vulnerabilityAdvisor'],
    };

    var routeNameDetails = {
        missing: {
            title: 'Missing Breadcrumb Name Details',
            location: '#discover'
        },
        missingComboHash: {
            title: 'Missing Breadcrumb Combo Hash',
            location: '#discover'
        },
        discover: {
            title: 'Dashboard',
            location: '#discover'
        },
        apiBrowser: {
            title: 'Api Viewer',
            location: '#reports/apibrowser'
        },
        savedSearchApi: {
            title: 'Saved Searches: Api',
            location: '#reports/apibrowser/search'
        },
        eventsBrowser: {
            title: 'Event Viewer',
            location: '#reports/eventbrowser'
        },
        savedSearchEvent: {
            title: 'Saved Searches: Events',
            location: '#reports/eventbrowser/search'
        },
        logSearch: {
            title: 'Log Viewer',
            location: '#reports/logbrowser'
        },
        savedSearchLog: {
            title: 'Saved Searches: Logs',
            location: '#reports/logbrowser/search'
        },
        settings: {
            title: 'Settings',
            location: '#settings'
        },
        tenant: {
            title: 'Tenant Settings',
            location: '#settings/tenants'
        },

        // add-on modules
        topology: {
            title: 'Topology',
            location: '#topology'
        },
        "openTrail": {
            title: 'OpenTrail Manager',
            location: '#compliance/opentrail/manager'
        },
        "OpenTrailLogList": {
            title: 'OpenTrail Log History',

            // dynamic
            location: function() {
                return window.location.hash;
            }()
        },
        "leasesManager": {
            title: 'Leases Manager',
            location: '#compliance/leases/manager'
        },
        "vulnerabilityAdvisor": {
            title: 'Vulnerability Advisor',
            location: '#compliance/vulnerability/advisor'
        }
    };


    // to be used if menu highlighting is required
    // based on currently selected route
    var routeNameToIconClassHash = {
        discover: '.d-a-s-h-b-o-a-r-d',
        apiPerfReport: '.m-e-t-r-i-c-s',
        "logSearch": '.m-e-t-r-i-c-s',
        "savedSearchLog": '.m-e-t-r-i-c-s',
        "eventsBrowser": '.m-e-t-r-i-c-s',
        "savedSearchEvent": '.m-e-t-r-i-c-s',
        "apiBrowser": '.m-e-t-r-i-c-s',
        "savedSearchApi": '.m-e-t-r-i-c-s',
        "settings": '',
        "tenant": '',

        // add-on modules
        Topology: '.t-o-p-o-l-o-g-y',
        "OpenTrail Manager": '.a-u-d-i-t',
        "OpenTrail Log List": '.a-u-d-i-t',
        "Leases Manager": '.a-u-d-i-t',
        "Vulnerability Advisor": '.a-u-d-i-t'
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
};
