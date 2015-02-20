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

// define collection and link to model

var NodeAvailModel = GoldstoneBaseModel.extend({
    idAttribute: "id"
});

var NodeAvailCollection = Backbone.Collection.extend({

    parse: function(data) {
        if (data.next && data.next !== null) {
            var dp = data.next;
            var nextUrl = dp.slice(dp.indexOf('/logging'));
            this.fetch({
                url: nextUrl,
                remove: false
            });
        }
        return data.results;
    },

    model: NodeAvailModel,

    thisXhr: null,

    initXhr: function() {
        this.thisXhr = this.fetch({
            beforeSend: function(request) {
                console.log('in before send', request);
                console.log('user token being sent?', localStorage.getItem('userToken'));
                request.setRequestHeader('Authorization', 'Token ' + localStorage.getItem('userToken'));
                console.log('in before send', request);
            }
        });
    },

    setXhr: function() {
        this.thisXhr = this.fetch({
            remove: true,
            beforeSend: function(request) {
                console.log('in before send', request);
                console.log('user token being sent?', localStorage.getItem('userToken'));
                request.setRequestHeader('Authorization', 'Token ' + localStorage.getItem('userToken'));
                console.log('in before send', request);
            }
        });
    },

    initialize: function(options) {
        this.url = options.url;
        // url string similar to: /logging/nodes?page_size=100

        this.initXhr();
    }
});
