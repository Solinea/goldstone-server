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
            // expect(ApiPerfModel).to.be.a('function');
            // expect(EventTimelineModel).to.be.a('function');
            // expect(GoldstoneColors).to.be.a('function');
            // expect(HypervisorModel).to.be.a('function');
            // expect(HypervisorVmCpuModel).to.be.a('function');
            // expect(InfoButtonText).to.be.a('function');
            // expect(NodeAvailModel).to.be.a('function');
            // expect(ServiceStatusModel).to.be.a('function');
            // expect(UtilizationModel).to.be.a('function');
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
                expect(goldstone.time).to.have.property('fromPyTs');
                expect(goldstone.time).to.have.property('toPyTs');
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
        });
    });

    describe('Testing date functions', function() {
        it('should properly compute date additions/subtractions', function() {
            var d = new Date();
            var dPlus = new Date(d.getTime());
            dPlus.addSeconds(1);
            expect(dPlus.getTime()).to.equal(d.getTime() + 1000);

            d = new Date();
            var dMinus = new Date(d.getTime());
            dMinus.addSeconds(-1);
            expect(dMinus.getTime()).to.equal(d.getTime() - 1000);

            d = new Date();
            dMinus = new Date(d.getTime());
            dMinus.addSeconds(0);
            expect(dMinus.getTime()).to.equal(d.getTime());

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addMinutes(1);
            expect(dPlus.getTime()).to.equal(d.getTime() + (60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addMinutes(-1);
            expect(dPlus.getTime()).to.equal(d.getTime() - (60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addMinutes(0);
            expect(dPlus.getTime()).to.equal(d.getTime());

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addHours(1);
            expect(dPlus.getTime()).to.equal(d.getTime() + (60 * 60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addHours(-1);
            expect(dPlus.getTime()).to.equal(d.getTime() - (60 * 60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addHours(0);
            expect(dPlus.getTime()).to.equal(d.getTime());

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addDays(1);
            expect(dPlus.getTime()).to.equal(d.getTime() + (24 * 60 * 60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addDays(-1);
            expect(dPlus.getTime()).to.equal(d.getTime() - (24 * 60 * 60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addDays(0);
            expect(dPlus.getTime()).to.equal(d.getTime());

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addWeeks(1);
            expect(dPlus.getTime()).to.equal(d.getTime() + (7 * 24 * 60 * 60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addWeeks(-1);
            expect(dPlus.getTime()).to.equal(d.getTime() - (7 * 24 * 60 * 60 * 1000));

            d = new Date();
            dPlus = new Date(d.getTime());
            dPlus.addWeeks(0);
            expect(dPlus.getTime()).to.equal(d.getTime());
        });
    });
});
