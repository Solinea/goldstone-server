/*global todo, chai, describe, it*/
//unit tests

var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

describe('the ApiPerfCollection', function() {

    describe('Backbone Collection object', function() {
        it('should exist', function() {
            expect(ApiPerfCollection).to.be.a('function');
        });
    });

});
