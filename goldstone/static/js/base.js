
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

// test whether a script is included already
function jsIncluded(src) {
    "use strict";
    var scripts = document.getElementsByTagName("script")
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].getAttribute('src') === src) {
            return true
        }
    }
    return false
}

function raiseError(message) {
    raiseDanger(message)
}

function raiseDanger(message) {
    raiseAlert(".alert-danger", message);
}

function raiseWarning(message) {
    raiseAlert(".alert-warning", message);
}

function raiseSuccess(message) {
    raiseAlert(".alert-success", message);
}

function raiseInfo(message) {
    raiseAlert(".alert-info", message);
}

function raiseAlert(selector, message) {
    $(selector).html(message + '<a href="#" class="close" data-dismiss="alert">&times;</a>');
    $(selector).fadeIn("slow");
    window.setTimeout(function() {
        $(selector).fadeOut("slow");
    }, 4000);
}