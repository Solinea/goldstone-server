/*global todo, chai, describe, it*/
//unit tests

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

describe('the Backbone Objects', function() {
    describe('the Backbone object', function() {
        it('should exist', function() {
            expect(Backbone).to.be.an('object');
        });
    });
    describe('the Model object', function() {
        it('should exist', function() {
            expect(ApiPerfModel).to.be.a('function');
        });
    });
    describe('the Collection object', function() {
        it('should exist', function() {
            expect(ApiPerfCollection).to.be.a('function');
        });
    });
    describe('the View object', function() {
        it('should exist', function() {
            expect(ApiPerfView).to.be.a('function');
        });
    });
});


describe('The Goldstone namespace', function() {
    describe('The main object', function() {
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
    });

    describe('The time namespace', function() {

        it('should return dates with the correct formatting and order of magnitude', function() {
            var time1 = goldstone.time.fromPyTs(42);
            var time2 = goldstone.time.fromPyTs('42');
            expect(time1 * 1).to.equal(42000);
            expect(time2 * 1).to.equal(42000);

            time1 = goldstone.time.toPyTs(42000);
            expect(time1*1).to.equal(42);

            var testDate = new Date();
            time2 = goldstone.time.toPyTs(testDate);
            expect(time2*1).to.equal(Math.round((testDate*1)/1000)).toString();
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
            expect(test3).to.be.a('date');

        });

    });


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
