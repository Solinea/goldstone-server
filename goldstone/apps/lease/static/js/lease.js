$(document).ready(function() {
    if( $('.datetimeinput').length )
    {
        $('.datetimeinput').datetimepicker({
            controlType: 'select',
            timeFormat: 'HH:mm',
            minDate: 0,
        });
    };
    if( $('#leaselisttable').length )
    {
        $('#leaselisttable').dataTable({
            "aaSorting": [[ 3, "asc" ]],
            "aoColumnDefs": [
                      { 'bSortable': false, 'aTargets': [ 4, 5 ] }
                   ]
        });
    };
});