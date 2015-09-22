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

describe('eventsReportView.js spec', function() {
    beforeEach(function() {

        this.dummyData = '{"info":{"last_updated":"2014-12-03T20:38:37.047+0000"},"rsrcType":"region","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"flavors-leaf","label":"flavors"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hypervisors-leaf","label":"hypervisors"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"zone","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"aggregates-leaf","zone":"west-zone","label":"aggregates"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hosts-leaf","zone":"west-zone","label":"hosts"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"servers-leaf","zone":"west-zone","label":"instances"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"services-leaf","zone":"west-zone","label":"services"}],"label":"west-zone"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"zone","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"aggregates-leaf","zone":"east-zone","label":"aggregates"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hosts-leaf","zone":"east-zone","label":"hosts"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"servers-leaf","zone":"east-zone","label":"instances"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"services-leaf","zone":"east-zone","label":"services"}],"label":"east-zone"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"zone","children":[{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"aggregates-leaf","zone":"internal","label":"aggregates"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"hosts-leaf","zone":"internal","label":"hosts"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"servers-leaf","zone":"internal","label":"instances"},{"info":{"last_update":"2014-12-03T20:38:37.047+0000"},"region":"RegionOne","rsrcType":"services-leaf","zone":"internal","label":"services"}],"label":"internal"}],"label":"RegionOne"}';

        $('body').html('<div class="testContainer"></div><div id="testMultiRsrcView"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, {
                "Content-Type": "text/html"
            },
            this.dummyData
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new ZoomablePartitionCollection({});

        this.testView = new TopologyTreeView({
            blueSpinnerGif: blueSpinnerGif,
            collection: this.testCollection,
            chartHeader: ['.testContainer', 'Test Topology', 'discoverCloudTopology'],
            el: '.testContainer',
            h: 600,
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
    describe('view is constructed', function() {
        it('should exist', function() {
            this.server.respond();

            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('properly filters data for table fields with filterMultiRsrcDataOverride', function() {
            var test1 = this.testView.filterMultiRsrcData([{
                '@timestamp': 123,
                'blah': 'blahhh',
                'region': 'west'
            }, {
                'tags': 'a,b,c',
                'owner': 'zippy',
                'blahblah': 'blah'
            }, {
                'file': 'gone',
                'schema': 'complicated',
                'nothing': null,
                'else': 'ok!'
            }]);
            expect(test1).to.deep.equal([{
                '@timestamp': 123,
                'blah': 'blahhh',
                'region': 'west'
            }, {
                'tags': 'a,b,c',
                'owner': 'zippy',
                'blahblah': 'blah'
            }, {
                'file': 'gone',
                'schema': 'complicated',
                'nothing': null,
                'else': 'ok!'
            }]);

            this.testView.defaults.filterMultiRsrcDataOverride = ['@timestamp',
                'metadata',
                'region',
                'tags',
                'checksum',
                'owner',
                'schema',
                'file'
            ];
            var test2 = this.testView.filterMultiRsrcData([{
                '@timestamp': 123,
                'blah': 'blahhh',
                'region': 'west'
            }, {
                'tags': 'a,b,c',
                'owner': 'zippy',
                'blahblah': 'blah'
            }, {
                'file': 'gone',
                'schema': 'complicated',
                'nothing': null,
                'else': 'ok!'
            }]);
            expect(test2).to.deep.equal([{
                'blah': 'blahhh',
            }, {
                'blahblah': 'blah'
            }, {
                'nothing': null,
                'else': 'ok!'
            }]);
        });
    });
    describe('unit functions behave as expected', function() {
        it('appends leaf name to resource header', function() {
            expect(this.testView.appendLeafNameToResourceHeader).to.be.a('function');
            expect($('.panel-header-resource-title').text()).to.equal('');
            expect($('.additional-info-notice').text()).to.equal('');
            var test1 = this.testView.appendLeafNameToResourceHeader('abc');
            expect($('.panel-header-resource-title').text()).to.equal(': abc');
        });
        it('properly toggles d.children', function() {
            var test = {
                children: [1, 2, 3]
            };
            this.testView.toggleAll(test);
            expect(test).to.deep.equal({
                _children: [1, 2, 3],
                children: null
            });

            test = {
                _children: [1, 2, 3]
            };
            this.testView.toggleAll(test);
            expect(test).to.deep.equal({
                _children: [1, 2, 3]
            });

            var test1 = {
                'nothing': 'ignore',
                children: {
                    'nothing': 'ignore',
                    _children: [1, 2, 3],
                }
            };
            this.testView.toggle(test1);
            expect(test1).to.deep.equal({
                'nothing': 'ignore',
                _children: {
                    'nothing': 'ignore',
                    _children: [1, 2, 3]
                },
                children: null
            });

            var test2 = {
                'nothing': 'ignore',
                _children: {
                    'nothing': 'ignore',
                    children: [1, 2, 3],
                }
            };
            this.testView.toggle(test2);
            expect(test2).to.deep.equal({
                'nothing': 'ignore',
                children: {
                    'nothing': 'ignore',
                    children: [1, 2, 3]
                },
                _children: null
            });

        });
    });
    describe('multiRsrcView is constructed', function() {
        it('renders drawSingleRsrcInfoTable', function() {
            this.testView.drawSingleRsrcInfoTable(100, {
                1: 1,
                2: 2,
                3: 3
            });
        });
        it('loads leaf data', function() {
            // this.testView.loadLeafData('test');
        });
    });
});
