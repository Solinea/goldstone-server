$(document).ready(function() {
    // $('.dateinput').datepicker({ format: "yyyy/mm/dd", minDate: "+1" });
    $('.datetimeinput').datetimepicker({
        controlType: 'select',
        timeFormat: 'HH:mm',
        minDate: 0
    });
    $('#leaselisttable').dataTable();
});