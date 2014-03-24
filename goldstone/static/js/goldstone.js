/**
 * Created by stanford on 3/24/14.
 */

var goldstone = {}
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

