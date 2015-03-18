/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('loginPageView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith(404, '{auth_token: 12345}');
        data = [];

        this.testView = new LoginPageView({
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
        it('stores auth tokens', function() {
            this.testView.storeAuthToken('hoo_hah');
            expect(localStorage.getItem('userToken')).to.equal('hoo_hah');
        });
        it('triggers login form submit', function() {
            $('input.form-control').val('a');
            $('input.form-control').next().val('a');
            $('form.login-form').submit();
            this.server.respond();
        });
    });
});
