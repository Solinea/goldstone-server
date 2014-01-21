$(document).ready(function(){
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
});

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