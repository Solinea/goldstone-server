/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('LogoutIcon.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "accounts/login", [200, {
            "Content-Type": "application/json"
        }, '[]']);
        data = [];

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
            this.testView.checkForToken();
            localStorage.setItem('userToken', 'here_i_am!');
            this.testView.checkForToken();
        });
    });
});
