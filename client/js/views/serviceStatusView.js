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

var ServiceStatusView = GoldstoneBaseView.extend({

    setModel: function() {
        this.model = new Backbone.Model({
            'results': []
        });
    },

    instanceSpecificInit: function() {
        // processes the hash of options passed in when object is instantiated
        this.setModel();
        this.processOptions();
        this.processListeners();
        this.render();
        this.appendChartHeading();
        this.addModalAndHeadingIcons();
        this.setSpinner();
    },

    processListeners: function() {
        // registers 'sync' event so view 'watches' collection for data update
        if (this.collection) {
            this.listenTo(this.collection, 'sync', this.update);
            this.listenTo(this.collection, 'error', this.dataErrorMessage);
        }

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            if (this.collection) {
                this.showSpinner();
                this.collection.urlGenerator();
            }
        });

        this.listenTo(this.model, 'change', function() {
            this.updateChart();
        });
    },

    convertStatus: function(value) {
        /*
        online = green
        offline = red
        intermittent = orange
        unknown = grey
        */

        if (value === 'UP') {
            return 'online';
        }
        if (value === 'DOWN') {
            return 'offline';
        }

        // otherwise
        return 'unknown';
    },

    update: function() {
        var self = this;

        // grab data from collection
        var data = this.collection.toJSON();
        this.hideSpinner();

        // if no data returned, append 'no data' and hide spinner
        // or else just hide spinner
        if (!this.checkReturnedDataSet(data[0].results)) {
            return;
        }

        // otherwise extract statuses from buckets
        data = data[0].results;

        /*
        {
            "created": "2016-03-10T03:51:00.088953Z",
            "host": "rdo-kilo",
            "name": "cinder",
            "state": "DOWN",
            "updated": "2016-03-10T23:02:00.081637Z",
            "uuid": "ddef095a-dc85-48c6-9fb6-e7ecc52e5fcd"
        }
        */

        // set model.results which will trigger 'change' if
        // anything is different from previous fetch
        this.model.set('results', data);
    },

    render: function() {
        $(this.el).html(this.template());
        return this;
    },

    updateChart: function() {
        var self = this;
        this.$el.find('.fill-in').html('');
        var data = this.collection.toJSON()[0].results;
        _.each(data, function(status) {
            self.$el.find('.fill-in').append(self.statusBlockTemplate(status));
        });

    },

    properCap: function(word) {
        return word.substr(0, 1).toUpperCase() + word.substr(1);
    },

    statusBlockTemplate: _.template('' +
        '<li>' +
        '<span class="host"><%= host %></span>' +
        '<span class="service"><%= goldstone.translate(this.properCap(name)) %></span>' +
        '<span class="service-status"><i class=<%= this.convertStatus(state) %>>&nbsp;</i></span>' +
        '</li>'
    ),

    template: _.template('' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<ul class="service-status-table shadow-block">' +
        '<li class="table-header">' +
        '<span class="host"><%= goldstone.translate("Host") %></span>' +
        '<span class="service"><%= goldstone.translate("Service") %></span>' +
        '<span class="service-status"><%= goldstone.translate("Status") %></span>' +
        '</li>' +
        '<div class="fill-in"></div>' +
        '</ul>')

});
