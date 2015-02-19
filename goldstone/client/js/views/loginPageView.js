/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var LoginPageView = Backbone.View.extend({

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
'<div class="container">' +
'<div class="row">' +
'<div class="col-md-4 col-md-offset-4">' +
// '<div class="jumbotron text-center">' +
'<div class="text-center">' +
'<h1>Goldstone</h1>' +
'</div>' +
'<form>' +
    '<h3>Please sign in</h3>' +
    '<label for="inputUsername">Username</label>' +
    '<input type="text" class="form-control" placeholder="Username" required autofocus>' +
    '<label for="inputPassword">Password</label>' +
    '<input type="password" class="form-control" placeholder="Password" required><br>' +
    '<button class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>' +
'</form>' +
'</div>' +
'</div>' +
'</div>'
    )

});
