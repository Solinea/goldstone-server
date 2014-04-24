/**
 * Copyright 2014 Solinea, Inc.
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
 *
 * Author: John Stanford
 */

var autoRefreshInterval

function updateLogSearch() {
    var dates = _getSearchFormDates(),
        start = dates[0],
        end = dates[1]
    badEventMultiLine('#bad-event-multiline', start, end)
    drawSearchTable('#log-search-table', start, end)
}

function refreshLogSearch() {
    "use strict";
    var dates = _getSearchFormDates(),
        start = new Date(dates[0]),
        end = dates[1],
        refreshInterval = $('#autoRefreshInterval').val()

    start.addSeconds(refreshInterval / 1000)
    populateSettingsFields(start, end)
    updateLogSearch()
}

$("#settingsUpdateButton").click(function () {
    "use strict";
    updateLogSearch()
    if (isRefreshing()) {
        window.clearInterval(autoRefreshInterval)
        startLogSearchRefresh()
    } else {
        if (typeof autoRefreshInterval !== 'undefined') {
            window.clearInterval(autoRefreshInterval)
        }
    }

});

function startLogSearchRefresh() {
    "use strict";
    autoRefreshInterval = window.setInterval(refreshLogSearch, getRefreshInterval())
}
