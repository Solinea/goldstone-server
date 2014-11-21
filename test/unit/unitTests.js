/*global todo, chai, describe, it*/
//unit tests

describe('Testing The Backbone Objects', function() {

    describe('The Backbone Objects should exist', function() {
        describe('the Backbone/jQuery/underscore objects', function() {
            it('should exist', function() {
                expect(Backbone).to.be.an('object');
                expect($).to.be.a('function');
                expect(_).to.be.a('function');
                expect(d3).to.be.an('object');
            });
        });
    });
    describe('the Model objects', function() {
        it('should exist', function() {
            expect(ApiPerfModel).to.be.a('function');
            expect(EventTimelineModel).to.be.a('function');
            expect(GoldstoneColors).to.be.a('function');
            expect(HypervisorModel).to.be.a('function');
            expect(HypervisorVmCpuModel).to.be.a('function');
            expect(InfoButtonText).to.be.a('function');
            expect(NodeAvailModel).to.be.a('function');
            expect(ServiceStatusModel).to.be.a('function');
            expect(UtilizationModel).to.be.a('function');
        });
    });
    describe('the Collection objects', function() {
        it('should exist', function() {
            expect(ApiPerfCollection).to.be.a('function');
            expect(EventTimelineCollection).to.be.a('function');
            expect(HypervisorCollection).to.be.a('function');
            expect(HypervisorVmCpuCollection).to.be.a('function');
            expect(NodeAvailCollection).to.be.a('function');
            expect(ServiceStatusCollection).to.be.a('function');
            expect(UtilizationCpuCollection).to.be.a('function');
            expect(UtilizationMemCollection).to.be.a('function');
            expect(UtilizationNetCollection).to.be.a('function');
        });
    });
    describe('the View objects', function() {
        it('should exist', function() {
            expect(ApiPerfReportView).to.be.a('function');
            expect(ApiPerfView).to.be.a('function');
            expect(ChartHeaderView).to.be.a('function');
            expect(EventsReportView).to.be.a('function');
            expect(EventTimelineView).to.be.a('function');
            expect(GlanceReportView).to.be.a('function');
            expect(GlobalLookbackRefreshButtonsView).to.be.a('function');
            expect(HypervisorView).to.be.a('function');
            expect(HypervisorVmCpuView).to.be.a('function');
            expect(KeystoneReportView).to.be.a('function');
            expect(NeutronReportView).to.be.a('function');
            expect(NodeAvailView).to.be.a('function');
            expect(NodeReportView).to.be.a('function');
            expect(NovaReportView).to.be.a('function');
            expect(ReportsReportView).to.be.a('function');
            expect(ServiceStatusView).to.be.a('function');
            expect(UtilizationCpuView).to.be.a('function');
            expect(UtilizationMemView).to.be.a('function');
            expect(UtilizationNetView).to.be.a('function');
        });
    });

});

