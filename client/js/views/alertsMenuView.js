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

AlertsMenuView = GoldstoneBaseView.extend({

    setModel: function() {
        this.model = new Backbone.Model({
            'alerts': []
        });
    },

    instanceSpecificInit: function() {
        this.setModel();
        this.processOptions();
        this.processListeners();
        this.setInterval();
    },

    setInterval: function() {
        var self = this;
        var thirtySeconds = (1000 * 30);
        setInterval(function() {
            self.collection.urlGenerator();
        }, thirtySeconds);
    },

    processListeners: function() {
        var self = this;

        // registers 'sync' event so view 'watches' collection for data update
        if (this.collection) {
            this.listenTo(this.collection, 'sync', this.update);
            this.listenTo(this.collection, 'error', this.dataErrorMessage);
        }

        this.listenTo(this.model, 'change', function() {
            self.iconAddHighlight();
            self.renderAlerts();
        });

        $('.tab-links').on('click', 'li', function() {
            self.iconRemoveHighlight();
        });

        this.$el.on('click', function() {
            self.iconRemoveHighlight();
        });
    },

    update: function() {
        var self = this;

        // grab data from collection
        var data = this.collection.toJSON()[0];

        if (data.results) {
            // set model attributes based on hash of statuses
            this.model.set('alerts', data.results);
        }

    },

    iconAddHighlight: function() {
        this.$el.addClass('alert-active');
    },

    iconRemoveHighlight: function() {
        this.$el.removeClass('alert-active');
    },

    timeNow: function() {
        // return now in unix timestamp
        return +new Date();
    },

    renderAlerts: function() {
        this.populateRecentAlertDiv();
        this.populateAllAlertDiv();
    },

    extractRecentAlerts: function(alerts, now) {
        var result = [];
        var oneDay = (1000 * 60 * 60 * 24);
        _.each(alerts, function(alert) {
            if (moment(now).diff(alert.created) <= oneDay) {
                result.push(alert);
            }
        });
        return result;
    },

    alertTemplate: _.template('' +
        '<li>' +
        '<div class="msg-block">' +
        '<span class="msg"><%= short_message %></span>' +
        // '<span class="time"><%= moment(created).calendar() %> (<%= moment(created).format() %>)</span>' +
        '</div>' +
        // '<i class="remove-btn">&nbsp;</i>' +
        '</li>'
    ),

    populateRecentAlertDiv: function() {
        var self = this;
        var results = this.extractRecentAlerts(this.model.get('alerts'), this.timeNow());
        $('.alerts-recent').html('');
        _.each(results, function(alert) {
            $('.alerts-recent').append(self.alertTemplate(alert));
        });
    },

    populateAllAlertDiv: function() {
        var self = this;
        var results = this.model.get('alerts');
        $('.alerts-all').html('');
        _.each(results, function(alert) {
            $('.alerts-all').append(self.alertTemplate(alert));
        });
    }
});
