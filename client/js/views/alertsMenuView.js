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
var AlertsMenuView = GoldstoneBaseView.extend({

    setModel: function() {
        this.model = new Backbone.Model({
            'alerts': []
        });
    },

    instanceSpecificInit: function() {
        this.REFRESH_INTERVAL_SECONDS = 30;
        this.RECENT_ALERT_MINUTES = (24 * 60);
        this.setModel();
        this.processOptions();
        this.processListeners();
        this.setInterval();
        this.populateRecentAlertDiv();
    },

    clearInterval: function() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },

    setInterval: function() {
        var self = this;
        var thirtySeconds = (1000 * this.REFRESH_INTERVAL_SECONDS);
        this.refreshInterval = setInterval(function() {
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
            self.renderAlerts();
        });
    },

    update: function() {
        var self = this;

        // grab data from collection
        var data = this.collection.toJSON();
        // set model attributes based on hash of statuses
        this.model.set('alerts', data);
    },

    timeNow: function() {
        // return now in unix timestamp
        return +new Date();
    },

    renderAlerts: function() {
        this.populateRecentAlertDiv();
    },

    extractRecentAlerts: function(alerts, now) {
        var self = this;
        var result = [];
        var oneDay = (1000 * 60 * this.RECENT_ALERT_MINUTES);
        _.each(alerts, function(alert) {
            if (moment(now).diff(alert.created) <= oneDay) {
                result.push(alert);
            }
        });
        self.updateAlertIcon(result.length);
        return result;
    },

    updateAlertIcon: function(count) {

        // empty string will remove counter badge
        if (count === 0) count = "";

        // update number on alert icon bell
        $('#badge-count').text(count);
    },

    updateTotalAlertCount: function(count) {

        // update number in drop-down count
        $('span.notification-count').text('(' + count + ')');
    },

    // first section of hover drop-down
    alertBannerTemplate: _.template('' +
        '<li class="banner">Alerts and notifications</li>'
    ),

    // render if no recent alerts
    noRecentAlerts: _.template('' +
        '<li class="alert-content initial">You don\'t have any new alerts</li>'
    ),

    // standard alert template
    recentAlertTemplate: _.template('' +
        '<li class="individual-alert">' +
        '<span class="alert-title">' +

        // truncated client-side
        '<% print(short_message.split("triggered")[0] + "<br>") %>' +
        '</span>' +
        '<% print(moment(created).format("MMM D, YYYY")) %>' +
        '<% print(" at ") %>' +
        '<% print(moment(created).format("hh:mm:ssa")) %>' +
        '</li>'
    ),

    // bottom of alert hover drop-down
    alertFooterTemplate: _.template('' +
        '<li class="action"><a href="#">View All <span class="notification-count"></span></a></li>'
    ),

    populateRecentAlertDiv: function() {
        var self = this;
        var results = this.extractRecentAlerts(this.model.get('alerts'), this.timeNow());

        // return the first 5 results to drop-down icon
        results = _.first(results, 5);

        // clear out alert container
        $('.alert-content-parent').html('');

        // append header
        $('.alert-content-parent').append(this.alertBannerTemplate());

        if (!results.length) {

            // append no recent alert message
            $('.alert-content-parent').append(this.noRecentAlerts());
        }

        // append recent alerts
        _.each(results, function(alert) {
            // alert icon drop-downs
            $('.alert-content-parent').append(self.recentAlertTemplate(alert));
        });

        // append "view all" footer
        $('.alert-content-parent').append(this.alertFooterTemplate());

        // add number inside 'view all' parentheses
        this.updateTotalAlertCount(this.model.get('alerts').length);
    }
});