describe('Testing the base.js file', function() {

    describe('The Goldstone namespace', function() {
        describe('The main Goldstone object', function() {
            it('should exist', function() {
                expect(goldstone).to.be.an('object');
            });
            it('should create namespaced objects', function() {
                goldstone.namespace('captain.beefheart');
                expect(goldstone.captain.beefheart).to.be.an('object');
                expect(goldstone).to.have.property('captain');
                expect(goldstone.captain).to.have.property('beefheart');
                delete goldstone.captain;
                expect(goldstone).to.not.have.property('captain');
            });
            it('goldstone.uuid should create unique vals', function() {
                var testUuid1 = goldstone.uuid()();
                var testUuid2 = goldstone.uuid()();
                expect(testUuid1).to.be.length(36);
                expect(testUuid2).to.be.length(36);
                expect(testUuid1).to.not.equal(testUuid2);
            });
            it('should contain the following methods or properties', function() {
                expect(goldstone).to.have.property('raiseError');
                expect(goldstone).to.have.property('raiseDanger');
                expect(goldstone).to.have.property('raiseWarning');
                expect(goldstone).to.have.property('raiseSuccess');
                expect(goldstone).to.have.property('raiseInfo');
                expect(goldstone).to.have.property('raiseAlert');
                expect(goldstone).to.have.property('uuid');
                expect(goldstone).to.have.property('populateSettingsFields');
                expect(goldstone).to.have.property('isRefreshing');
                expect(goldstone).to.have.property('getRefreshInterval');
                expect(goldstone.time).to.have.property('fromPyTs');
                expect(goldstone.time).to.have.property('toPyTs');
                expect(goldstone.time).to.have.property('paramToDate');
                expect(goldstone.time).to.have.property('getDateRange');
                expect(goldstone.time).to.have.property('autoSizeInterval');
                expect(goldstone.time).to.have.property('processTimeBasedChartParams');
                expect(goldstone.charts).to.have.property('barChartBase');
                expect(goldstone.charts).to.have.property('lineChartBase');
                expect(goldstone.charts).to.have.property('bivariateWithAverage');
                expect(goldstone.charts).to.have.property('topologyTree');
                expect(goldstone).to.have.property('jsIncluded');
                expect(goldstone.settings.charts.margins).to.have.property('top');
                expect(goldstone.settings.charts.margins).to.have.property('bottom');
                expect(goldstone.settings.charts.margins).to.have.property('right');
                expect(goldstone.settings.charts.margins).to.have.property('left');
                expect(goldstone.settings.charts.maxChartPoints).to.equal(100);
            });
        });
        describe('the utility functions', function() {
            it('date.prototype.functions', function() {
                var a = new Date(10000000);
                expect(a).to.be.a('date');
                var b = +new Date(a.addSeconds(1));
                expect(b).to.equal(10001000);
                b = +new Date(a.addMinutes(1));
                expect(b).to.equal(10061000);
                b = +new Date(a.addHours(1));
                expect(b).to.equal(13661000);
                b = +new Date(a.addDays(1));
                expect(b).to.equal(100061000);
                b = +new Date(a.addWeeks(1));
                expect(b).to.equal(704861000);
            });
            it('jsIncluded', function() {
                var test1 = goldstone.jsIncluded("blahDeBlah");
                assert.isFalse(test1);
            });
        });

        describe('The time namespace', function() {
            it('should return dates with the correct formatting and order of magnitude', function() {
                var time1 = goldstone.time.fromPyTs(42);
                var time2 = goldstone.time.fromPyTs('42');
                expect(time1 * 1).to.equal(42000);
                expect(time2 * 1).to.equal(42000);

                time1 = goldstone.time.toPyTs(42000);
                expect(time1 * 1).to.equal(42);

                var testDate = new Date();
                time2 = goldstone.time.toPyTs(testDate);
                expect(time2 * 1).to.equal(Math.round((testDate * 1) / 1000)).toString();

                var time3 = new Date(1412376991712);
                var timeTest3 = goldstone.time.toPyTs(time3);
                expect(timeTest3).to.equal('1412376992');
            });

            it('should return dates from numerical input', function() {
                var date1 = new Date();
                var test1 = goldstone.time.paramToDate(date1);
                expect(test1).to.equal(date1);
                var date2 = 1411068920090;
                var date3 = '1411068920090';
                var checkDate = new Date(date2);
                var test2 = goldstone.time.paramToDate(date2);
                expect(test2).to.be.a('date');
                var test3 = goldstone.time.paramToDate(date3);
                expect(test2).to.be.a('date');
            });

            it('testing autoSizeInterval', function() {
                var start = new Date(1411067920090);
                var end = new Date(1411068920090);
                var maxPoints = 10;
                var test1 = goldstone.time.autoSizeInterval(start, end, maxPoints);

                expect(test1).to.be.a('string');
                expect(test1).to.be.equal('100s');

                maxPoints = undefined;
                var test2 = goldstone.time.autoSizeInterval(start, end, maxPoints);

                expect(test2).to.be.a('string');
                expect(test2).to.equal('10s');
                expect(goldstone.settings.charts.maxChartPoints).to.equal(100);
            });

            it('testing processTimeBasedChartParams', function() {
                var start = new Date(1411067920090);
                var end = new Date(1411068920090);

                var test1 = goldstone.time.processTimeBasedChartParams(end, start, maxPoints);

                expect(test1.start).to.be.a('date');
                expect(test1.end).to.be.a('date');
                assert.isUndefined(test1.interval);
                assert.deepEqual(test1.start, new Date(start));
                assert.deepEqual(test1.end, new Date(end));

                var maxPoints = 10;
                var test2 = goldstone.time.processTimeBasedChartParams(end, start, maxPoints);

                expect(test2.start).to.be.a('date');
                expect(test2.end).to.be.a('date');
                expect(test2.interval).to.be.a('string');
                expect(test2.interval).to.equal('100s');

                assert.deepEqual(test2.start, new Date(start));
                assert.deepEqual(test2.end, new Date(end));

                maxPoints = 100;
                var test3 = goldstone.time.processTimeBasedChartParams(end, start, maxPoints);
                expect(test3.interval).to.equal('10s');

                end = undefined;
                start = undefined;
                maxPoints = 10;

                var test4 = goldstone.time.processTimeBasedChartParams(end, start, maxPoints);

                expect(test4.end).to.be.a('date');
                expect(test4.start).to.be.a('date');
                expect(test4.interval).to.be.a('string');
                expect(test4.interval).to.equal('60480s');

                expect(goldstone.settings.charts.maxChartPoints).to.equal(100);
            });
        });
    });
});

