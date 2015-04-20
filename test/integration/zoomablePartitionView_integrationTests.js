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

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('zoomablePartitionview.js spec', function() {
    beforeEach(function() {

        this.dummyData = ' {"info":{"last_updated":"2014-12-03T20:38:37.047+0000"},"rsrcType":"region","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"flavors-leaf","label":"flavors"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hypervisors-leaf","label":"hypervisors"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"zone","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"aggregates-leaf","zone":"west-zone","label":"aggregates"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hosts-leaf","zone":"west-zone","label":"hosts"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"servers-leaf","zone":"west-zone","label":"instances"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"services-leaf","zone":"west-zone","label":"services"}],"label":"west-zone"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"zone","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"aggregates-leaf","zone":"east-zone","label":"aggregates"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hosts-leaf","zone":"east-zone","label":"hosts"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"servers-leaf","zone":"east-zone","label":"instances"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"services-leaf","zone":"east-zone","label":"services"}],"label":"east-zone"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"zone","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"aggregates-leaf","zone":"internal","label":"aggregates"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hosts-leaf","zone":"internal","label":"hosts"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"servers-leaf","zone":"internal","label":"instances"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"services-leaf","zone":"internal","label":"services"}],"label":"internal"}],"label":"RegionOne"}';

        $('body').html('<div class="testContainer"></div><div id="testMultiRsrcView"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
                "Content-Type": "application/json"
            },
            this.dummyData
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new ZoomablePartitionCollection({});

        this.testView = new TopologyTreeView({
            blueSpinnerGif: blueSpinnerGif,
            chartHeader: ['.testContainer', 'Test Topology', 'discoverCloudTopology'],
            collection: this.testCollection,
            el: '.testContainer',
            frontPage: false,
            h: 400,
            multiRsrcViewEl: '#testMultiRsrcView',
            width: $('.testContainer').width(),
            leafDataUrls: {
                "services-leaf": "/services",
                "endpoints-leaf": "/endpoints",
                "roles-leaf": "/roles",
                "users-leaf": "/users",
                "tenants-leaf": "/tenants",
                "agents-leaf": "/agents",
                "aggregates-leaf": "/aggregates",
                "availability-zones-leaf": "/availability_zones",
                "cloudpipes-leaf": "/cloudpipes",
                "flavors-leaf": "/flavors",
                "floating-ip-pools-leaf": "/floating_ip_pools",
                "hosts-leaf": "/hosts",
                "hypervisors-leaf": "/hypervisors",
                "networks-leaf": "/networks",
                "secgroups-leaf": "/security_groups",
                "servers-leaf": "/servers",
                "images-leaf": "/images",
                "volumes-leaf": "/volumes",
                "backups-leaf": "/backups",
                "snapshots-leaf": "/snapshots",
                "transfers-leaf": "/transfers",
                "volume-types-leaf": "/volume_types"
            }
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });

    describe('click events fire click function', function() {
        it('responds to a dom click', function() {

            var d3Click = jQuery.fn.d3Click = function() {
                this.each(function(i, e) {
                    var evt = document.createEvent("MouseEvents");
                    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                    e.dispatchEvent(evt);
                });
            };

            $('.servers-leaf-icon').first().d3Click();

        });
        it('parses appropriately', function() {
            var test1 = this.testCollection.parse([1,2,3]);
            expect(test1).to.deep.equal([1,2,3]);
        });
    });

});
