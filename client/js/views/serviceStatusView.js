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

// this chart provides the base methods that
// are extended into almost all other Views

var ServiceStatusView = GoldstoneBaseView.extend({

    setModel: function() {
        this.model = new Backbone.Model({
            'cinder': 'unknown',
            'glance': 'unknown',
            'keystone': 'unknown',
            'neutron': 'unknown',
            'nova': 'unknown',
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
            this.getGlobalLookbackRefresh();
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

        // screen out non-numbers
        if (+value !== value) {
            return 'unknown';
        }
        if (value > 0) {
            return 'online';
        } else {
            return 'offline';
        }
    },

    update: function() {
        var self = this;

        // grab data from collection
        var data = this.collection.toJSON();
        this.hideSpinner();

        // append 'no data returned if so'
        // or else hide spinner
        this.checkReturnedDataSet(data);

        // otherwise extract statuses from buckets
        data = data[0].aggregations.per_component.buckets;

        /*
        {
            doc_count: 75
            key: "neutron"
        }
        */

        // set model attributes based on hash of statuses
        _.each(data, function(bucket) {
            var value = self.convertStatus(bucket.doc_count);
            self.model.set(bucket.key, value);
        });

    },

    render: function() {
        $(this.el).html(this.template());
        $(this.el).find('.fill-in').html(this.statusTemplate());
        return this;
    },

    updateChart: function() {
        $(this.el).find('.fill-in').html(this.statusTemplate());
    },

    statusTemplate: _.template('' +
        '<li>' +
        '<span class="service">Cinder</span>' +
        '<span class="sf"><i class=<%= this.model.get("cinder") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Glance</span>' +
        '<span class="sf"><i class=<%= this.model.get("glance") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Keystone</span>' +
        '<span class="sf"><i class=<%= this.model.get("keystone") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Neutron</span>' +
        '<span class="sf"><i class=<%= this.model.get("neutron") %>>&nbsp;</i></span>' +
        '</li>' +
        '<li>' +
        '<span class="service">Nova</span>' +
        '<span class="sf"><i class=<%= this.model.get("nova") %>>&nbsp;</i></span>' +
        '</li>'),

        template: _.template('' +
        '<div class="alert alert-danger popup-message" hidden="true"></div>' +
        '<ul class="service-status-table shadow-block">' +
        '<li class="table-header">' +
        '<span class="service">Service</span>' +
        '<span class="sf">Status</span>' +
        '</li>' +
        '<div class="fill-in"></div>' +
        '</ul>')

});