describe('Testing the various library js files', function() {

    describe('discover.js', function() {
        it('renderCharts', function() {
            expect(renderCharts).to.be.a('function');
        });
    });

    describe('glance.js', function() {
        it('goldstone.glance.apiPerf.url', function() {
            expect(goldstone.glance.apiPerf.url).to.be.a('function');
        });
        it('should return a different result based on the input', function() {
            var test1 = goldstone.glance.apiPerf.url(10000, 10000, '100s', true);
            var test2 = goldstone.glance.apiPerf.url();
            expect(test1).to.equal('/glance/api_perf?start=10&end=10&interval=100s&render=true');
            expect(test2).to.equal('/glance/api_perf?start=undefined&end=undefined&interval=undefined');
        });
        it('goldstone.glance.topology.url', function() {
            expect(goldstone.glance.topology.url).to.be.a('function');
        });
        it('should return a different result based on the input', function() {
            var test1 = goldstone.glance.topology.url(true);
            var test2 = goldstone.glance.topology.url('hotdog');
            var test3 = goldstone.glance.topology.url();
            var test4 = goldstone.glance.topology.url(false);
            expect(test1).to.equal('/glance/topology?render=true');
            expect(test2).to.equal('/glance/topology?render=hotdog');
            expect(test3).to.equal('/glance/topology');
            expect(test4).to.equal('/glance/topology?render=false');
        });
    });

    describe('goldstone.js', function() {
        it('topology.url should exist', function() {
            expect(goldstone.goldstone.topology.url).to.be.a('function');
        });
        it('topology.url should return a different result based on the input', function() {
            var test1 = goldstone.goldstone.topology.url('notUndefined');
            var test2 = goldstone.goldstone.topology.url();
            expect(test1).to.equal('/topology?render=notUndefined');
            expect(test2).to.equal('/topology');
        });
        it('hostAvail.url should exist and return a predictable result', function() {
            expect(goldstone.goldstone.hostAvail.url).to.be.a('function');
            var test3 = goldstone.goldstone.hostAvail.url();
            expect(test3).to.equal('/logging/nodes');
        });
    });

    describe('intelligence.js', function() {
        it('_toPyTs returns a rounded string: utc dates / 1000', function() {
            expect(_toPyTs).to.be.a('function');
            var test1 = _toPyTs(1000000);
            expect(test1).to.equal('1000');
            expect(test1).to.not.equal(1000);
            var a = new Date(2000000);
            var test2 = _toPyTs(a);
            expect(test2).to.equal('2000');
            expect(test2).to.not.equal(2000);
            a = new Date(2000050);
            var test3 = _toPyTs(a);
            expect(test3).to.equal('2000');
        });
        it('_autoSizeTimeInterval returns 1/1000 * a time difference', function() {
            expect(_autoSizeTimeInterval).to.be.a('function');
            var a = new Date(10000000);
            var b = new Date(10009000);
            var test1 = _autoSizeTimeInterval(a,b,100);
            expect(test1).to.equal(9/100);
            var test2 = _autoSizeTimeInterval(b,a,100);
            expect(test2).to.equal(-9/100);
        });
        it('_paramToDate returns a date whether it\'s originally a date object or not', function() {
            expect(_paramToDate).to.be.a('function');
            var a = new Date(10000000);
            var b = (100090000000);
            var c = (new Date(b));
            var test1 = _paramToDate(a);
            expect(test1).to.equal(a);
            var test2 = _paramToDate(b);
            expect(test2).to.deep.equal(c);
        });
    it('_processTimeBasedChartParams returns start/end/interval specs', function() {
        expect(_processTimeBasedChartParams).to.be.a('function');
        var a = (1000000000000);
        var b = (1000000000000);
        var c = 1000;
        var test1 = _processTimeBasedChartParams(a,b,c);
        expect(test1.start).to.deep.equal(new Date(a));
        expect(test1.end).to.deep.equal(new Date(b));
        expect(test1.interval).to.equal('0s');
        a = 1000000400000;
        var test2 = _processTimeBasedChartParams(a);
        expect(test2.start).to.deep.equal((new Date(a)).addWeeks(-1));
        expect(test2.end).to.deep.equal(new Date(a));
        expect(test2.interval).to.equal(undefined);
        a = 1000000900000;
        var test3 = _processTimeBasedChartParams(a, undefined, 100);
        expect(test3.start).to.deep.equal((new Date(a)).addWeeks(-1));
        expect(test3.end).to.deep.equal(new Date(a));
        expect(test3.interval).to.equal('6048s');
    });
});

_processTimeBasedChartParams(1000000000000, 1000000000000,  1000);

    describe('neutron.js', function() {
        it('topology.url should exist', function() {
            expect(goldstone.goldstone.topology.url).to.be.a('function');
        });
        it('timeRange._url should return a different result based on the input', function() {
            var ns = {};
            ns.start = 1413612792;
            ns.end = 1414217592;
            ns.interval = '3600s';
            var test1 = goldstone.neutron.timeRange._url(ns, 20000, 30000, 3, 4, 'chicharones');
            var test2 = goldstone.neutron.timeRange._url(ns);
            expect(test1).to.equal('chicharones?start=20&end=30&interval=3&render=4');
            expect(test2).to.equal('undefined?start=1413613&end=1414218&interval=3600s');
        });
        it('apiPerf.url disregards path argument, if any', function() {
            var test1 = goldstone.neutron.apiPerf.url(20000, 30000, 3, 4, 'chicharones');
            var test2 = goldstone.neutron.apiPerf.url(20000, 30000, 3, 4);
            var test3 = goldstone.neutron.apiPerf.url();
            expect(test1).to.equal('/neutron/api_perf?start=20&end=30&interval=3&render=4');
            expect(test2).to.equal('/neutron/api_perf?start=20&end=30&interval=3&render=4');
            expect(test3).to.equal('/neutron/api_perf?start=undefined&end=undefined&interval=undefined');
        });
    });

});
