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

    instanceSpecificInit: function() {
        this.el = this.options.el;
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    },

    template: _.template('' +
        '<div class="row">' +
        '<div class="col-md-12">' +
        '<h3><%=goldstone.translate("Getting Help")%></h3>' +
        '<%=goldstone.translate("If you would like to contact Solinea regarding issues, feature requests, or other Goldstone related feedback, check out the <a href=\'https://groups.google.com/forum/#!forum/goldstone-users\' target=\'_blank\'>goldstone-users forum</a>, or <a href=\'https://github.com/Solinea/goldstone-server/issues\' target=\'_blank\'> file an issue on Github</a>. For general inquiries or to contact our consulting services team, email <a href=\'mailto:info@solinea.com\'>info@solinea.com</a>.")%>' +

        '<h3><%=goldstone.translate("License")%></h3>' +
        '<%=goldstone.translate("Goldstone license information can be found in the file <b>/opt/goldstone/LICENSE</b> or on the web at <a href=\'https://www.apache.org/licenses/LICENSE-2.0\'>https://www.apache.org/licenses/LICENSE-2.0</a>.")%>' +
        '</div>' +
        '</div>'
    )

});
