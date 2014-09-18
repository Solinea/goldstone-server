/*global todo, chai, describe, it*/
var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;

describe('the ApiPerfCollection', function() {

    describe('the Collection object', function() {
        it('should exist', function() {
            expect(ApiPerfCollection).to.be.a('function');
        });
    });

});
