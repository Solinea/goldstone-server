/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('settingsPageView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'test unauthorized']);

        this.testView = new SettingsPageView({
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
            this.testView.submitRequest();
            this.server.respond();
            this.testView.getUserSettings();
            this.server.respond();
            this.testView.addHandlers();
            $('.settings-form').submit();
            $('.password-reset-form').submit();
        });
    });
    describe('individual functions', function() {
        it('trims input', function() {
            // append input field
            $('body').append('<input name="test1" type="text">');
            // set input field to 'hello'
            $('[name="test1"]').val('hello');
            expect($('[name="test1"]').val()).to.equal('hello');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
            // set input field to ' hello'
            $('[name="test1"]').val(' hello');
            expect($('[name="test1"]').val()).to.equal(' hello');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
            // set input field to 'hello '
            $('[name="test1"]').val('hello ');
            expect($('[name="test1"]').val()).to.equal('hello ');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
        });
    });
});
