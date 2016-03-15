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

        this.dummyData = '{"children":[{"uuid":"7b2014b2-9e9a-11e5-86ae-0242ac110006","resourcetype":"regions","resource_list_url":"","integration":"keystone","label":"RegionOne","children":[{"uuid":"7b216ed4-9e9a-11e5-86ae-0242ac110006","resourcetype":"keystone","resource_list_url":"","integration":"keystone","label":"keystone","children":[{"uuid":"7c1f846a-9e9a-11e5-86ae-0242ac110006","resourcetype":"roles","resource_list_url":"/keystone/roles/?region=RegionOne","integration":"keystone","label":"roles","children":null},{"uuid":"7b6d03d0-9e9a-11e5-86ae-0242ac110006","resourcetype":"endpoints","resource_list_url":"/keystone/endpoints/?region=RegionOne&zone=public","integration":"keystone","label":"public endpoints","children":null},{"uuid":"7b6bc934-9e9a-11e5-86ae-0242ac110006","resourcetype":"endpoints","resource_list_url":"/keystone/endpoints/?region=RegionOne&zone=admin","integration":"keystone","label":"admin endpoints","children":null},{"uuid":"7beec456-9e9a-11e5-86ae-0242ac110006","resourcetype":"services","resource_list_url":"/keystone/services/?region=RegionOne","integration":"keystone","label":"services","children":null},{"uuid":"7b6c4558-9e9a-11e5-86ae-0242ac110006","resourcetype":"endpoints","resource_list_url":"/keystone/endpoints/?region=RegionOne&zone=internal","integration":"keystone","label":"internal endpoints","children":null},{"uuid":"7acd6b2c-9e9a-11e5-86ae-0242ac110006","resourcetype":"users","resource_list_url":"/keystone/users/?region=RegionOne","integration":"keystone","label":"users","children":null}]},{"uuid":"7b240b4e-9e9a-11e5-86ae-0242ac110006","resourcetype":"neutron","resource_list_url":"","integration":"neutron","label":"neutron","children":null},{"uuid":"7b2530aa-9e9a-11e5-86ae-0242ac110006","resourcetype":"glance","resource_list_url":"","integration":"glance","label":"glance","children":[{"uuid":"7a39875e-9e9a-11e5-86ae-0242ac110006","resourcetype":"images","resource_list_url":"/glance/images/?region=RegionOne","integration":"glance","label":"images","children":null}]},{"uuid":"7b2321b6-9e9a-11e5-86ae-0242ac110006","resourcetype":"nova","resource_list_url":"","integration":"nova","label":"nova","children":[{"uuid":"7bef99bc-9e9a-11e5-86ae-0242ac110006","resourcetype":"services","resource_list_url":"/nova/services/?region=RegionOne","integration":"keystone","label":"services","children":null},{"uuid":"7d499970-9e9a-11e5-86ae-0242ac110006","resourcetype":"hypervisors","resource_list_url":"/nova/hypervisors/?region=RegionOne","integration":"nova","label":"hypervisors","children":null},{"uuid":"7ccdd83a-9e9a-11e5-86ae-0242ac110006","resourcetype":"flavors","resource_list_url":"/nova/flavors/?region=RegionOne","integration":"nova","label":"flavors","children":null},{"uuid":"7d12e920-9e9a-11e5-86ae-0242ac110006","resourcetype":"hosts","resource_list_url":"/nova/hosts/?region=RegionOne","integration":"nova","label":"hosts","children":null},{"uuid":"7e232122-9e9a-11e5-86ae-0242ac110006","resourcetype":"servers","resource_list_url":"/nova/servers/?region=RegionOne&zone=nova","integration":"nova","label":"servers","children":null}]},{"uuid":"7b27ab00-9e9a-11e5-86ae-0242ac110006","resourcetype":"cinder","resource_list_url":"","integration":"cinder","label":"cinder","children":[{"uuid":"79a6987c-9e9a-11e5-86ae-0242ac110006","resourcetype":"volume types","resource_list_url":"/cinder/volume_types/?region=RegionOne","integration":"cinder","label":"volume types","children":null},{"uuid":"7bf12d04-9e9a-11e5-86ae-0242ac110006","resourcetype":"services","resource_list_url":"/cinder/services/?region=RegionOne","integration":"keystone","label":"services","children":null}]}]}],"uuid":null,"label":"cloud"}';

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

        this.testCollection = new GoldstoneBaseCollection({
            urlBase: "/go/team/"
        });

        this.testView = new TopologyTreeView({
            blueSpinnerGif: blueSpinnerGif,
            collection: this.testCollection,
            chartTitle: goldstone.translate('Cloud Topology'),
            el: '.testContainer',
            height: 600,
            infoText: 'discoverCloudTopology',
            multiRsrcViewEl: '#testMultiRsrcView',
            width: $('.testContainer').width()
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

            this.testView.filterMultiRsrcDataOverride = ['@timestamp',
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
            expect($('.panel-title').eq(1).text()).to.equal('Resource List');
            expect($('.title-extra').text()).to.equal('');
            var test1 = this.testView.appendLeafNameToResourceHeader('abc');
            expect($('.panel-title').eq(1).text()).to.equal('Resource List: abc');
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
        it('kebab-cases', function() {
            var test1 = this.testView.kebabCase('');
            expect(test1).to.equal('');

            test1 = this.testView.kebabCase('hello');
            expect(test1).to.equal('hello');

            test1 = this.testView.kebabCase('hello there');
            expect(test1).to.equal('hello-there');

            test1 = this.testView.kebabCase(' hello there');
            expect(test1).to.equal('-hello-there');

            test1 = this.testView.kebabCase(' hello there ');
            expect(test1).to.equal('-hello-there-');

            test1 = this.testView.kebabCase(' hello  there ');
            expect(test1).to.equal('-hello--there-');

            test1 = this.testView.kebabCase('now there are five words');
            expect(test1).to.equal('now-there-are-five-words');
        });
    });
});
