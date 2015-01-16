/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: John Stanford
 */

// create a project namespace and utility for creating descendants
var goldstone = goldstone || {};
goldstone.namespace = function(name) {
    "use strict";
    var parts = name.split('.');
    var current = goldstone;
    for (var i = 0; i < parts.length; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
};

goldstone.namespace('settings');
goldstone.namespace('time');
goldstone.namespace('charts');
goldstone.namespace('settings.charts');

goldstone.settings.charts.maxChartPoints = 100;
goldstone.settings.charts.ordinalColors = ["#6a51a3", "#2171b5", "#238b45", "#d94801", "#cb181d"];
goldstone.settings.charts.margins = {
    top: 30,
    bottom: 60,
    right: 30,
    left: 50
};

// set up the alert elements in the base template
$(document).ready(function() {
    "use strict";
    $(".alert-danger > a").click(function() {
        $(".alert-danger").alert();
    });
    $(".alert-warning > a").click(function() {
        $(".alert-warning").alert();
    });
    $(".alert-info > a").click(function() {
        $(".alert-info").alert();
    });
    $(".alert-success > a").click(function() {
        $(".alert-success").alert();
    });

    $("#endTimeNow").click(function() {
        // "use strict";
        $("#autoRefresh").prop("disabled", false);
        $("#autoRefresh").prop("checked", true);
        $("#autoRefreshInterval").prop("disabled", false);
        $("#settingsEndTime").prop("disabled", true);
    });

    $("#endTimeSelected").click(function() {
        // "use strict";
        $("#autoRefresh").prop("checked", false);
        $("#autoRefresh").prop("disabled", true);
        $("#autoRefreshInterval").prop("disabled", true);
        $("#settingsEndTime").prop("disabled", false);
    });

    $("#settingsEndTime").click(function() {
        // "use strict";
        $("#endTimeSelected").prop("checked", true);
        $("#autoRefresh").prop("checked", false);
        $("#autoRefresh").prop("disabled", true);
        $("#autoRefreshInterval").prop("disabled", true);
    });

    $('#settingsStartTime').datetimepicker({
        format: 'M d Y H:i:s',
        lang: 'en'
    });

    $('#settingsEndTime').datetimepicker({
        format: 'M d Y H:i:s',
        lang: 'en'
    });
});

// tools for raising alerts
goldstone.raiseError = function(message) {
    "use strict";
    goldstone.raiseDanger(message);
};

goldstone.raiseDanger = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-danger", message);
};

goldstone.raiseWarning = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-warning", message);
};

goldstone.raiseSuccess = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-success", message);
};

goldstone.raiseInfo = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-info", message);
};

goldstone.raiseAlert = function(selector, message, persist) {
    "use strict";

    if (message && message.length > 200) {
        message = message.slice(0, 200) + '...';
    }

    if (persist) {
        $(selector).html(message);
    } else {
        $(selector).html(message + '<a href="#" class="close" data-dismiss="alert">&times;</a>');
    }

    $(selector).fadeIn("slow");

    if (!persist) {
        window.setTimeout(function() {
            $(selector).fadeOut("slow");
        }, 4000);
    }

};

goldstone.uuid = function() {
    "use strict";

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
};

goldstone.populateSettingsFields = function(start, end) {
    "use strict";
    var s = new Date(start).toString();
    var e = new Date(end).toString();
    var sStr = s.substr(s.indexOf(" ") + 1);
    var eStr = e.substr(e.indexOf(" ") + 1);

    $('#settingsStartTime').val(sStr);
    $('#settingsEndTime').val(eStr);
};

goldstone.isRefreshing = function() {
    "use strict";
    return $("#autoRefresh").prop("checked");
};

goldstone.getRefreshInterval = function() {
    "use strict";
    return $("select#autoRefreshInterval").val();
};


goldstone.time.fromPyTs = function(t) {
    "use strict";

    if (typeof t === 'number') {
        return new Date(Math.round(t) * 1000);
    } else {
        return new Date(Math.round(Number(t) * 1000));
    }
};

