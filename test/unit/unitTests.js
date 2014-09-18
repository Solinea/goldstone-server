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


describe('The Goldstone object', function(){
    describe('The main object', function(){
        it('should exist', function(){
            expect(goldstone).to.be.an('object');
        });
        it('should contain namespaced objects', function(){
            goldstone.namespace('captain.beefheart');
            expect(goldstone.captain.beefheart).to.be.an('object');
            delete goldstone.captain;
        });
        it('should create unique uuids', function(){
            var testUuid1 = goldstone.uuid()();
            var testUuid2 = goldstone.uuid()();
            expect(testUuid1).to.be.length(36);
            expect(testUuid2).to.be.length(36);
            expect(testUuid1).to.not.equal(testUuid2);
        });
    });
});
