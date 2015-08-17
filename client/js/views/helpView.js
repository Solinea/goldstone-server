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
        'or other Goldstone related feedback, check out the ' +
        '<a href="https://groups.google.com/forum/#!forum/goldstone-users" target="_blank">' +
        'goldstone-users forum</a>, or ' +
        '<a href="https://github.com/Solinea/goldstone-server/issues" target="_blank">' +
        'file an issue on Github</a>.<p>For general inquiries or to contact our consulting ' +
        'services team, email <a href=mailto:info@solinea.com>info@solinea.com</a>.' +

        '<a name="license"></a><h3>License</h3>' +
        'Goldstone license information can be found in the file <b>/opt/goldstone/LICENSE</b> ' +
        'or on the web at <a href=https://www.apache.org/licenses/LICENSE-2.0>' +
        'https://www.apache.org/licenses/LICENSE-2.0</a>.'
    )

});
