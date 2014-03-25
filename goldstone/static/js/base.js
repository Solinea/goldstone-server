// create a project namespace and utility for creating descendants
var goldstone = goldstone || {}
goldstone.namespace = function (name) {
    "use strict";
    var parts = name.split('.')
    var current = goldstone
    for (var i = 0; i < parts.length; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {}
        }
        current = current[parts[i]]
    }
}

// set up the alert elements in the base template
$(document).ready(function () {
    "use strict";
    $(".alert-danger > a").click(function () {
        $(".alert-danger").alert()
    })
    $(".alert-warning > a").click(function () {
        $(".alert-warning").alert()
    })
    $(".alert-info > a").click(function () {
        $(".alert-info").alert()
    })
    $(".alert-success > a").click(function () {
        $(".alert-success").alert()
    })
})

// tools for raising alerts
goldstone.raiseError = function (message) {
    "use strict";
    goldstone.raiseDanger(message)
}

goldstone.raiseDanger = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-danger", message)
}

goldstone.raiseWarning = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-warning", message)
}

goldstone.raiseSuccess = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-success", message)
}

goldstone.raiseInfo = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-info", message)
}

goldstone.raiseAlert = function (selector, message) {
    "use strict";
    $(selector).html(message + '<a href="#" class="close" data-dismiss="alert">&times;</a>');
    $(selector).fadeIn("slow");
    window.setTimeout(function() {
        $(selector).fadeOut("slow");
    }, 4000);
}

// convenience for date manipulation
Date.prototype.addSeconds = function (m) {
    "use strict";
    this.setTime(this.getTime() + (m * 1000))
    return this
}

Date.prototype.addMinutes = function (m) {
    "use strict";
    this.setTime(this.getTime() + (m * 60 * 1000))
    return this
}

Date.prototype.addHours = function (h) {
    "use strict";
    this.setTime(this.getTime() + (h * 60 * 60 * 1000))
    return this
}

Date.prototype.addDays = function (d) {
    "use strict";
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000))
    return this
}

Date.prototype.addWeeks = function (d) {
    "use strict";
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000))
    return this
}

// test whether a script is included already
goldstone.jsIncluded = function (src) {
    "use strict";
    var scripts = document.getElementsByTagName("script")
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].getAttribute('src') === src) {
            return true
        }
    }
    return false
}
