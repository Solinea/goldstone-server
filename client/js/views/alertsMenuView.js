/**
 * Copyright 2016 Solinea, Inc.
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

// iconEl: 'i.icon.alerts'
AlertsMenuView = GoldstoneBaseView.extend({

    setModel: function() {
        this.model = new Backbone.Model({
            'alerts': []
        });
    },

    alertIcon: 'i.icon.alerts',

    instanceSpecificInit: function() {
        // processes the hash of options passed in when object is instantiated
        // this.render();
        this.setModel();
        this.processOptions();
        this.processListeners();
    },

    processListeners: function() {
        var self = this;

        // registers 'sync' event so view 'watches' collection for data update
        if (this.collection) {
            this.listenTo(this.collection, 'sync', this.update);
            this.listenTo(this.collection, 'error', this.dataErrorMessage);
        }

        this.listenTo(this, 'lookbackSelectorChanged', function() {
            this.getGlobalLookbackRefresh();
            if (this.collection) {
                this.collection.urlGenerator();
            }
        });

        this.listenTo(this.model, 'change', function() {
            self.iconAddHighlight();
        });

        this.$el.on('click', function() {
            self.iconRemoveHighlight();
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
        var data = this.collection.toJSON()[0];
        // set model attributes based on hash of statuses
        this.model.set('alerts', data.results);
    },

    iconAddHighlight: function() {
        $('i.icon.alerts').css('background-color', 'red');
    },

    iconRemoveHighlight: function() {
        $('i.icon.alerts').css('background-color', 'white');
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template(
        '<li class="alerts-tab" data-toggle="tooltip" data-placement="right" data-i18n-tooltip="Alerts" title="Alerts">' +
        '<span class="btn-icon-block"><i class="icon alerts">&nbsp;</i></span>' +
        '<span data-i18n="Alerts" class="btn-txt i18n">Alerts</span>' +
        '</li>'
    )

});
