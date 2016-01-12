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
//integration tests

describe('logAnalysis.js spec', function() {
    beforeEach(function() {

        $('body').html('<div id="log-viewer-visualization"></div>' +
            '<div id="log-viewer-table"></div>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.protoFetchSpy = sinon.spy(LogBrowserCollection.prototype, "fetch");

        var testEnd = (+new Date());
        var testStart = (testEnd - (15 * 60 * 1000));


        this.testCollection = new LogBrowserCollection({
            urlBase: '/core/logs/'
        });

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new LogBrowserViz({
            chartTitle: goldstone.contextTranslate('Logs vs Time', 'logbrowserpage'),
            collection: this.testCollection,
            el: '#log-viewer-visualization',
            height: 300,
            infoText: 'logBrowser',
            marginLeft: 60,
            width: $('#log-viewer-visualization').width(),
            yAxisLabel: goldstone.contextTranslate('Log Events', 'logbrowserpage')
        });

        this.testCollection.reset();
        this.testCollection.add({
            "count": 7322,
            "next": "http://localhost:8000/core/logs/?%40timestamp__range=%7B%22gte%22%3A1452554745165%2C%22lte%22%3A1452555645165%7D&page=2&page_size=10&syslog_severity__terms=%5B%22emergency%22%2C%22alert%22%2C%22critical%22%2C%22error%22%2C%22warning%22%2C%22notice%22%2C%22info%22%2C%22debug%22%5D",
            "previous": null,
            "results": [{
                "_score": 0.17027496,
                "_type": "syslog",
                "_id": "AVIzCDIE63t9WoN3hcin",
                "_source": {
                    "event_type": "OpenStackSyslogError",
                    "@timestamp": "2016-01-11T23:32:00.979Z",
                    "pid": 2861,
                    "syslog_facility": "local2",
                    "syslog_ts": "2016-01-11T23:32:00.979158+00:00",
                    "received_at": "2016-01-11T23:32:00.990Z",
                    "message": "<147>2016-01-11T23:32:00.979158+00:00 base.pepple.info journal: 2016-01-11 23:32:00.970 2861 ERROR neutron.agent.l3.agent [-] Failed to process compatible router '840c806e-c2e8-4c1e-b566-e7d985689b46'\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent Traceback (most recent call last):\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 465, in _process_router_update\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     self._process_router_if_compatible(router)\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 401, in _process_router_if_compatible\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     target_ex_net_id = self._fetch_external_net_id()\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 281, in _fetch_external_net_id\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     raise Exception(msg)\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent Exception: The 'gateway_external_network_id' option must be configured for this agent as Neutron has more than one external network.",
                    "syslog5424_host": "base.pepple.info",
                    "port": 36576,
                    "syslog_facility_code": 18,
                    "syslog_severity_code": 3,
                    "program": "neutron.agent.l3.agent",
                    "syslog5424_pri": "147",
                    "type": "syslog",
                    "openstack_message": "Failed to process compatible router '840c806e-c2e8-4c1e-b566-e7d985689b46'\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent Traceback (most recent call last):\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 465, in _process_router_update\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     self._process_router_if_compatible(router)\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 401, in _process_router_if_compatible\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     target_ex_net_id = self._fetch_external_net_id()\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 281, in _fetch_external_net_id\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     raise Exception(msg)\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent Exception: The 'gateway_external_network_id' option must be configured for this agent as Neutron has more than one external network.",
                    "tags": ["multiline", "filter_16_fail", "filter_20_pass", "openstack_syslog", "filter_34_pass"],
                    "timestamp": "2016-01-11 23:32:00.970",
                    "component": "neutron",
                    "host": "base.pepple.info",
                    "log_message": "journal: 2016-01-11 23:32:00.970 2861 ERROR neutron.agent.l3.agent [-] Failed to process compatible router '840c806e-c2e8-4c1e-b566-e7d985689b46'\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent Traceback (most recent call last):\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 465, in _process_router_update\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     self._process_router_if_compatible(router)\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 401, in _process_router_if_compatible\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     target_ex_net_id = self._fetch_external_net_id()\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent   File \"/usr/lib/python2.7/site-packages/neutron/agent/l3/agent.py\", line 281, in _fetch_external_net_id\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent     raise Exception(msg)\n2016-01-11 23:32:00.970 2861 TRACE neutron.agent.l3.agent Exception: The 'gateway_external_network_id' option must be configured for this agent as Neutron has more than one external network.",
                    "syslog_severity": "ERROR",
                    "request_id_list": "[-]",
                    "loglevel": "ERROR",
                    "@version": "1"
                },
                "_index": "logstash-2016.01.11"
            }, {
                "_score": 0.17027496,
                "_type": "syslog",
                "_id": "AVIzCKuK63t9WoN3hcms",
                "_source": {
                    "syslog_severity_code": 3,
                    "syslog5424_host": "base.pepple.info",
                    "event_type": "GenericSyslogError",
                    "tags": ["filter_16_fail", "filter_20_pass", "filter_34_fail"],
                    "@version": "1",
                    "@timestamp": "2016-01-11T23:32:32.222Z",
                    "syslog5424_pri": "155",
                    "syslog_facility": "local3",
                    "syslog_severity": "ERROR",
                    "host": "base.pepple.info",
                    "syslog_ts": "2016-01-11T23:32:32.222309+00:00",
                    "received_at": "2016-01-11T23:32:32.226Z",
                    "log_message": "journal: Couldn't obtain IP address of instance f92fde66-5232-44b0-bd7d-25f6263b2dcc",
                    "message": "<155>2016-01-11T23:32:32.222309+00:00 base.pepple.info journal: Couldn't obtain IP address of instance f92fde66-5232-44b0-bd7d-25f6263b2dcc",
                    "type": "syslog",
                    "port": 36576,
                    "syslog_facility_code": 19
                },
                "_index": "logstash-2016.01.11"
            }],
            "aggregations": {
                "all_levels": {
                    "buckets": [{
                        "key": "INFO",
                        "doc_count": 100
                    }, {
                        "key": "WARNING",
                        "doc_count": 20
                    }, {
                        "key": "NOTICE",
                        "doc_count": 50
                    }, {
                        "key": "ERROR",
                        "doc_count": 0
                    }, {
                        "key": "DEBUG",
                        "doc_count": 0
                    }],
                    "sum_other_doc_count": 0,
                    "doc_count_error_upper_bound": 0
                },
                "per_interval": {
                    "buckets": [{
                        "per_level": {
                            "buckets": [{
                                "key": "INFO",
                                "doc_count": 100
                            }, {
                                "key": "WARNING",
                                "doc_count": 20
                            }, {
                                "key": "NOTICE",
                                "doc_count": 50
                            }, {
                                "key": "ERROR",
                                "doc_count": 0
                            }, {
                                "key": "DEBUG",
                                "doc_count": 0
                            }],
                            "sum_other_doc_count": 0,
                            "doc_count_error_upper_bound": 0
                        },
                        "key_as_string": "2016-01-11T00:00:00.000Z",
                        "key": 1427474584000,
                        "doc_count": 7322
                    }]
                }
            }
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            var dataTest = JSON.stringify('hello');
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(1);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.parse(dataTest);
        });
        it('should parse appropriately', function() {
            testObj = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                data: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(testObj);
            expect(test1).to.deep.equal({
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                data: [1, 2, 3]
            });
            testObj = {
                monkeys: 'bananas',
                next: null,
                data: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(testObj);
            expect(test2).to.deep.equal({
                monkeys: 'bananas',
                next: null,
                data: [1, 2, 3]
            });
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal([{
                INFO: 100,
                WARNING: 20,
                NOTICE: 50,
                ERROR: 0,
                DEBUG: 0,
                EMERGENCY: 0,
                ALERT: 0,
                CRITICAL: 0,
                date: 1427474584000
            }]);
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('#log-viewer-visualization');
            this.constructUrl_spy = sinon.spy(this.testView, "constructUrl");
            expect(this.constructUrl_spy.callCount).to.equal(0);
            this.testView.trigger('lookbackSelectorChanged', [1, 2]);
            expect(this.constructUrl_spy.callCount).to.equal(1);
            this.constructUrl_spy.restore();
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.x axis').find('text').text()).to.equal('');
            expect($('.y axis').text().trim()).to.equal('');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            this.testCollection.reset();
            this.testView.checkReturnedDataSet(this.testCollection.toJSON());
            expect($('.popup-message').text()).to.equal('No Data Returned');
            this.testCollection.add({
                audit: 10,
                time: 1421085130000
            });
            this.testView.checkReturnedDataSet(this.testCollection.toJSON());
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(0);
            expect($('svg').find('text').text()).to.equal('Log Events');
            this.update_spy.restore();
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.testView.update();

            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            this.testView.dataErrorMessage(null, {
                responseJSON: {
                    status_code: 246,
                    message: 'responseJSON message all up in your tests.',
                    detail: 'and some extra details, just for fun'
                }
            });
            expect($('.popup-message').text()).to.equal('246 error: responseJSON message all up in your tests. and some extra details, just for fun');
            this.testView.dataErrorMessage(null, {
                status: '999',
                responseText: 'naughty - coal for you!'
            });
            expect($('.popup-message').text()).to.equal('999 error: naughty - coal for you!.');
            this.testView.dataErrorMessage(null, {
                status: '123',
                responseText: 'nice - bourbon for you!'
            });
            expect($('.popup-message').text()).to.equal('123 error: nice - bourbon for you!.');
            this.testView.dataErrorMessage("butterfly - spread your wings again");
            expect($('.popup-message').text()).to.equal('butterfly - spread your wings again');
            this.testView.clearDataErrorMessage();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.dataErrorMessage_spy.callCount).to.equal(4);
            this.dataErrorMessage_spy.restore();
        });
        it('should set a new url based on global lookback params coming from parent view', function() {
            this.constructUrl_spy = sinon.spy(this.testView, "constructUrl");
            expect(this.constructUrl_spy.callCount).to.equal(0);
            // should construct url
            expect(this.testCollection.url).to.include('/core/logs/?@timestamp__range={"gte":');
            this.testView.trigger('lookbackIntervalReached', [1000, 2000]);
            expect(this.testCollection.url).to.include('/core/logs/?@timestamp__range={"gte":');
            this.testView.trigger('lookbackIntervalReached', [1421428385868, 1421438385868]);
            expect(this.testCollection.url).to.include('/core/logs/?@timestamp__range={"gte":');
            expect(this.testCollection.url).to.include('&interval=');
            expect(this.constructUrl_spy.callCount).to.equal(2);
            // should not construct url
            this.testView.isZoomed = true;
            this.testView.trigger('lookbackIntervalReached');
            expect(this.constructUrl_spy.callCount).to.equal(2);
            this.constructUrl_spy.restore();
        });
        it('should trigger paint new chart appropriately', function() {
            this.paintNewChart_spy = sinon.spy(this.testView, "paintNewChart");
            expect(this.paintNewChart_spy.callCount).to.equal(0);
            this.testView.paintNewChart([1000, 2000], 10);
            expect(this.paintNewChart_spy.callCount).to.equal(1);
            this.testView.dblclicked([1000, 2000]);
            expect(this.paintNewChart_spy.callCount).to.equal(2);
            this.paintNewChart_spy.restore();
        });
        it('should construct new collection url\'s appropriately via paintNewChart functionality', function() {
            var time2 = 1421085130000;
            var time1 = time2 - (1000 * 60 * 60);
            this.testView.render();
            this.testView.update();
            // no mult
            this.testView.paintNewChart([time1, time2]);
            expect(this.testCollection.url).to.include('/core/logs/?@timestamp__range={"gte":');
            expect(this.testCollection.url).to.include('}&interval=0.5s');
            // mult >= 1
            this.testView.paintNewChart([time1, time2], 10);
            expect(this.testCollection.url).to.include('/core/logs/?@timestamp__range={"gte":');
            // mult < 1
            this.testView.paintNewChart([time1, time2], 0.5);
            expect(this.testCollection.url).to.include('/core/logs/?@timestamp__range={"gte":');
        });
    });
});
