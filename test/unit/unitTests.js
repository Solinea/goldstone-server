/*global todo, chai, describe, it*/
//unit tests

describe('Testing ApiPerf Objects', function() {

    describe('the Backbone Objects', function() {
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
            expect(NodeAvailModel).to.be.a('function');
        });
    });
    describe('the Collection objects', function() {
        it('should exist', function() {
            expect(ApiPerfCollection).to.be.a('function');
            expect(EventTimelineCollection).to.be.a('function');
            expect(NodeAvailCollection).to.be.a('function');
        });
    });
    describe('the View objects', function() {
        it('should exist', function() {
            expect(ApiPerfView).to.be.a('function');
            expect(EventTimelineView).to.be.a('function');
            expect(NodeAvailView).to.be.a('function');
        });
    });

});

describe('Testing the base.js file', function() {

    describe('The Goldstone namespace', function() {
        describe('The main Goldstone object', function() {
            it('should exist', function() {
                expect(goldstone).to.be.an('object');
            });
            it('should contain namespaced objects', function() {
                goldstone.namespace('captain.beefheart');
                expect(goldstone.captain.beefheart).to.be.an('object');
                expect(goldstone).to.have.property('captain');
                expect(goldstone.captain).to.have.property('beefheart');
                delete goldstone.captain;
            });
            it('should create unique uuids', function() {
                var testUuid1 = goldstone.uuid()();
                var testUuid2 = goldstone.uuid()();
                expect(testUuid1).to.be.length(36);
                expect(testUuid2).to.be.length(36);
                expect(testUuid1).to.not.equal(testUuid2);
            });
            it('should contain the following methods or properties', function(){
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

            it('testing autoSizeInterval', function(){
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

            it('testing processTimeBasedChartParams', function(){
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

            it('testing processTimeBasedChartParams', function(){
                var test1 = goldstone.jsIncluded("blahDeBlah");
                assert.isFalse(test1);
            });


        });
    });
});

describe('Testing the goldstone.js file', function() {
    describe('The topology and hostAvail objects', function() {
        it('should exist', function() {
            expect(goldstone.goldstone.topology.url).to.be.a('function');
        });
        it('should return a different result based on the input', function() {
            var test1 = goldstone.goldstone.topology.url('notUndefined');
            var test2 = goldstone.goldstone.topology.url();
            expect(test1).to.equal('/topology?render=notUndefined');
            expect(test2).to.equal('/topology');
        });
        it('should exist and return a predictable result', function() {
            expect(goldstone.goldstone.hostAvail.url).to.be.a('function');
            var test3 = goldstone.goldstone.hostAvail.url();
            expect(test3).to.equal('/logging/nodes');
        });
    });
});
