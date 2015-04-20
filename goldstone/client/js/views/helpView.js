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

var HelpView = GoldstoneBaseView.extend({

    defaults: {},

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.el = options.el;
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<h3>Help Topics</h3>' +
        '<ul>' +
        '<li><a href="#getting_help">Getting help</a></li>' +
        '<li><a href="#license">License</a></li>' +
        '</ul>' +

        '<a name="getting_help"></a><h3>Getting Help</h3>' +
        'If you would like to contact Solinea regarding issues, feature requests, ' +
        'or other goldstone related feedback, click the ' +
        '<a href="http://www.solinea.com/goldstone/feedback" target="_blank">' +
        '<i class="fa fa-bug" style="color:black"></i>' +
        '</a> icon here or at the top right corner of the application panel. In the ' +
        'event that you do not have internet access from the system running the ' +
        'goldstone interface, you can use the link <b>http://www.solinea.com/' + 'goldstone/feedback</b> ' +
        'from another system, or provide the following information via email to ' +
        '<b>goldstone@solinea.com</b>:' +
        '<ul>' +
        '<li>Name</li>' +
        '<li>Company</li>' +
        '<li>Summary</li>' +
        '<li>Detailed description of issue</li>' +
        '<li>Attachments (if appropriate)</li>' +
        '</ul>' +

        'For general inquiries or to contact our consulting services team, either ' +
        'click the ' +
        '<a href="http://www.solinea.com/contact" target="_blank">' +
        '<i class="fa fa-envelope-o" style="color:black"></i>' +
        '</a> icon here or at the top right of the application window, or email ' +
        '<b>info@solinea.com</b>.' +

        '<a name="license"></a><h3>License</h3>' +
        'Goldstone license information can be found in the file <b>/opt/goldstone' + '/LICENSE.pdf</b> ' +
        'or on the web at <b>http://www.solinea.com/goldstone/license.pdf</b>. ' + 'Disclosures for ' +
        '3rd party software used by goldstone can be found in the file <b>/opt/' + 'goldstone/OSS_LICENSE_DISCLOSURE.pdf</b> ' +
        'or on the web at <b>http://www.solinea.com/goldstone/' + 'OSS_LICENSE_DISCLOSURE.pdf</b>'
    )

});
