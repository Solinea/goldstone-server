/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('MultiRscsView.js spec', function() {
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
        it('errorTrigger appends an error message', function() {
            this.testView.trigger('errorTrigger', []);
            expect($(this.testView.el).text()).to.not.contain('happy flowers');
            this.testView.trigger('errorTrigger', [{
                responseText: 'happy flowers'
            }]);
            expect($(this.testView.el).text()).to.contain('happy flowers');
        });
        it('clicking info button brings up info text', function() {
            expect($(this.testView.el).text()).to.not.contain('additional resource info');
            $(this.testView.el).find('#info-button').click();
            expect($(this.testView.el).text()).to.contain('additional resource info');
            $(this.testView.el).find('#info-button').mouseout();
        });
    });
});
