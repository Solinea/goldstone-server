/**
 * Copyright 2015 Solinea, Inc.
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
 */

/*
implemented on SavedSearchLogPageView as:

    this.savedSearchLogCollection = new GoldstoneBaseCollection({
            skipFetch: true
        });
        this.savedSearchLogCollection.urlBase = "/core/saved_search/";

        this.savedSearchLogView = new savedSearchLogDataTableView({
            chartTitle: goldstone.translate('Saved Searches: Log Browser'),
            collectionMixin: this.savedSearchLogCollection,
            el: "#saved-search-viz",
            infoIcon: 'fa-table',
            width: $('#saved-search-viz').width()
        });

*/

SavedSearchLogDataTableView = DataTableBaseView.extend({

    instanceSpecificInit: function() {
        SavedSearchLogDataTableView.__super__.instanceSpecificInit.apply(this, arguments);

        // initialize with serverSide dataTable defined on DataTableBaseView
        this.drawSearchTableServerSide('#reports-result-table');
    },

    form_index_prefix: 'logstash-*',
    form_doc_type: 'syslog',
    form_timestamp_field: '@timestamp',
    urlRoot: '/core/saved_search/',
    iDisplayLengthOverride: 25,

    render: function() {
        this.$el.html(this.template());
        $(this.el).find('.refreshed-report-container').append(this.dataTableTemplate());

        // append modals for new search / update search / delete search
        $('#create-modal-container').append(this.createModal());
        $('#update-modal-container').append(this.updateModal());
        $('#delete-modal-container').append(this.deleteModal());

        // add event/click handlers to add/update/delete
        this.createModalHandlers();
        this.updateModalHandlers();
        this.deleteModalHandlers();

        return this;
    },

    createModalHandlers: function() {
        var self = this;

        // add /user/'s uuid to hidden form field to be submitted as
        // owner of search
        var populateOwnerUuid = function() {
            $.ajax({
                type: 'GET',
                url: '/user/'
            })
                .done(function(res) {
                    $('.create-form #owner').val(res.uuid);
                })
                .fail(function(err) {
                    goldstone.raiseInfo(err);
                });
        };

        // click listener on add trail plus button to reset modal form
        $('.add-button').on('click', function() {
            $('.create-form')[0].reset();
            populateOwnerUuid();
        });

        // if cancelling add trail dialog, just close modal
        $('#cancel-create-button').on('click', function() {
            $('#create-modal').modal('hide');
        });

        // when submitting data in modal form for add swift trail
        $('.create-form').on('submit', function(e) {
            e.preventDefault();
            var data = $('.create-form').serialize();
            self.createNewSearchAjax(data);
        });

    },

    createNewSearchAjax: function(data) {
        var self = this;

        $.ajax({
            type: "POST",
            url: self.urlRoot,
            data: data
        })
            .done(function() {

                var updateMessage = goldstone.contextTranslate('Creation of %s successful', 'savedsearch');
                var successMessage = goldstone.sprintf(updateMessage, $('.create-form #new-search-name').val());

                // show success message at top of screen
                // uses sprintf string interpolation to create a properly
                // formatted message such as "Creation of trail1 successful"
                goldstone.raiseInfo(successMessage);

            })
            .fail(function(err) {
                var failMessage = goldstone.contextTranslate('Failure to create %s', 'savedsearch');
                var failureWarning = goldstone.sprintf(failMessage, $('.create-form #new-search-name').val());

                // show failure message at top of screen
                // uses sprintf string interpolation to create a properly
                // formatted message such as "Failure to create trail1"
                self.dataErrorMessage(err.responseJSON ? err.responseJSON : failureWarning);

            }).always(function() {
                // close modal
                $('#create-modal').modal('hide');
                // reload table
                self.oTable.ajax.reload();
            });
    },

    updateModalHandlers: function() {
        var self = this;

        // if cancelling update trail dialog, just close modal
        $('#cancel-submit-update-search').on('click', function() {
            $('#update-modal').modal('hide');
        });

        // when submitting data in modal form for updating trail
        $('.update-form').on('submit', function(e) {
            e.preventDefault();

            var data = $('.update-form').serialize();


            $.ajax({
                type: "PATCH",
                url: self.urlRoot + $('#updateUUID').val() + "/",
                data: data
            })
                .done(function() {

                    var updateMessage = goldstone.contextTranslate('Update of %s successful', 'savedsearch');
                    var successMessage = goldstone.sprintf(updateMessage, $('.update-search-form #updateTrailName').val());

                    // success message
                    // uses sprintf string interpolation to create a properly
                    // formatted message such as "Update of trail1 successful"
                    goldstone.raiseInfo(successMessage);

                })
                .fail(function(err) {

                    var failedTrailName = goldstone.contextTranslate('Failure to update %s', 'savedsearch');
                    var failureWarning = goldstone.sprintf(failedTrailName, $('.update-form #updateTrailName').val());

                    // failure message
                    // uses sprintf string interpolation to create a properly
                    // formatted message such as "Failure to update trail1"
                    self.dataErrorMessage(err.responseJSON ? err.responseJSON : failureWarning);

                }).always(function() {
                    // close modal and reload list
                    $('#update-modal').modal('hide');
                    self.oTable.ajax.reload();
                });
        });
    },

    deleteModalHandlers: function() {
        var self = this;

        // if cancelling delete trail dialogue, just close modal
        $('#cancel-delete-search').on('click', function() {
            $('#delete-modal').modal('hide');
        });

        // when submitting data in modal for delete trail
        $('#confirm-delete').on('click', function(e) {
            e.preventDefault();

            var serializedData = $('.delete-form').serialize();

            $.ajax({
                type: "DELETE",
                url: self.urlRoot + $('.delete-form').find('#deleteUUID').val() + "/"
            })
                .done(function() {

                    var deletedTrailName = goldstone.contextTranslate('Deletion of %s complete', 'savedsearch');
                    var deleteSuccess = goldstone.sprintf(deletedTrailName, $('.delete-form #deleteName').val());

                    // success message
                    // uses sprintf string interpolation to create a properly
                    // formatted message such as "Deletion of trail1 complete"
                    goldstone.raiseInfo(deleteSuccess);

                })
                .fail(function(err) {

                    var deletedTrailName = goldstone.contextTranslate('Failure to delete %s', 'savedsearch');
                    var deleteFailure = goldstone.sprintf(deletedTrailName, $('.delete-form #deleteName').val());

                    // failure message
                    self.dataErrorMessage(err.responseJSON ? err.responseJSON : deleteFailure);

                })
                .always(function() {
                    // close modal and reload list
                    $('#delete-modal').modal('hide');
                    self.oTable.ajax.reload();
                });

        });

    },

    update: function() {

        /*
        update is inactive unless set up with triggers on
        OpenTrailManagerPageView. The usual implementation is to trigger
        update upon reaching a refresh interval, if that becomes implemented.
        */

        var oTable;

        if ($.fn.dataTable.isDataTable("#reports-result-table")) {
            oTable = $("#reports-result-table").DataTable();
            oTable.ajax.reload();
        }
    },

    dataTableRowGenerationHooks: function(row, data) {

        var self = this;

        /*
        these hooks are activated once per row when rendering the dataTable.
        each hook has access to the row, and the data specific to that row
        */

        // depending on logging status, grey out row
        $(row).addClass(data.protected === true ? 'paused' : null);

        // set click listeners on row symbols

        $(row).on('click', '.fa-trash-o', function() {

            var deleteWarningText = goldstone.contextTranslate('"%s" will be permanently deleted. Are you sure?', 'savedsearch');
            var deleteWarningMessage = goldstone.sprintf(deleteWarningText, data.name);

            // delete trail modal - pass in row data details
            // uses sprintf string interpolation to create a properly
            // formatted message such as "Trail1 will be permanently deleted."
            $('#delete-modal #delete-name-span').text(deleteWarningMessage);

            // fill in hidden fields for Name and UUID to be
            // submitted via API call as form data
            $('#delete-modal #deleteName').val(data.name);
            $('#delete-modal #deleteUUID').val(data.uuid);
        });

        $(row).on('click', '.fa-gear', function() {

            // clear modal
            $('.update-form')[0].reset();

            // update trail modal - pass in row data details
            // name / isLogging/UUID
            $('#update-modal #update-search-name').val(data.name);
            $('#update-modal #update-search-description').val(data.description);
            $('#update-modal #update-search-query').val('' + data.query);
            $('#update-modal #updateUUID').val('' + data.uuid);

            // shut off input on protected searches
            if (data.protected === true) {
                $('#update-modal #update-search-name').attr('disabled', true);
                $('#update-modal #update-search-query').attr('disabled', true);
            } else {

                // must disable when clicking non-protected or else it will
                // persist after viewing a persisted search
                $('#update-modal #update-search-name').attr('disabled', false);
                $('#update-modal #update-search-query').attr('disabled', false);
            }
        });
    },

    // function to add additional initialization paramaters, as dataTables
    // options can't be changed post-init without the destroy() method.
    addOTableParams: function(options) {
        var self = this;
        options.createdRow = function(row, data) {
            self.dataTableRowGenerationHooks(row, data);
        };

        return options;
    },

    oTableParamGeneratorBase: function() {
        var self = this;
        return {
            "scrollX": "100%",
            "processing": false,
            "lengthChange": true,
            "iDisplayLength": self.iDisplayLengthOverride ? self.iDisplayLengthOverride : 10,
            "paging": true,
            "searching": true,
            "ordering": true,
            "order": [
                [0, 'desc']
            ],
            "columnDefs": [{
                    "data": "name",
                    "targets": 0,
                    "sortable": true
                }, {
                    "data": "description",
                    "targets": 1,
                    "sortable": true
                }, {
                    "targets": 2,
                    "data": null,

                    // add icons to dataTable cell
                    "render": function(data) {
                        if (data.protected === true) {
                            return "<i class='fa fa-gear fa-2x fa-fw' data-toggle='modal' data-target='#update-modal'></i> " +
                                "<div class='saved-search-no-delete'>system search - can not delete</div>";
                        } else {
                            return "<i class='fa fa-gear fa-2x fa-fw' data-toggle='modal' data-target='#update-modal'></i> " +
                                "<i class='fa fa-trash-o fa-2x fa-fw text-danger' data-toggle='modal' data-target='#delete-modal'></i>";
                        }
                    },
                    "sortable": false
                }, {
                    "data": "uuid",
                    "visible": false
                }

            ],
            "serverSide": true,
            "ajax": {
                beforeSend: function(obj, settings) {
                    self.collectionMixin.urlGenerator();
                    // the pageSize and searchQuery are jQuery values
                    var pageSize = $(self.el).find('select.form-control').val();
                    var searchQuery = $(self.el).find('input.form-control').val();

                    // the paginationStart is taken from the dataTables
                    // generated serverSide query string that will be
                    // replaced by this.defaults.url after the required
                    // components are parsed out of it
                    var paginationStart = settings.url.match(/start=\d{1,}&/gi);
                    paginationStart = paginationStart[0].slice(paginationStart[0].indexOf('=') + 1, paginationStart[0].lastIndexOf('&'));
                    var computeStartPage = Math.floor(paginationStart / pageSize) + 1;
                    var urlColumnOrdering = decodeURIComponent(settings.url).match(/order\[0\]\[column\]=\d*/gi);

                    // capture which column was clicked
                    // and which direction the sort is called for

                    var urlOrderingDirection = decodeURIComponent(settings.url).match(/order\[0\]\[dir\]=(asc|desc)/gi);

                    // the url that will be fetched is now about to be
                    // replaced with the urlGen'd url before adding on
                    // the parsed components
                    settings.url = self.collectionMixin.url + "?page_size=" + pageSize +
                        "&page=" + computeStartPage;

                    // here begins the combiation of additional params
                    // to construct the final url for the dataTable fetch
                    if (searchQuery) {
                        settings.url += "&_all__regexp=.*" +
                            searchQuery + ".*";
                    }

                    // if no interesting sort, ignore it
                    if (urlColumnOrdering[0] !== "order[0][column]=0" || urlOrderingDirection[0] !== "order[0][dir]=desc") {

                        // or, if something has changed, capture the
                        // column to sort by, and the sort direction

                        // generalize if sorting is implemented server-side
                        var columnLabelHash = {
                            0: 'name',
                            1: 'description'
                        };

                        var orderByColumn = urlColumnOrdering[0].slice(urlColumnOrdering[0].indexOf('=') + 1);

                        var orderByDirection = urlOrderingDirection[0].slice(urlOrderingDirection[0].indexOf('=') + 1);

                        var ascDec;
                        if (orderByDirection === 'asc') {
                            ascDec = '';
                        } else {
                            ascDec = '-';
                        }

                        // uncomment if sorting is in place
                        settings.url = settings.url + "&ordering=" +
                            ascDec + columnLabelHash[orderByColumn];
                    }


                    // add filter for log/event/api
                    settings.url += self.finalUrlMods();

                },
                dataSrc: "results",
                dataFilter: function(data) {
                    data = self.serverSideDataPrep(data);
                    return data;
                }
            }
        };
    },

    finalUrlMods: function() {
        return '&index_prefix=logstash-*';
    },

    serverSideDataPrep: function(data) {
        data = JSON.parse(data);
        var result = {
            results: data.results,
            recordsTotal: data.count,
            recordsFiltered: data.count
        };
        result = JSON.stringify(result);
        return result;
    },

    serverSideTableHeadings: _.template('' +
        '<tr class="header">' +
        '<th>Name</th>' +
        '<th>Description</th>' +
        '<th>Controls</th>' +
        '</tr>'
    ),

    createModal: _.template("" +
        '<div class="modal fade" id="create-modal" tabindex="-1" role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Create New Search\', \'savedsearch\')%></h4>' +
        '</div>' +

        '<div class="modal-body">' +

        '<form class="create-form">' +

        // Search name
        '<div class="form-group">' +
        '<label for="new-search-name"><%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%></label>' +
        '<input name="name" type="text" class="form-control"' +
        'id="new-search-name" placeholder="<%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%>" required>' +
        '</div>' +

        // Search Description
        '<div class="form-group">' +
        '<label for="new-search-description"><%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%></label>' +
        '<input name="description" type="text" class="form-control"' +
        'id="new-search-description" placeholder="<%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%>">' +
        '</div>' +

        // Search Query
        '<div class="form-group">' +
        '<label for="new-search-query"><%=goldstone.contextTranslate(\'Search Query\', \'savedsearch\')%></label>' +
        '<input name="query" type="text" class="form-control"' +
        'id="new-search-query" placeholder="<%=goldstone.contextTranslate(\'ElasticSearch Query (omit surrounding quotes)\', \'savedsearch\')%>" required>' +
        '</div>' +

        // hidden owner
        // populate with uuid via call to /user/
        '<input name="owner" id="owner" hidden type="text">' +

        // hidden index_prefix
        '<input name="index_prefix" id="index_prefix" hidden type="text" value="<%= this.form_index_prefix  %>">' +

        // hidden doc_type
        '<input name="doc_type" id="doc_type" hidden type="text" value="<%= this.form_doc_type %>">' +

        // hidden timestamp_field
        '<input name="timestamp_field" id="timestamp_field" hidden type="text" value="<%= this.form_timestamp_field %>">' +

        // submit button
        '<button id="submit-create-button" type="submit"' +
        ' class="btn btn-default"><%=goldstone.contextTranslate(\'Submit Search\', \'savedsearch\')%></button> ' +

        // cancel button
        '<button id="cancel-create-button" type="button"' +
        ' class="btn btn-danger"><%=goldstone.contextTranslate(\'Cancel\', \'savedsearch\')%></button>' +

        '</form>' +

        '</div>' + // modal body

        '</div>' + // modal content
        '</div>' + // modal dialogue
        '</div>' // modal container
    ),

    updateModal: _.template("" +
        '<div class="modal fade" id="update-modal" tabindex="-1" ' +
        'role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" ' +
        'aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Update Search Details\', \'savedsearch\')%></h4>' +
        '</div>' +

        '<div class="modal-body">' +

        '<form class="update-form">' +

        // Search name
        '<div class="form-group">' +
        '<label for="update-search-name"><%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%></label>' +
        '<input name="name" type="text" class="form-control"' +
        'id="update-search-name" placeholder="<%=goldstone.contextTranslate(\'Search Name\', \'savedsearch\')%>" required>' +
        '</div>' +

        // Search description
        '<div class="form-group">' +
        '<label for="update-search-description"><%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%></label>' +
        '<input name="description" type="text" class="form-control"' +
        'id="update-search-description" placeholder="<%=goldstone.contextTranslate(\'Search Description\', \'savedsearch\')%>">' +
        '</div>' +

        // Search query
        '<div class="form-group">' +
        '<label for="update-search-query"><%=goldstone.contextTranslate(\'Search Query\', \'savedsearch\')%></label>' +
        '<input name="query" type="text" class="form-control"' +
        'id="update-search-query" placeholder="<%=goldstone.contextTranslate(\'Search Query (omit surrounding quotes)\', \'savedsearch\')%>" required>' +
        '</div>' +

        // hidden UUID
        '<input name="uuid" id="updateUUID" hidden type="text">' +

        // ui submit / cancel button
        '<button id="submit-update-search" type="submit" class="btn btn-default"><%=goldstone.contextTranslate(\'Submit\', \'savedsearch\')%></button>' +
        ' <button id="cancel-submit-update-search" type="button" class="btn btn-danger"><%=goldstone.contextTranslate(\'Cancel\', \'savedsearch\')%></button><br><br>' +

        '</form>' +

        '</div>' + // modal body

        '</div>' + // modal content
        '</div>' + // modal dialogue
        '</div>' // modal container
    ),

    deleteModal: _.template("" +
        '<div class="modal fade" id="delete-modal" tabindex="-1" role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +

        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title"><%=goldstone.contextTranslate(\'Delete Search Confirmation\', \'savedsearch\')%></h4>' +
        '</div>' +

        '<div class="modal-body">' +

        '<form class="delete-form">' +

        // hidden UUID to be submitted with delete request
        '<input id="deleteUUID" hidden type="text">' +

        // hidden name to be submitted with delete request
        '<input id="deleteName" hidden type="text">' +

        // <h4> will be filled in by handler in dataTableRowGenerationHooks with
        // warning prior to deleting a trail
        '<h4><span id="delete-name-span"></span></h4>' +

        '<button id="confirm-delete" type="button" class="btn btn-danger"><%=goldstone.contextTranslate(\'Confirm\', \'savedsearch\')%></button>' +
        ' <button id="cancel-delete-search" type="button" class="btn btn-info"><%=goldstone.translate(\'Cancel\')%></button>' +
        '</form>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '</div>'
    )
});
