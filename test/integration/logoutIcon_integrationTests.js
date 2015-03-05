/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('LogoutIcon.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("/ho/hum", [401, {
            "Content-Type": "application/json"
        }, 'test unauthorized']);

        this.testView = new LogoutIcon({
            el: '.test-container'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('renders view', function() {
            this.testView.render();
        });
        it('renders view with auth token', function() {
            this.testView.renderIfTokenPresent();
            localStorage.setItem('userToken', 'here_i_am!');
            this.testView.renderIfTokenPresent();
        });
        it('clears a token', function() {
            localStorage.setItem('userToken', 'fun1with2tokens3');
            expect(localStorage.getItem('userToken')).to.equal('fun1with2tokens3');
            this.testView.clearToken();
            expect(localStorage.getItem('userToken')).to.equal(null);
        });
        it('sets up request header params', function() {
            localStorage.setItem('userToken', 'now1i2can3haz4tokens5');
            this.testView.setAJAXSendRequestHeaderParams();
        });

    });
});
