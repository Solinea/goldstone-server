/**
 * Copyright 2015 Solinea, Inc.
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
This view makes up the "Details" tab of nodeReportView.js
It is sub-classed from GoldstoneBaseView.

Instantiated on nodeReportView as:

this.detailsReport = new DetailsReportView({
    el: '#node-report-panel #detailsReport'
});
*/

var DetailsReportView = GoldstoneBaseView.extend({

    instanceSpecificInit: function(options) {
        this.render();

        // node data was stored in localStorage before the
        // redirect from the discover page
        var data = JSON.parse(localStorage.getItem('detailsTabData'));

        // clear after using
        localStorage.removeItem('detailsTabData');

        if(data){
            this.drawSingleRsrcInfoTable(data);
        } else {
            $('#details-single-rsrc-table').text(goldstone.contextTranslate('No additional details available.', 'detailsreport'));
        }
    },

    drawSingleRsrcInfoTable: function(json) {

        // make a dataTable
        var location = '#details-single-rsrc-table';
        var oTable;
        var keys = Object.keys(json);
        var data = _.map(keys, function(k) {
            if (json[k] === Object(json[k])) {
                return [k, JSON.stringify(json[k])];
            } else {
                return [k, json[k]];
            }
        });

        if ($.fn.dataTable.isDataTable(location)) {
            oTable = $(location).DataTable();
            oTable.clear().rows.add(data).draw();
        } else {
            var oTableParams = {
                "data": data,
                "autoWidth": true,
                "info": false,
                "paging": true,
                "searching": true,
                "columns": [{
                    "title": "Key"
                }, {
                    "title": "Value"
                }]
            };
            oTable = $(location).DataTable(oTableParams);
        }
    },

    render: function() {
        $(this.el).append(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="panel panel-primary node_details_panel">' +
        '<div class="panel-heading">' +
        '<h3 class="panel-title"><i class="fa fa-dashboard"></i> <%=goldstone.contextTranslate(\'Resource Details\', \'detailsreport\')%>' +
        '</h3>' +
        '</div>' +
        '</div>' +

        '<div class="panel-body">' +
        '<table id="details-single-rsrc-table" class="table"></table>' +
        '</div>'
    )
});
