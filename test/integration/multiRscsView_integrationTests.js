/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('discover.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        assert.lengthOf($('#multi-rsrc-panel'), 0);

        this.testView = new MultiRscsView({
            el: '.test-container'
        });

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('triggers MultiRscsView', function() {
            assert.isDefined($('.test-container'));
            assert.isDefined($('#multi-rsrc-panel'));
            assert.lengthOf($('#multi-rsrc-panel'), 1);
        });
    });
});