goldstone.time.toPyTs = function(t) {
    "use strict";

    // TODO decide whether toPyTs should only handle date objects.  Handling numbers may cause unexpected results.
    if (typeof t === 'number') {
        return String(Math.round(t / 1000));
    } else if (Object.prototype.toString.call(t) === '[object Date]') {
        return String(Math.round(t.getTime() / 1000));
    }
};

/**
 * Returns a Date object if given a Date or a numeric string
 * @param {[Date, String]} the date representation
 * @return {Date} the date representation of the string
 */
goldstone.time.paramToDate = function(param) {
    "use strict";
    if (param instanceof Date) {
        return param;
    } else {
        // TODO should validate the string and handle appropriately
        return new Date(Number(param));
    }
};

goldstone.time.getDateRange = function() {
    "use strict";
    //grab the values from the standard time settings modal/window
    var end;
    var start;
    var temp;
    var d;

    if ($("#endTimeNow").prop("checked") === false) {
        var e = $("input#settingsEndTime").val();
        if (e === '') {
            end = new Date();
        } else {
            if (e.toString() === 'Invalid Date') {
                alert("End date must be valid. Using now.");
                end = new Date();
            } else {
                end = new Date(e);
            }
        }
    } else {
        end = new Date();
    }

    var s = $("input#settingsStartTime").val();
    if (s === '') {
        temp = Date.parse(end);
        temp = new Date(temp);
        start = temp.addWeeks(-1);
    } else {
        if (s.toString() === 'Invalid Date') {
            alert('Start date must be valid. Using 1 week ' +
                'prior to end date.');
            temp = Date.parse(end);
            temp = new Date(temp);
            start = temp.addWeeks(-1);
        } else {
            start = new Date(s);
        }
    }
    return [start, end];
};

/**
 * Returns an appropriately sized interval to retrieve a max number
 * of points/bars on the chart
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 * @param {Number} maxBuckets maximum number of buckets for the time range
 * @return {Number} An integer representation of the number of seconds of
 * an optimal interval
 */
goldstone.time.autoSizeInterval = function(start, end, maxPoints) {
    "use strict";
    var s = goldstone.settings.charts;
    maxPoints = typeof maxPoints !== 'undefined' ? maxPoints : s.maxChartPoints;
    var diffSeconds = (end.getTime() - start.getTime()) / 1000;
    var interval = diffSeconds / maxPoints;
    return String(interval).concat("s");
};


/**
 * Returns appropriately formatted start, end, and interval specifications when
 * provided the parameter strings from the request
 * @param {String} start Instance of String representing start of interval
 * @param {String} end Instance of String representing end of interval
 * @return {Object} An object of {start:Date, end:Date, interval:String}
 */
goldstone.time.processTimeBasedChartParams = function(end, start, maxPoints) {
    "use strict";

    var endDate;
    var startDate;

    if (end !== undefined) {
        endDate = goldstone.time.paramToDate(end);
    } else {
        endDate = new Date();
    }

    if (start !== undefined) {
        startDate = goldstone.time.paramToDate(start);
    } else {

        var weekSubtractor = function(date) {
            var origTime = +new Date(date);
            return new Date(origTime - 604800000);
        };

        startDate = weekSubtractor(endDate);
    }

    var result = {
        'start': startDate,
        'end': endDate
    };

    if (typeof maxPoints !== 'undefined') {
        result.interval = (goldstone.time.autoSizeInterval(startDate, endDate, maxPoints));
    }

    return result;

};

window.onerror = function(message, fileURL, lineNumber) {
    console.log(message + ': ' + fileURL + ': ' + lineNumber);
};

// convenience for date manipulation
Date.prototype.addSeconds = function(m) {
    "use strict";
    this.setTime(this.getTime() + (m * 1000));
    return this;
};

Date.prototype.addMinutes = function(m) {
    "use strict";
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
};

Date.prototype.addHours = function(h) {
    "use strict";
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
};

Date.prototype.addDays = function(d) {
    "use strict";
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
    return this;
};

Date.prototype.addWeeks = function(d) {
    "use strict";
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000));
    return this;
};

// test whether a script is included already
goldstone.jsIncluded = function(src) {
    "use strict";
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].getAttribute('src') === src) {
            return true;
        }
    }
    return false;
};
